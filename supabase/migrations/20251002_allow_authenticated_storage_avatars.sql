-- Allow authenticated users to upload to the 'avatars' bucket and allow owners to update/delete their objects

ALTER TABLE IF EXISTS storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow SELECT on storage.objects (optional, required if listing metadata from client)
-- replace policy if exists then create
DROP POLICY IF EXISTS "storage_objects_select_all" ON storage.objects;
CREATE POLICY "storage_objects_select_all"
  ON storage.objects
  FOR SELECT
  USING (true);

-- Allow authenticated users to INSERT into storage.objects for the avatars bucket
DROP POLICY IF EXISTS "storage_objects_allow_authenticated_insert_avatars" ON storage.objects;
CREATE POLICY "storage_objects_allow_authenticated_insert_avatars"
  ON storage.objects
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND bucket_id = 'avatars');

-- Allow owners to UPDATE only their own objects in avatars
DROP POLICY IF EXISTS "storage_objects_allow_owner_update_avatars" ON storage.objects;
CREATE POLICY "storage_objects_allow_owner_update_avatars"
  ON storage.objects
  FOR UPDATE
  USING (auth.uid() = owner AND bucket_id = 'avatars');

-- Allow owners to DELETE only their own objects in avatars
DROP POLICY IF EXISTS "storage_objects_allow_owner_delete_avatars" ON storage.objects;
CREATE POLICY "storage_objects_allow_owner_delete_avatars"
  ON storage.objects
  FOR DELETE
  USING (auth.uid() = owner AND bucket_id = 'avatars');

-- Ensure avatar bucket is in publication for realtime (usually not needed for storage but harmless)
ALTER TABLE IF EXISTS storage.objects REPLICA IDENTITY FULL;
-- Note: Publication name may vary; this is optional and may error if publication doesn't exist
-- ALTER PUBLICATION supabase_realtime ADD TABLE storage.objects;
