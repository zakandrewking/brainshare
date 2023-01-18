ALTER TABLE public.protein
    ADD COLUMN IF NOT EXISTS sequence TEXT;

ALTER TABLE synonym
    ADD COLUMN IF NOT EXISTS protein_id BIGINT
        REFERENCES public.protein(id) ON DELETE CASCADE;
