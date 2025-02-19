-- Drop existing policies
DROP POLICY IF EXISTS "Public read access" ON profiles;
DROP POLICY IF EXISTS "Admin full access" ON profiles;
DROP POLICY IF EXISTS "Self profile management" ON profiles;
DROP POLICY IF EXISTS "Profile creation" ON profiles;
DROP POLICY IF EXISTS "Service role access" ON profiles;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
PARALLEL SAFE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
    AND active = true
  );
$$;

-- Create new policies
CREATE POLICY "Public read access"
  ON profiles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admin full access"
  ON profiles FOR ALL
  TO authenticated
  USING (is_admin());

CREATE POLICY "Self profile management"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Create a policy specifically for profile creation
CREATE POLICY "Profile creation"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Admins can create any profile
    is_admin()
    OR
    -- Users can only create their own profile during registration
    id = auth.uid()
  );

-- Create a policy for service role
CREATE POLICY "Service role access"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  default_role text := 'customer';
  new_role text;
BEGIN
  -- Determine role
  new_role := COALESCE(new.raw_user_meta_data->>'role', default_role);
  
  -- Set role in app metadata
  new.raw_app_meta_data := jsonb_build_object(
    'role', new_role,
    'provider', COALESCE(new.raw_app_meta_data->>'provider', 'email'),
    'providers', COALESCE(new.raw_app_meta_data->'providers', '["email"]'::jsonb)
  );

  -- Create profile using service role context
  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    role,
    active
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new_role,
    true
  );
  
  RETURN new;
END;
$$;

-- Create function to create user with permissions
CREATE OR REPLACE FUNCTION create_user_with_permissions(
  p_email text,
  p_full_name text,
  p_role text,
  p_permissions text[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Check if calling user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can create users';
  END IF;

  -- Create profile
  INSERT INTO profiles (
    id,
    username,
    full_name,
    role,
    active
  ) VALUES (
    gen_random_uuid(),
    p_email,
    p_full_name,
    p_role,
    true
  )
  RETURNING id INTO v_user_id;

  -- Add permissions if any are provided
  IF array_length(p_permissions, 1) > 0 THEN
    INSERT INTO user_permissions (
      user_id,
      permission_id,
      granted_by
    )
    SELECT 
      v_user_id,
      p.id,
      auth.uid()
    FROM permissions p
    WHERE p.name = ANY(p_permissions);
  END IF;

  RETURN v_user_id;
END;
$$;

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

GRANT SELECT ON profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO service_role;
GRANT EXECUTE ON FUNCTION create_user_with_permissions(text, text, text, text[]) TO authenticated;

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();