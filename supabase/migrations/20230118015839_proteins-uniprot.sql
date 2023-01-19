ALTER TABLE public.protein
    ADD COLUMN IF NOT EXISTS sequence TEXT NOT NULL;

ALTER TABLE public.protein
    ADD COLUMN IF NOT EXISTS short_name TEXT;

ALTER TABLE public.synonym
    ADD COLUMN IF NOT EXISTS protein_id BIGINT
        REFERENCES public.protein(id) ON DELETE CASCADE;

ALTER TABLE public.synonym
    DROP CONSTRAINT synonym_source_value_key;
