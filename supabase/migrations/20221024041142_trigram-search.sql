CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

-- TODO GRANT USAGE ON all pg_trgm functions to anon, authenticated;

CREATE INDEX IF NOT EXISTS chemical_name_search_idx ON public.chemical
    USING GIST (name extensions.gist_trgm_ops);

-- SET pg_trgm.similarity_threshold = 0.2;

CREATE OR REPLACE FUNCTION public.search(query text) RETURNS public.result AS $$
    SELECT json_agg(chemical_results) as results FROM (
        (SELECT DISTINCT ON (chemical.id)
            chemical.*, 1 as score
            FROM chemical
            LEFT JOIN SYNONYM on chemical_id = chemical.id
            WHERE inchi = query OR synonym.value = query
            LIMIT 10)
        UNION ALL
        (SELECT chemical.*, similarity(chemical.name, query) AS score
            FROM chemical
            -- WHERE chemical.name % query
            ORDER BY chemical.name <-> query DESC
            LIMIT 100)
    ) as chemical_results;
$$ LANGUAGE SQL;
