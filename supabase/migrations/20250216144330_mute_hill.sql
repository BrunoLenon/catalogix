/*
  # Add price column to products table

  1. Changes
    - Add price column to products table with default value 0
*/

-- Add price column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'price'
  ) THEN
    ALTER TABLE products ADD COLUMN price numeric(10,2) DEFAULT 0 NOT NULL;
  END IF;
END $$;