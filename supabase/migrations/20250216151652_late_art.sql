-- Create storage bucket for company assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for company assets
CREATE POLICY "Admins can upload company assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-assets' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update company assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-assets' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Anyone can view company assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'company-assets');

CREATE POLICY "Admins can delete company assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-assets' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);