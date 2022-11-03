CREATE POLICY "Anyone can read buckets"
    ON storage.buckets FOR SELECT
    TO authenticated, anon
    USING ( true );

CREATE POLICY "Anyone can read objects"
    ON storage.objects FOR SELECT
    TO authenticated, anon
    USING ( true );
