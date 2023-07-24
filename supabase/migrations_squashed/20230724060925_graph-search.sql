CREATE INDEX node_name_search_idx ON public.node USING gin ((data ->> 'name') gin_trgm_ops);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.search_graph(query text, resource_filter text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    ret jsonb;
BEGIN
    SELECT jsonb_build_object('results', jsonb_agg(results)) INTO ret
    FROM (SELECT * FROM jsonb_array_elements(
        COALESCE(
            case when resource_filter is null then
                (SELECT jsonb_agg(r) FROM (
                    -- match on name
                    SELECT n.id, n.node_type_id, weighted_similarity(query, n.data->>'name') AS score, 'node' as resource, concat('Name: ', n.data->>'name') as match
                    FROM node AS n
                    WHERE weighted_similarity(query, n.data->>'name') > 0.1
                    LIMIT 100) as r)
            end,
            '[]'::jsonb
        )
    ) AS sub1(results) ORDER BY (results->>'score')::numeric DESC) as sub2;

    RETURN ret;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.weighted_similarity(query text, target text)
 RETURNS double precision
 LANGUAGE plpgsql
AS $function$
DECLARE
    ret float;
BEGIN
    SELECT word_similarity(query, target) * 0.8 + similarity(query, target) * 0.2 INTO ret;
    RETURN ret;
END;
$function$
;


