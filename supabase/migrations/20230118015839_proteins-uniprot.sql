ALTER TABLE public.protein
    ADD COLUMN IF NOT EXISTS sequence TEXT NOT NULL;

ALTER TABLE public.protein
    ADD COLUMN IF NOT EXISTS short_name TEXT;
