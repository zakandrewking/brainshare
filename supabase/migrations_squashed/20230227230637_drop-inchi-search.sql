set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.search(query text)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    ret jsonb;
BEGIN
    SELECT jsonb_build_object('results', jsonb_agg(results)) INTO ret
    FROM (SELECT * FROM jsonb_array_elements(
        COALESCE((SELECT jsonb_agg(r) FROM (
            -- exact chemical matches on inchi key
            SELECT chemical.id, chemical.name, 1 as score, 'chemical' as resource, concat('InChI Key: ', inchi_key) as match
                FROM chemical
                WHERE inchi_key = query
                LIMIT 1
        ) as r), '[]'::jsonb) || COALESCE((SELECT jsonb_agg(r) FROM (
            SELECT chemical.id, chemical.name, 1 as score, 'chemical' as resource, concat(synonym.source, ': ', synonym.value) as match
                FROM chemical
                LEFT JOIN synonym ON chemical_id = chemical.id
                WHERE synonym.value = query
                LIMIT 1
        ) as r), '[]'::jsonb) || COALESCE((SELECT jsonb_agg(r) FROM (
            SELECT id, name, weighted_similarity(query, name) AS score, 'chemical' as resource, concat('Name: ', name) as match
                FROM chemical
                WHERE query <% name -- NOTE we are not using the weighted similarity to filter
                LIMIT 100
        ) as r), '[]'::jsonb) || COALESCE((SELECT jsonb_agg(r) FROM (
            -- species matches by name
            SELECT species.id, species.name, weighted_similarity(query, species.name) AS score, 'species' as resource, concat('Name: ', name) as match
                FROM species
                WHERE query <% species.name -- NOTE we are not using the weighted similarity to filter
                LIMIT 100
        ) as r), '[]'::jsonb) || COALESCE((SELECT jsonb_agg(r) FROM (
            -- exact species matches on synonym
            SELECT species.id, species.name, 1 as score, 'species' as resource, concat(synonym.source, ': ', synonym.value) as match
                FROM species
                LEFT JOIN synonym ON species_id = species.id
                WHERE synonym.value = query
                LIMIT 1
        ) as r), '[]'::jsonb) || COALESCE((SELECT jsonb_agg(r) FROM (
            -- exact reaction matches on hash
            SELECT reaction.id, reaction.name, 1 as score, 'reaction' as resource, concat('Hash: ', hash) as match
                FROM reaction
                WHERE reaction.hash = query
                LIMIT 1
        ) as r), '[]'::jsonb) || COALESCE((SELECT jsonb_agg(r) FROM (
            -- exact reaction matches on synonym
            SELECT reaction.id, reaction.name, 1 as score, 'reaction' as resource, synonym.source || ': ' || synonym.value as match
                FROM reaction
                LEFT JOIN synonym ON reaction_id = reaction.id
                WHERE synonym.value = query
                LIMIT 1
        ) as r), '[]'::jsonb) || COALESCE((SELECT jsonb_agg(r) FROM (
            -- protein match on name
            SELECT protein.id, protein.name, weighted_similarity(query, protein.name) AS score, 'protein' as resource, concat('Name: ', name) as match
                FROM protein
                WHERE query <% name -- NOTE we are not using the weighted similarity to filter
                LIMIT 100
        ) as r), '[]'::jsonb) || COALESCE((SELECT jsonb_agg(r) FROM (
            -- protein match on short name
            SELECT protein.id, protein.name, weighted_similarity(query, protein.short_name) AS score, 'protein' as resource, 'Short name: ' || protein.short_name as match
                FROM protein
                WHERE query <% protein.short_name -- NOTE we are not using the weighted similarity to filter
                LIMIT 20
        ) as r), '[]'::jsonb) || COALESCE((SELECT jsonb_agg(r) FROM (
            -- exact protein match on synonym
            SELECT protein.id, protein.name, 1 AS score, 'protein' as resource, synonym.source || ': ' || synonym.value as match
                FROM protein
                LEFT JOIN synonym ON protein_id = protein.id
                WHERE synonym.value = query
                LIMIT 1
        ) as r), '[]'::jsonb)
    ) AS sub1(results) ORDER BY (results->>'score')::numeric DESC) as sub2;

    RETURN ret;
END;
$function$
;


