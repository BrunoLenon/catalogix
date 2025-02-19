-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view company settings" ON company_settings;
DROP POLICY IF EXISTS "Only admins can modify company settings" ON company_settings;
DROP POLICY IF EXISTS "Admins can manage company settings" ON company_settings;

-- Create new policies
CREATE POLICY "Public read access"
  ON company_settings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admin full access"
  ON company_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.active = true
    )
  );

-- Ensure there is at least one record
INSERT INTO company_settings (
  name,
  theme,
  footer,
  show_prices,
  login_image_url,
  login_image_text
)
SELECT 
  'Minha Empresa',
  jsonb_build_object(
    'backgroundColor', '#f3f4f6',
    'headerColor', '#ffffff',
    'footerColor', '#ffffff'
  ),
  jsonb_build_object(
    'companyName', 'Minha Empresa',
    'cnpj', '',
    'address', ''
  ),
  true,
  '',
  ''
WHERE NOT EXISTS (SELECT 1 FROM company_settings);

-- Ensure RLS is enabled
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT ON company_settings TO anon;
GRANT SELECT ON company_settings TO authenticated;
GRANT ALL ON company_settings TO service_role;