CREATE POLICY "Anyone can read chemicals"
    ON public.chemical FOR SELECT
    TO authenticated, anon
    USING ( true );

CREATE POLICY "Anyone can read synonyms"
    ON public.synonym FOR SELECT
    TO authenticated, anon
    USING ( true );

CREATE POLICY "Anyone can read buckets"
    ON storage.buckets FOR SELECT
    TO authenticated, anon
    USING ( true );

CREATE POLICY "Anyone can read objects"
    ON storage.objects FOR SELECT
    TO authenticated, anon
    USING ( true );
