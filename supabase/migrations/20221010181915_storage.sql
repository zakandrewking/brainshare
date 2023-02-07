CREATE POLICY "Anyone can read buckets"
    ON storage.buckets FOR SELECT
    TO authenticated, anon
    USING ( true );

CREATE POLICY "Anyone can read objects"
    ON storage.objects FOR SELECT
    TO authenticated, anon
    USING ( true );

INSERT INTO storage.buckets (id, name, public)
    VALUES ('genome_sequences', 'genome_sequences', true);
CREATE POLICY "Anyone can read genome sequences"
    ON storage.objects for SELECT USING ( bucket_id = 'genome_sequences' );
