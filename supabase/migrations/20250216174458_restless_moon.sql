/*
  # Fix authentication and RLS issues

  1. Changes
    - Update RLS policies to properly handle profile creation
    - Fix admin access controls
    - Add proper grants for auth operations

  2. Security
    - Maintain proper access control
    - Allow profile creation during signup
    - Keep role-based security
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public profile access" ON profiles;
DROP POLICY IF EXISTS "Self profile management" ON profiles;
DROP POLICY IF EXISTS "Admin profile management" ON profiles;

-- Create new profile policies
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Service can create profiles"
  ON profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Admins can manage profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_app_meta_data->>'role')::text = 'admin'
    )
  );

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  default_role text := 'customer';
BEGIN
  -- Set default role in app metadata
  new.raw_app_meta_data := 
    jsonb_build_object(
      'role', COALESCE(new.raw_user_meta_data->>'role', default_role),
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
    COALESCE(new.raw_user_meta_data->>'role', default_role),
    true
  );
  
  RETURN new;
END;
$$;