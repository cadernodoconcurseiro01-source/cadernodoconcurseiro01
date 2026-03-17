
-- Remove the old permissive upload policy that lacks MIME type restriction
DROP POLICY "Users can upload their own avatar" ON storage.objects;
