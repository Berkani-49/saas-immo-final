-- 🔥 SOLUTION FINALE pour corriger les policies Supabase Storage
-- Ce script utilise une approche différente qui devrait fonctionner

-- 1. Vérifier et activer RLS si nécessaire
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Créer une policy ULTRA PERMISSIVE qui permet TOUT
CREATE POLICY "Allow all operations on property-images"
ON storage.objects
FOR ALL
USING (bucket_id = 'property-images')
WITH CHECK (bucket_id = 'property-images');

-- 3. S'assurer que le bucket est public
UPDATE storage.buckets
SET public = true,
    file_size_limit = 52428800,  -- 50MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'property-images';

-- 4. Vérifier les policies créées
SELECT
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%property-images%';
