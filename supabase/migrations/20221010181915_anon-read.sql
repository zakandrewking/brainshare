CREATE POLICY "Anyone can read chemicals"
ON public.chemical FOR SELECT
TO authenticated, anon
USING ( true );
