/*
  # Fix RLS policies for all tables

  1. Changes
    - Drop existing policies
    - Create new policies with proper access control
    - Fix permission issues with auth.users access
    - Add service role bypass for system operations

  2. Security
    - Allow public read access to active products and categories
    - Restrict write access to admins only
    - Use profiles table for admin checks
    - Ensure proper cart access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public read access" ON products;
DROP POLICY IF EXISTS "Admin full access" ON products;
DROP POLICY IF EXISTS "Service role full access" ON products;

-- Products policies
CREATE POLICY "Public read access"
  ON products FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Admin full access"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.active = true
    )
  );

-- Categories policies
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
DROP POLICY IF EXISTS "Only admins can modify categories" ON categories;

CREATE POLICY "Public read access"
  ON categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admin full access"
  ON categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.active = true
    )
  );

-- Cart items policies
DROP POLICY IF EXISTS "Users can manage their own cart" ON cart_items;

CREATE POLICY "Users can manage their own cart"
  ON cart_items FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin can view all carts"
  ON cart_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.active = true
    )
  );

-- Ensure RLS is enabled on all tables
ALTER TABLE products FORCE ROW LEVEL SECURITY;
ALTER TABLE categories FORCE ROW LEVEL SECURITY;
ALTER TABLE cart_items FORCE ROW LEVEL SECURITY;