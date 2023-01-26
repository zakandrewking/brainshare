CREATE TABLE IF NOT EXISTS public.protein_species (
    protein_id BIGINT NOT NULL REFERENCES public.protein(id) ON DELETE CASCADE,
    species_id BIGINT NOT NULL REFERENCES public.species(id) ON DELETE CASCADE,
    constraint protein_species_pkey PRIMARY KEY (protein_id, species_id)
);
ALTER TABLE IF EXISTS public.protein_species ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read protein-species" ON public.protein_species FOR
    SELECT TO authenticated, anon USING (true);
