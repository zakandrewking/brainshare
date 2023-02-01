
CREATE INDEX IF NOT EXISTS protein_short_name_search_idx ON public.protein USING GIN (short_name extensions.gin_trgm_ops);
