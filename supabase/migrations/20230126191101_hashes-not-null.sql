ALTER TABLE public.species ALTER COLUMN hash SET NOT NULL;

-- index for synonym.value
CREATE INDEX synonym_value_idx ON public.synonym (value);

-- hash for proteins
ALTER TABLE public.protein ADD COLUMN hash TEXT UNIQUE;
UPDATE public.protein SET hash = MD5(sequence);
ALTER TABLE public.protein ALTER COLUMN hash SET NOT NULL;
