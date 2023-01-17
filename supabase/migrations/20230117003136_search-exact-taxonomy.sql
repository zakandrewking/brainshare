
CREATE OR REPLACE FUNCTION public.search(query text) RETURNS JSONB AS $$
DECLARE
    ret jsonb;
BEGIN
    SELECT jsonb_build_object('results', jsonb_agg(results)) INTO ret
    FROM (SELECT * FROM jsonb_array_elements(
        COALESCE((SELECT jsonb_agg(r) FROM (
            -- exact chemical matches on inchi
            SELECT chemical.id, chemical.name, 1 as score, 'chemical' as resource, concat('InChI: ', inchi) as match
                FROM chemical
                WHERE inchi = query
                LIMIT 10
        ) as r), '[]'::jsonb) || COALESCE((SELECT jsonb_agg(r) FROM (
            -- exact chemical matches on inchi key
            SELECT chemical.id, chemical.name, 1 as score, 'chemical' as resource, concat('InChI Key: ', inchi_key) as match
                FROM chemical
                WHERE inchi_key = query
                LIMIT 10
        ) as r), '[]'::jsonb) || COALESCE((SELECT jsonb_agg(r) FROM (
            SELECT chemical.id, chemical.name, 1 as score, 'chemical' as resource, concat(synonym.source, ': ', synonym.value) as match
                FROM chemical
                LEFT JOIN synonym ON chemical_id = chemical.id
                WHERE synonym.value = query
                LIMIT 10
        ) as r), '[]'::jsonb
        ) || COALESCE((SELECT jsonb_agg(r) FROM (
            SELECT id, name, word_similarity(query, name) AS score, 'chemical' as resource, concat('Name: ', name) as match
                FROM chemical
                WHERE query <% name
                ORDER BY score DESC, length(chemical.name)
                LIMIT 100
        ) as r), '[]'::jsonb) || COALESCE((SELECT jsonb_agg(r) FROM (
            -- species matches by name
            SELECT species.id, species.name, word_similarity(query, species.name) AS score, 'species' as resource, concat('Name: ', name) as match
                FROM species
                WHERE query <% species.name
                ORDER BY score DESC, length(species.name)
                LIMIT 100
        ) as r), '[]'::jsonb) || COALESCE((SELECT jsonb_agg(r) FROM (
            -- exact species matches on taxonomy ID
            SELECT species.id, species.name, 1 as score, 'species' as resource, concat('Taxonomy ID: ', ncbi_tax_id) as match
                FROM species
                WHERE species.ncbi_tax_id::text = query
                LIMIT 10
        ) as r), '[]'::jsonb) || COALESCE((SELECT jsonb_agg(r) FROM (
            -- exact reaction matches on hash
            SELECT reaction.id, reaction.name, 1 as score, 'reaction' as resource, concat('Hash: ', hash) as match
                FROM reaction
                WHERE reaction.hash = query
                LIMIT 10
        ) as r), '[]'::jsonb) || COALESCE((SELECT jsonb_agg(r) FROM (
            -- exact reaction matches on synonym
            SELECT reaction.id, reaction.name, 1 as score, 'reaction' as resource, concat(synonym.source, ': ', synonym.value) as match
                FROM reaction
                LEFT JOIN synonym ON reaction_id = reaction.id
                WHERE synonym.value = query
                LIMIT 10
        ) as r), '[]'::jsonb) || COALESCE((SELECT jsonb_agg(r) FROM (
            -- protein match on name
            SELECT protein.id, protein.name, word_similarity(query, protein.name) AS score, 'protein' as resource, concat('Name: ', name) as match
                FROM protein
                WHERE query <% name
                ORDER BY score DESC, length(protein.name)
                LIMIT 100
        ) as r), '[]'::jsonb)
    ) AS sub1(results) ORDER BY (results->>'score')::numeric DESC) as sub2;

    RETURN ret;
END;
$$ LANGUAGE plpgsql;

-- query_stripped text := regexp_replace(query, '[^0-9a-zA-Z]+', ' ', 'g');
-- RAISE NOTICE 'Query stripped %', query_stripped;
