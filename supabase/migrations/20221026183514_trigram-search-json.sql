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
        (SELECT chemical.*, similarity(chemical.name, query) AS score
            FROM chemical
            WHERE similarity(chemical.name, query) > 0.1
            ORDER BY similarity(chemical.name, query) DESC
            LIMIT 100)
    ) as chemical_results;

    RETURN result;
END;
$$ LANGUAGE plpgsql;
