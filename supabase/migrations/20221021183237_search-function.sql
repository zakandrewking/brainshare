ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM public;

CREATE OR REPLACE FUNCTION public.hello_world(query text)
RETURNS SETOF public.chemical
LANGUAGE SQL
AS $$
  SELECT chemical.* FROM chemical LEFT JOIN SYNONYM on chemical_id = chemical.id
    WHERE chemical.name ILIKE ('%' || query || '%')
    OR inchi = query
    OR synonym.value = query;
$$;

GRANT EXECUTE ON FUNCTION public.hello_world TO anon;
GRANT EXECUTE ON FUNCTION public.hello_world TO authenticated;
GRANT EXECUTE ON FUNCTION public.hello_world TO service_role;
