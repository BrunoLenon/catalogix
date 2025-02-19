/*
  # Fix products table permissions

  1. Changes
    - Drop and recreate products table policies
    - Enable proper public access to products
    - Fix permission issues with auth.users access
    - Ensure proper RLS configuration

  2. Security
    - Allow public read access to active products
    - Restrict write access to admins only
    - Remove dependency on auth.users table
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public read access" ON products;
DROP POLICY IF EXISTS "Admin full access" ON products;
DROP POLICY IF EXISTS "Service role full access" ON products;

-- Create new policies for products
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.active = true
    )
  );

-- Ensure RLS is enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT ON products TO anon;
GRANT SELECT ON products TO authenticated;
GRANT ALL ON products TO service_role;