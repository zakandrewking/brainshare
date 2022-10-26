REVOKE EXECUTE ON FUNCTION extensions.similarity
    FROM anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION extensions.word_similarity
    TO anon, authenticated, service_role;

DROP FUNCTION public.search;
DROP TYPE public.result;

CREATE FUNCTION public.search(query text) RETURNS JSONB AS $$
DECLARE
    -- query_stripped text := regexp_replace(query, '[^0-9a-zA-Z]+', ' ', 'g');
    result jsonb;
BEGIN
    -- RAISE NOTICE 'Query stripped %', query_stripped;
    SELECT jsonb_build_object('results', jsonb_agg(chemical_results)) INTO result FROM (
        (SELECT DISTINCT ON (chemical.id)
            chemical.*, 1 as score
            FROM chemical
            LEFT JOIN SYNONYM on chemical_id = chemical.id
            WHERE inchi = query OR synonym.value = query
            LIMIT 10)
        UNION ALL
        (SELECT chemical.*, word_similarity(query, chemical.name) AS score
            FROM chemical
            WHERE word_similarity(query, chemical.name) > 0.1
            ORDER BY word_similarity(query, chemical.name) DESC
            LIMIT 100)
    ) as chemical_results;

    RETURN result;
END;
$$ LANGUAGE plpgsql;
