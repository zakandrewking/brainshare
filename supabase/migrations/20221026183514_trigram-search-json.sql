DROP FUNCTION public.search;
DROP TYPE public.result;

CREATE FUNCTION public.search(query text) RETURNS JSONB AS $$
    SELECT jsonb_build_object('results', jsonb_agg(chemical_results)) FROM (
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
