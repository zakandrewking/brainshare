SET statement_timeout TO 72000000;

ALTER TABLE public.reaction DROP COLUMN ec_number;

ALTER TABLE public.synonym
    ADD COLUMN species_id BIGINT REFERENCES public.species(id) ON DELETE CASCADE;

INSERT INTO public.synonym (source, value, species_id)
    SELECT 'ncbi_taxonomy', ncbi_tax_id, id FROM public.species;

ALTER TABLE public.synonym ADD UNIQUE (source, value, species_id);

ALTER TABLE public.species DROP COLUMN ncbi_tax_id;
