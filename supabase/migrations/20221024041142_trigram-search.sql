CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

GRANT EXECUTE ON FUNCTION extensions.similarity
    TO anon, authenticated, service_role;

CREATE INDEX IF NOT EXISTS chemical_name_search_idx ON public.chemical
    USING GIN (name extensions.gin_trgm_ops);

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
            WHERE similarity(chemical.name, query) > 0.1
            ORDER BY similarity(chemical.name, query) DESC
            LIMIT 100)
    ) as chemical_results;
$$ LANGUAGE SQL;
