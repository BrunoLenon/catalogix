/*
  # Add show_prices setting

  1. Changes
    - Add show_prices column to company_settings table with default value true
    - Update existing records to have show_prices set to true
*/

-- Add show_prices column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'company_settings' AND column_name = 'show_prices'
  ) THEN
    ALTER TABLE company_settings ADD COLUMN show_prices boolean DEFAULT true;
  END IF;
END $$;

-- Update existing records to have show_prices set to true
UPDATE company_settings
SET show_prices = true
WHERE show_prices IS NULL;