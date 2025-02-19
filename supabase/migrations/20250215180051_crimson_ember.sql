/*
  # Add product images storage and barcode

  1. Changes
    - Add barcode column to products table
    - Add image_url column to products table
    - Create storage bucket for product images
    - Set up storage policies

  2. Security
    - Enable RLS for storage bucket
    - Add policies for authenticated users to manage their product images
*/

-- Add new columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS barcode text,
ADD COLUMN IF NOT EXISTS image_url text;

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- Set up storage policies
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND
  (storage.foldername(name))[1] = 'products'
);

CREATE POLICY "Authenticated users can update their product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can delete their product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- Update products RLS policies to include new columns
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Only admins can modify products" ON products;

CREATE POLICY "Anyone can view active products"
ON products FOR SELECT
TO public
USING (active = true);

CREATE POLICY "Only admins can modify products"
ON products FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);