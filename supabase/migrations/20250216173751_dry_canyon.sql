/*
  # Fix products table RLS policies

  1. Changes
    - Drop existing policies that cause permission issues
    - Create new policies with proper access control
    - Add service role bypass for system operations

  2. Security
    - Allow public read access to active products
    - Restrict write access to admins
    - Enable service role access for system operations
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Only admins can modify products" ON products;

-- Create new policies
CREATE POLICY "Public read access to active products"
  ON products FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Admin full access"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );

-- Allow service role full access for system operations
CREATE POLICY "Service role full access"
  ON products FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE products FORCE ROW LEVEL SECURITY;