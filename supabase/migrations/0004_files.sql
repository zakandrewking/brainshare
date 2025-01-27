-- TODO more reliable uploads
-- https://github.com/supabase/supabase/tree/master/examples/storage/resumable-upload-uppy
-- TODO let's adopt the RLS performance suggestions
-- https://supabase.com/docs/guides/database/postgres/row-level-security#rls-performance-recommendations
CREATE POLICY "Anyone can read buckets" ON storage.buckets
    FOR SELECT TO authenticated, anon
        USING (TRUE);

CREATE POLICY "Authenticated user can create objects" ON storage.objects
    FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'files');

CREATE POLICY "Authenticated user can manage their own objects" ON storage.objects
    FOR ALL TO authenticated
        USING (bucket_id = 'files'
            AND auth.uid() = OWNER);

CREATE TABLE file(
    id text PRIMARY KEY,
    name text NOT NULL,
    size bigint NOT NULL,
    bucket_id text NOT NULL,
    object_path text NOT NULL,
    user_id uuid NOT NULL,
    mime_type text,
    latest_task_id text
);

ALTER TABLE file ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated user can manage their files" ON file
    FOR ALL TO authenticated
        USING ((
            SELECT
                auth.uid()) = user_id);

