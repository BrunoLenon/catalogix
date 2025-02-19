-- Add theme and footer columns to company_settings
ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS theme jsonb DEFAULT jsonb_build_object(
  'backgroundColor', '#f3f4f6',
  'headerColor', '#ffffff',
  'footerColor', '#ffffff'
),
ADD COLUMN IF NOT EXISTS footer jsonb DEFAULT jsonb_build_object(
  'companyName', '',
  'cnpj', '',
  'address', ''
);

-- Update existing records to have default theme and footer
UPDATE company_settings
SET 
  theme = jsonb_build_object(
    'backgroundColor', '#f3f4f6',
    'headerColor', '#ffffff',
    'footerColor', '#ffffff'
  )
WHERE theme IS NULL;

UPDATE company_settings
SET 
  footer = jsonb_build_object(
    'companyName', name,
    'cnpj', cnpj,
    'address', address
  )
WHERE footer IS NULL;