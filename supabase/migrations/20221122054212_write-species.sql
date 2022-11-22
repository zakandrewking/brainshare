CREATE POLICY "Authenticated user can write species" ON public.species FOR
INSERT TO authenticated WITH CHECK (true);
