-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
DROP POLICY IF EXISTS "Only admins can modify categories" ON categories;
DROP POLICY IF EXISTS "Public read access" ON categories;
DROP POLICY IF EXISTS "Admin full access" ON categories;

-- Create new policies for categories
CREATE POLICY "Public read access"
  ON categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admin full access"
  ON categories FOR ALL
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
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT ON categories TO anon;
GRANT SELECT ON categories TO authenticated;
GRANT ALL ON categories TO service_role;