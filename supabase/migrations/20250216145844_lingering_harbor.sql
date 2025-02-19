/*
  # Add company settings and order exports

  1. New Tables
    - `company_settings`
      - `id` (uuid, primary key)
      - `name` (text)
      - `cnpj` (text)
      - `address` (text)
      - `logo_url` (text)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `company_settings` table
    - Add policy for admins to manage settings
    - Add policy for authenticated users to view settings
*/

-- Create company settings table
CREATE TABLE IF NOT EXISTS company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cnpj text,
  address text,
  logo_url text,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Policies for company_settings
CREATE POLICY "Anyone can view company settings"
  ON company_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify company settings"
  ON company_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default settings if none exist
INSERT INTO company_settings (name)
SELECT 'Minha Empresa'
WHERE NOT EXISTS (SELECT 1 FROM company_settings);