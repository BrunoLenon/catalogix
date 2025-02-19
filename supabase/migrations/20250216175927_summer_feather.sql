/*
  # Fix user permissions and access control

  1. Changes
    - Set up proper RLS policies for all tables
    - Fix admin access permissions
    - Ensure proper user access restrictions
    - Add default permissions for new users

  2. Security
    - Maintain proper access control
    - Prevent unauthorized access
    - Ensure admin privileges
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Public profile access" ON profiles;
DROP POLICY IF EXISTS "Self profile management" ON profiles;
DROP POLICY IF EXISTS "Admin profile management" ON profiles;

-- Profiles policies
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
  USING (auth.jwt() ->> 'role' = 'admin');

-- Products policies
DROP POLICY IF EXISTS "Public product access" ON products;
DROP POLICY IF EXISTS "Admin product management" ON products;

CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Admins can manage all products"
  ON products FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Categories policies
DROP POLICY IF EXISTS "Public read access" ON categories;
DROP POLICY IF EXISTS "Admin full access" ON categories;

CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Cart items policies
DROP POLICY IF EXISTS "Users can manage their own cart" ON cart_items;
DROP POLICY IF EXISTS "Admin can view all carts" ON cart_items;

CREATE POLICY "Users can manage their own cart"
  ON cart_items FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all carts"
  ON cart_items FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Company settings policies
DROP POLICY IF EXISTS "Public company settings access" ON company_settings;
DROP POLICY IF EXISTS "Admin company settings management" ON company_settings;

CREATE POLICY "Anyone can view company settings"
  ON company_settings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage company settings"
  ON company_settings FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Orders policies
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON orders;

CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Users can create their own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all orders"
  ON orders FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Order items policies
DROP POLICY IF EXISTS "Users can view their order items" ON order_items;
DROP POLICY IF EXISTS "Users can create their order items" ON order_items;

CREATE POLICY "Users can view their own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin')
    )
  );

CREATE POLICY "Users can create their own order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all order items"
  ON order_items FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Ensure RLS is enabled on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;