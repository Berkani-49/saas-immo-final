-- 🔧 Script SQL pour corriger les policies Supabase Storage
-- À exécuter dans le SQL Editor de Supabase

-- 1. Supprimer les anciennes policies si elles existent (pour repartir à zéro)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;

-- 2. Créer la policy de LECTURE PUBLIQUE (pour afficher les images)
CREATE POLICY "Public Access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'property-images');

-- 3. Créer la policy d'UPLOAD (pour ajouter des images)
CREATE POLICY "Authenticated Upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-images');

-- 4. Créer la policy de SUPPRESSION (pour supprimer des images)
CREATE POLICY "Authenticated Delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'property-images');

-- 5. Vérifier que le bucket est PUBLIC
UPDATE storage.buckets
SET public = true
WHERE id = 'property-images';