/*
  # Fix infinite recursion in database policies

  1. Changes
    - Remove all recursive policy checks
    - Simplify role-based access control
    - Use direct role checks from auth.users metadata

  2. Security
    - Maintain proper access control
    - Prevent infinite recursion
    - Keep role-based security
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can view basic profile info" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;
DROP POLICY IF EXISTS "Anyone can view company settings" ON company_settings;
DROP POLICY IF EXISTS "Admins can manage company settings" ON company_settings;

-- Create simplified profile policies
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

-- Create simplified product policies
CREATE POLICY "Public product access"
  ON products FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Admin product management"
  ON products FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create simplified company settings policies
CREATE POLICY "Public company settings access"
  ON company_settings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admin company settings management"
  ON company_settings FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Update handle_new_user function to set role in JWT claims
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
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
    COALESCE(new.raw_user_meta_data->>'role', 'customer'),
    true
  );

  -- Set role in JWT claims
  new.raw_app_meta_data := 
    jsonb_build_object(
      'role', COALESCE(new.raw_user_meta_data->>'role', 'customer'),
      'provider', COALESCE(new.raw_app_meta_data->>'provider', 'email'),
      'providers', COALESCE(new.raw_app_meta_data->'providers', '["email"]'::jsonb)
    );

  RETURN new;
END;
$$;

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT ON profiles TO anon;
GRANT SELECT, UPDATE ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;

GRANT SELECT ON products TO anon;
GRANT SELECT ON products TO authenticated;
GRANT ALL ON products TO service_role;

GRANT SELECT ON company_settings TO anon;
GRANT SELECT ON company_settings TO authenticated;
GRANT ALL ON company_settings TO service_role;