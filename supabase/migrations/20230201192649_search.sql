-- https://dba.stackexchange.com/questions/103821/best-index-for-similarity-function
-- https://dba.stackexchange.com/questions/90002/postgresql-operator-uses-index-but-underlying-function-does-not

ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM public;

GRANT EXECUTE ON FUNCTION extensions.word_similarity
    TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION extensions.word_similarity_op
    TO anon, authenticated, service_role;

SET pg_trgm.word_similarity_threshold = 0.1;

CREATE OR REPLACE FUNCTION public.weighted_similarity(query text, target text) RETURNS float as $$
DECLARE
    ret float;
BEGIN
    SELECT word_similarity(query, target) * 0.8 + similarity(query, target) * 0.2 INTO ret;
    RETURN ret;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.search(query text, resource_filter text default null) RETURNS jsonb AS $$
DECLARE
    ret jsonb;
BEGIN
    SELECT jsonb_build_object('results', jsonb_agg(results)) INTO ret
    FROM (SELECT * FROM jsonb_array_elements(
        COALESCE(
            case when resource_filter = 'chemical' or resource_filter is null then
                (SELECT jsonb_agg(r) FROM (
                    -- exact chemical matches on inchi key
                    SELECT chemical.id, chemical.name, 1 as score, 'chemical' as resource, concat('InChI Key: ', inchi_key) as match
                    FROM chemical
                    WHERE inchi_key = query
                    LIMIT 1) as r)
            end,
            '[]'::jsonb
        ) || COALESCE(
            case when resource_filter = 'chemical' or resource_filter is null then
                (SELECT jsonb_agg(r) FROM (
                SELECT chemical.id, chemical.name, 1 as score, 'chemical' as resource, concat(synonym.source, ': ', synonym.value) as match
                    FROM chemical
                    LEFT JOIN synonym ON chemical_id = chemical.id
                    WHERE synonym.value ilike query
                    LIMIT 1) as r)
            end,
            '[]'::jsonb
        ) || COALESCE(
            case when resource_filter = 'chemical' or resource_filter is null then
                (SELECT jsonb_agg(r) FROM (
                    SELECT id, name, weighted_similarity(query, name) AS score, 'chemical' as resource, concat('Name: ', name) as match
                    FROM chemical
                    WHERE query <% name -- NOTE we are not using the weighted similarity to filter
                    LIMIT 100) as r)
            end,
            '[]'::jsonb
        ) || COALESCE(
            case when resource_filter = 'species' or resource_filter is null then
                (SELECT jsonb_agg(r) FROM (
                    -- species matches by name
                    SELECT species.id, species.name, weighted_similarity(query, species.name) AS score, 'species' as resource, concat('Name: ', name) as match
                    FROM species
                    WHERE query <% species.name -- NOTE we are not using the weighted similarity to filter
                    LIMIT 100) as r)
            end,
            '[]'::jsonb
        ) || COALESCE(
            case when resource_filter = 'species' or resource_filter is null then
                (SELECT jsonb_agg(r) FROM (
                    -- exact species matches on synonym
                    SELECT species.id, species.name, 1 as score, 'species' as resource, concat(synonym.source, ': ', synonym.value) as match
                    FROM species
                    LEFT JOIN synonym ON species_id = species.id
                    WHERE synonym.value = query
                    LIMIT 1) as r)
            end,
            '[]'::jsonb
        ) || COALESCE(
            case when resource_filter = 'reaction' or resource_filter is null then
                (SELECT jsonb_agg(r) FROM (
                    -- exact reaction matches on hash
                    SELECT reaction.id, reaction.name, 1 as score, 'reaction' as resource, concat('Hash: ', hash) as match
                    FROM reaction
                    WHERE reaction.hash = query
                    LIMIT 1) as r)
            end,
            '[]'::jsonb
        ) || COALESCE(
            case when resource_filter = 'reaction' or resource_filter is null then
                (SELECT jsonb_agg(r) FROM (
                    -- exact reaction matches on synonym
                    SELECT reaction.id, reaction.name, 1 as score, 'reaction' as resource, synonym.source || ': ' || synonym.value as match
                    FROM reaction
                    LEFT JOIN synonym ON reaction_id = reaction.id
                    WHERE synonym.value ilike query
                    LIMIT 1) as r)
            end,
            '[]'::jsonb
        ) || COALESCE(
            case when resource_filter = 'protein' or resource_filter is null then
                (SELECT jsonb_agg(r) FROM (
                    -- protein match on name
                    SELECT protein.id, protein.name, weighted_similarity(query, protein.name) AS score, 'protein' as resource, concat('Name: ', name) as match
                    FROM protein
                    WHERE query <% name -- NOTE we are not using the weighted similarity to filter
                    LIMIT 100) as r)
            end,
            '[]'::jsonb
        ) || COALESCE(
            case when resource_filter = 'protein' or resource_filter is null then
                (SELECT jsonb_agg(r) FROM (
                    -- protein match on short name
                    SELECT protein.id, protein.name, weighted_similarity(query, protein.short_name) AS score, 'protein' as resource, 'Short name: ' || protein.short_name as match
                    FROM protein
                    WHERE query <% protein.short_name -- NOTE we are not using the weighted similarity to filter
                    LIMIT 20) as r)
            end,
            '[]'::jsonb
        ) || COALESCE(
            case when resource_filter = 'protein' or resource_filter is null then
                (SELECT jsonb_agg(r) FROM (
                    -- exact protein match on synonym
                    SELECT protein.id, protein.name, 1 AS score, 'protein' as resource, synonym.source || ': ' || synonym.value as match
                    FROM protein
                    LEFT JOIN synonym ON protein_id = protein.id
                    WHERE synonym.value ilike query
                    LIMIT 1) as r)
            end,
            '[]'::jsonb
        )
    ) AS sub1(results) ORDER BY (results->>'score')::numeric DESC) as sub2;

    RETURN ret;
END;
$$ LANGUAGE plpgsql;

-- query_stripped text := regexp_replace(query, '[^0-9a-zA-Z]+', ' ', 'g');
-- RAISE NOTICE 'Query stripped %', query_stripped;

GRANT EXECUTE ON FUNCTION public.search TO anon;
GRANT EXECUTE ON FUNCTION public.search TO authenticated;
GRANT EXECUTE ON FUNCTION public.search TO service_role;


CREATE OR REPLACE FUNCTION public.search_graph(query text, resource_filter text default null) RETURNS jsonb AS $$
DECLARE
    ret jsonb;
BEGIN
    SELECT jsonb_build_object('results', jsonb_agg(results)) INTO ret
    FROM (SELECT * FROM jsonb_array_elements(
        COALESCE(
            case when resource_filter is null then
                (SELECT jsonb_agg(r) FROM (
                    -- match on name
                    SELECT n.id, n.node_type_id, weighted_similarity(query, n.name) AS score, 'node' as resource, concat('Name: ', n.name) as match
                    FROM node_search AS n
                    WHERE query <% n.name
                    LIMIT 100) as r)
            end,
            '[]'::jsonb
        )
    ) AS sub1(results) ORDER BY (results->>'score')::numeric DESC) as sub2;

    RETURN ret;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.search_graph TO anon;
GRANT EXECUTE ON FUNCTION public.search_graph TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_graph TO service_role;
