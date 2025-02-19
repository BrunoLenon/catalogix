/*
  # Fix profiles table RLS policies

  1. Changes
    - Drop existing policies
    - Create new policies with proper access control
    - Fix permission issues with profile management
    - Add service role bypass for system operations

  2. Security
    - Allow public read access to basic profile info
    - Allow users to manage their own profiles
    - Allow admins to manage all profiles
    - Use proper JWT claims for role checks
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view basic profile info" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Service role has full access" ON profiles;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_app_meta_data->>'role')::text = 'admin'
  );
$$;

-- Create new policies
CREATE POLICY "Public read access"
  ON profiles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Self profile management"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admin full access"
  ON profiles FOR ALL
  TO authenticated
  USING (is_admin());

CREATE POLICY "Service role bypass"
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
  
  -- Set role in app metadata (used in JWT claims)
  new.raw_app_meta_data := jsonb_build_object(
    'role', new_role,
    'provider', COALESCE(new.raw_app_meta_data->>'provider', 'email'),
    'providers', COALESCE(new.raw_app_meta_data->'providers', '["email"]'::jsonb)
  );

  -- Create profile using service role
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
GRANT SELECT, UPDATE ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO service_role;