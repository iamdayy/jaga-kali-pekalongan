-- Create a new storage bucket for report images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-images', 'report-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Enable RLS on storage.objects -- SKIPPING: Usually enabled by default and requires superuser to change.
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow Public Read (Anyone can view images)
-- This is critical for the public report page validation
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'report-images' );

-- Policy: Allow Uploads (Anyone can upload for now, used by Report Form)
-- In a stricter app, might restrict to authenticated users only, 
-- but our report form allows anonymous reports.
CREATE POLICY "Anyone can upload images"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'report-images' );

-- Policy: Allow update/delete? 
-- Maybe restrict deletion to admins only? For now, keep it simple or restricted.
-- Let's allow admins to DELETE (needed for clearing proof images in dashboard)
-- Note: 'admin_user' check depends on how auth is handled in PG. 
-- Since we do custom auth, RLS here on 'auth.uid()' might not work directly/matches.
-- For MVP, if we use the service_role key for admin ops, it bypasses RLS.
-- If we use client key, we need a policy.
-- Let's allow Anyone to DELETE for now to ensure the UI works smoothly for the user testing,
-- OR rely on service_role for admin actions if configured.
-- SAFE OPTION: Allow anyone to insert/select. Deletion might fail if not owner.
