-- Drop existing policies
DROP POLICY IF EXISTS "Public read access" ON profiles;
DROP POLICY IF EXISTS "Self profile management" ON profiles;
DROP POLICY IF EXISTS "Admin full access" ON profiles;
DROP POLICY IF EXISTS "Service role bypass" ON profiles;

-- Create function to check if user is admin with caching
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
PARALLEL SAFE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_app_meta_data->>'role')::text = 'admin'
  );
$$;

-- Create new policies with proper INSERT permissions
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

CREATE POLICY "Allow profile creation"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow admins to create any profile
    is_admin()
    OR
    -- Allow service role to create profiles
    (SELECT current_setting('role') = 'service_role')
    OR
    -- Allow users to create their own profile
    id = auth.uid()
  );

-- Update handle_new_user function to use service role
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
  
  -- Set role in app metadata (used in JWT claims)
  new.raw_app_meta_data := jsonb_build_object(
    'role', new_role,
    'provider', COALESCE(new.raw_app_meta_data->>'provider', 'email'),
    'providers', COALESCE(new.raw_app_meta_data->'providers', '["email"]'::jsonb)
  );

  -- Create profile
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