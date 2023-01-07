CREATE OR REPLACE FUNCTION public.search(query text) RETURNS JSONB AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object('results',
        COALESCE(
            (SELECT jsonb_agg(r) FROM
                (SELECT DISTINCT ON (chemical.id)
                    chemical.id, chemical.name, 1 as score, 'chemical' as resource
                    FROM chemical
                    LEFT JOIN SYNONYM on chemical_id = chemical.id
                    WHERE inchi = query OR inchi_key = query OR synonym.value = query
                    LIMIT 10) as r),
            '[]'::jsonb
        ) || COALESCE(
            (SELECT jsonb_agg(r) FROM
                (SELECT chemical.id, chemical.name, chemical.inchi_key, word_similarity(query, chemical.name) AS score, 'chemical' as resource
                    FROM chemical
                    WHERE query <% chemical.name
                    LIMIT 100) as r),
            '[]'::jsonb
        ) || COALESCE(
            (SELECT jsonb_agg(r) FROM
                (SELECT species.id, species.name, word_similarity(query, species.name) AS score, 'species' as resource
                    FROM species
                    WHERE query <% species.name
                    LIMIT 100) as r),
            '[]'::jsonb
        )
    )
    INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

    -- jsonb_agg(results order by (value->>'score')::numeric))

    -- query_stripped text := regexp_replace(query, '[^0-9a-zA-Z]+', ' ', 'g');
    -- RAISE NOTICE 'Query stripped %', query_stripped;

    -- select
    --     (select jsonb_agg(r) from
    --         (select id, name, word_similarity('Diche', name) from chemical WHERE 'Diche' <% chemical.name limit 10) as r
    --     )
    --     ||
    --     (select jsonb_agg(r) from
    --         (select id, name, inchi_key, word_similarity('Diche', name) from chemical WHERE 'Diche' <% chemical.name limit 10) as r
    --     );
