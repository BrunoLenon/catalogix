-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Admins can manage all products" ON products;

-- Create function to check if user is admin if not already exists
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
PARALLEL SAFE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
    AND active = true
  );
$$;

-- Create new policies for products
CREATE POLICY "Public read access"
  ON products FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Admin full access"
  ON products FOR ALL
  TO authenticated
  USING (is_admin());

-- Create policy for service role
CREATE POLICY "Service role access"
  ON products FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT ON products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO authenticated;
GRANT ALL ON products TO service_role;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO service_role;