ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM public;

CREATE TYPE public.result AS (
    results json
);

CREATE OR REPLACE FUNCTION public.search(query text) RETURNS public.result AS $$
    SELECT json_agg(chemical_results) as results FROM (
        SELECT DISTINCT on (chemical.id) chemical.*
            FROM chemical
            LEFT JOIN SYNONYM on chemical_id = chemical.id
            WHERE chemical.name ILIKE ('%' || query || '%')
            OR inchi = query
            OR synonym.value = query
    ) as chemical_results;
$$ LANGUAGE SQL;

GRANT EXECUTE ON FUNCTION public.search TO anon;
GRANT EXECUTE ON FUNCTION public.search TO authenticated;
GRANT EXECUTE ON FUNCTION public.search TO service_role;
