-- https://dba.stackexchange.com/questions/103821/best-index-for-similarity-function
-- https://dba.stackexchange.com/questions/90002/postgresql-operator-uses-index-but-underlying-function-does-not

ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM public;

GRANT EXECUTE ON FUNCTION extensions.word_similarity
    TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION extensions.word_similarity_op
    TO anon, authenticated, service_role;

SET pg_trgm.word_similarity_threshold = 0.1;

CREATE FUNCTION public.search(query text) RETURNS JSONB AS $$
DECLARE
    -- query_stripped text := regexp_replace(query, '[^0-9a-zA-Z]+', ' ', 'g');
    result jsonb;
BEGIN
    -- RAISE NOTICE 'Query stripped %', query_stripped;
    SELECT jsonb_build_object('results', jsonb_agg(chemical_results)) INTO result FROM (
        (SELECT DISTINCT ON (chemical.id)
            chemical.id, chemical.name, 1 as score, 'chemical' as table
            FROM chemical
            LEFT JOIN SYNONYM on chemical_id = chemical.id
            WHERE inchi = query OR synonym.value = query
            LIMIT 10)
        UNION ALL
        (SELECT chemical.id, chemical.name, word_similarity(query, chemical.name) AS score, 'chemical' as table
            FROM chemical
            WHERE query <% chemical.name
            ORDER BY score DESC, length(chemical.name)
            LIMIT 100)
        UNION ALL
        (SELECT species.id, species.name, word_similarity(query, species.name) AS score, 'species' as table
            FROM species
            WHERE query <% species.name
            ORDER BY score DESC, length(species.name)
            LIMIT 100)
    ) as chemical_results;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.search TO anon;
GRANT EXECUTE ON FUNCTION public.search TO authenticated;
GRANT EXECUTE ON FUNCTION public.search TO service_role;
