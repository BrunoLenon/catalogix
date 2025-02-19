/*
  # Fix profiles table RLS policies

  1. Changes
    - Drop existing policies
    - Create new policies with proper access control
    - Fix admin user creation issues
    - Add service role bypass for system operations

  2. Security
    - Allow public read access to basic profile info
    - Allow users to manage their own profiles
    - Allow admins to manage all profiles
    - Add service role access for system operations
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can view basic profile info" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Create new policies
CREATE POLICY "Anyone can view basic profile info"
  ON profiles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can manage all profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_app_meta_data->>'role')::text = 'admin'
    )
  );

CREATE POLICY "Service role has full access"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Update handle_new_user function to properly set role
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  default_role text := 'customer';
BEGIN
  -- Set role in app metadata
  new.raw_app_meta_data := 
    jsonb_build_object(
      'role', COALESCE(new.raw_user_meta_data->>'role', default_role),
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
    COALESCE(new.raw_user_meta_data->>'role', default_role),
    true
  );
  
  RETURN new;
END;
$$;

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT ON profiles TO anon;
GRANT SELECT, UPDATE ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;