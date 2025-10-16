-- Make stego-images bucket public for reliable cross-device access
UPDATE storage.buckets 
SET public = true 
WHERE id = 'stego-images';

-- Drop existing policies if they exist and recreate
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Public read access for stego images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload stego images" ON storage.objects;
END $$;

-- Allow public read access to stego images
CREATE POLICY "Public read access for stego images"
ON storage.objects FOR SELECT
USING (bucket_id = 'stego-images');

-- Allow authenticated users to upload stego images
CREATE POLICY "Authenticated users can upload stego images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'stego-images' 
  AND auth.role() = 'authenticated'
);