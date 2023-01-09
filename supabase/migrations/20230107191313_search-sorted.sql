CREATE OR REPLACE FUNCTION public.search(query text) RETURNS JSONB AS $$
DECLARE
    ret jsonb;
BEGIN
    SELECT jsonb_build_object('results', jsonb_agg(results)) INTO ret
    FROM (SELECT * FROM jsonb_array_elements(
        COALESCE((SELECT jsonb_agg(r) FROM
        -- exact chemical matches
            (SELECT DISTINCT ON (chemical.id)
                chemical.id, chemical.name, 1 as score, 'chemical' as resource
                FROM chemical
                LEFT JOIN SYNONYM on chemical_id = chemical.id
                WHERE inchi = query OR inchi_key = query OR synonym.value = query
                LIMIT 10) as r),
            '[]'::jsonb
        ) || COALESCE((SELECT jsonb_agg(r) FROM
            (SELECT chemical.id, chemical.name, word_similarity(query, chemical.name) AS score, 'chemical' as resource
                FROM chemical
                WHERE query <% chemical.name
                ORDER BY score DESC, length(chemical.name)
                LIMIT 100) as r),
            '[]'::jsonb
        ) || COALESCE((SELECT jsonb_agg(r) FROM
            (SELECT species.id, species.name, word_similarity(query, species.name) AS score, 'species' as resource
                FROM species
                WHERE query <% species.name
                ORDER BY score DESC, length(species.name)
                LIMIT 100) as r),
            '[]'::jsonb
        ) || COALESCE((SELECT jsonb_agg(r) FROM
        -- exact reaction matches
            (SELECT DISTINCT ON (reaction.id)
                reaction.id, reaction.name, 1 as score, 'reaction' as resource
                FROM reaction
                LEFT JOIN SYNONYM on reaction_id = reaction.id
                WHERE reaction.hash = query OR synonym.value = query
                LIMIT 10) as r),
            '[]'::jsonb
        )
    ) AS sub1(results) ORDER BY (results->>'score')::numeric DESC) as sub2;

    RETURN ret;
END;
$$ LANGUAGE plpgsql;

-- query_stripped text := regexp_replace(query, '[^0-9a-zA-Z]+', ' ', 'g');
-- RAISE NOTICE 'Query stripped %', query_stripped;
