/*
  # Fix company settings table and ensure initial data

  1. Changes
    - Ensure company_settings table exists with all required columns
    - Add initial data if table is empty
    - Update RLS policies

  2. Security
    - Enable RLS on company_settings table
    - Add policies for viewing and managing settings
*/

-- Recreate company_settings table with all required columns
CREATE TABLE IF NOT EXISTS company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Minha Empresa',
  cnpj text,
  address text,
  logo_url text,
  show_prices boolean DEFAULT true,
  theme jsonb DEFAULT jsonb_build_object(
    'backgroundColor', '#f3f4f6',
    'headerColor', '#ffffff',
    'footerColor', '#ffffff'
  ),
  footer jsonb DEFAULT jsonb_build_object(
    'companyName', '',
    'cnpj', '',
    'address', ''
  ),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view company settings" ON company_settings;
DROP POLICY IF EXISTS "Only admins can modify company settings" ON company_settings;

-- Create new policies
CREATE POLICY "Anyone can view company settings"
  ON company_settings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can modify company settings"
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

-- Insert default settings if none exist
INSERT INTO company_settings (
  name,
  theme,
  footer,
  show_prices
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
  true
WHERE NOT EXISTS (SELECT 1 FROM company_settings);