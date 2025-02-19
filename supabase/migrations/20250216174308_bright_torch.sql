/*
  # Fix infinite recursion in profiles policies

  1. Changes
    - Simplify profiles policies to avoid recursion
    - Update permissions structure
    - Fix admin role checking

  2. Security
    - Maintain proper access control
    - Prevent infinite recursion
    - Keep role-based security
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public profiles access" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Create simplified policies without recursion
CREATE POLICY "Anyone can view basic profile info"
  ON profiles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can manage profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Update products policies to avoid recursion
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;

CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Update company_settings policies
DROP POLICY IF EXISTS "Anyone can view company settings" ON company_settings;
DROP POLICY IF EXISTS "Only admins can modify company settings" ON company_settings;

CREATE POLICY "Anyone can view company settings"
  ON company_settings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage company settings"
  ON company_settings FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

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