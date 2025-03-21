-- Create a function to calculate total storage usage for a user
CREATE OR REPLACE FUNCTION public.get_user_storage_usage()
    RETURNS bigint
    LANGUAGE sql
    SECURITY DEFINER
    AS $$
    SELECT
        COALESCE(SUM(size), 0)
    FROM
        public.file
    WHERE
        file.user_id = auth.uid();
$$;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_storage_usage() TO authenticated;

-- -- Set storage limit to 100MB (100 * 1024 * 1024 bytes)
-- CREATE OR REPLACE FUNCTION public.check_storage_limit()
--     RETURNS TRIGGER
--     LANGUAGE plpgsql
--     SECURITY DEFINER
--     AS $$
-- DECLARE
--     storage_limit bigint := 104857600;
--     -- 100MB in bytes
--     current_usage bigint;
-- BEGIN
--     -- Calculate current storage usage for the user
--     SELECT
--         public.get_user_storage_usage(NEW.user_id) INTO current_usage;
--     -- Add the new file size
--     current_usage := current_usage + NEW.size;
--     -- Check if it would exceed the limit
--     IF current_usage > storage_limit THEN
--         RAISE EXCEPTION 'Storage limit of 100MB exceeded. Please delete some files first.';
--     END IF;
--     RETURN NEW;
-- END;
-- $$;
-- -- Create trigger to check storage limit before insert
-- DROP TRIGGER IF EXISTS check_storage_limit_trigger ON public.file;
-- CREATE TRIGGER check_storage_limit_trigger
--     BEFORE INSERT ON public.file
--     FOR EACH ROW
--     EXECUTE FUNCTION public.check_storage_limit();
-- -- Update storage policy to prevent uploads when limit is reached
-- DROP POLICY IF EXISTS "Authenticated user can create objects" ON storage.objects;
-- CREATE POLICY "Authenticated user can create objects" ON storage.objects
--     FOR INSERT TO authenticated
--         WITH CHECK (bucket_id = 'files'
--         AND (
--             SELECT
--                 COALESCE(SUM(size), 0) < 104857600 -- 100MB in bytes
--             FROM
--                 public.file
--             WHERE
--                 user_id = auth.uid()));
-- -- Update the file table policy to include the storage limit check
-- DROP POLICY IF EXISTS "Authenticated user can manage their files" ON public.file;
-- CREATE POLICY "Authenticated user can manage their files" ON public.file
--     FOR ALL TO authenticated
--         USING (auth.uid() = user_id)
--         WITH CHECK (auth.uid() = user_id
--             AND (
--                 SELECT
--                     COALESCE(SUM(size), 0) + COALESCE(NEW.size, 0) <= 104857600 -- 100MB in bytes
--                 FROM
--                     public.file
--                 WHERE
--                     user_id = auth.uid()));
