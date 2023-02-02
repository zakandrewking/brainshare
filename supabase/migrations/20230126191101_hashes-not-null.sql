ALTER TABLE public.species ALTER COLUMN hash SET NOT NULL;

-- hash for proteins
ALTER TABLE public.protein ADD COLUMN hash TEXT UNIQUE;
UPDATE public.protein SET hash = MD5(sequence);
ALTER TABLE public.protein ALTER COLUMN hash SET NOT NULL;
