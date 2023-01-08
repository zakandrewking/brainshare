ALTER TABLE public.reaction ADD COLUMN IF NOT EXISTS hash TEXT UNIQUE NOT NULL;

ALTER TABLE public.species ADD UNIQUE (ncbi_tax_id);
