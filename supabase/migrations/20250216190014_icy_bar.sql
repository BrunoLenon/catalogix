-- Add login image fields to company_settings
ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS login_image_url text,
ADD COLUMN IF NOT EXISTS login_image_text text;

-- Update existing records to have empty values
UPDATE company_settings
SET 
  login_image_url = COALESCE(login_image_url, ''),
  login_image_text = COALESCE(login_image_text, '');