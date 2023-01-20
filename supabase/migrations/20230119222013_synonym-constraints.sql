ALTER TABLE public.synonym ADD UNIQUE (source, value, chemical_id);
ALTER TABLE public.synonym ADD UNIQUE (source, value, reaction_id);
ALTER TABLE public.synonym ADD UNIQUE (source, value, protein_id);
