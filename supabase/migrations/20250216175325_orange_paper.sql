/*
  # Fix user and admin permissions

  1. Changes
    - Simplify RLS policies
    - Fix admin role checks
    - Improve permission handling

  2. Security
    - Maintain proper access control
    - Use app_metadata for role checks
    - Keep role-based security
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service can create profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;

-- Create new profile policies
CREATE POLICY "Public profile access"
  ON profiles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Self profile management"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admin profile management"
  ON profiles FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

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
  -- Set role in app metadata
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