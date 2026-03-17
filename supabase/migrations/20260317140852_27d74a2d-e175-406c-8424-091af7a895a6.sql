
-- Restrict avatar uploads to image MIME types only
CREATE POLICY "Only allow image uploads to avatars bucket"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (metadata->>'mimetype') IN ('image/jpeg', 'image/png', 'image/gif', 'image/webp')
);
