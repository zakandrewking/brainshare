-- DROP INDEX chemical_name_search_idx;

-- CREATE INDEX IF NOT EXISTS chemical_name_search_idx ON public.chemical
--     USING GIN (name gin_trgm_ops);
