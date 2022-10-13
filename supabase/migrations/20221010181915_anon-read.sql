CREATE POLICY "Anyone can read chemicals"
    ON public.chemical FOR SELECT
    TO authenticated, anon
    USING ( true );

CREATE POLICY "Anyone can read synonyms"
    ON public.synonym FOR SELECT
    TO authenticated, anon
    USING ( true );
