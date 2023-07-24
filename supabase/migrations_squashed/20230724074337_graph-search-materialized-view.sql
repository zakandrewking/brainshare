drop index if exists "public"."node_name_search_idx";

set check_function_bodies = off;

create materialized view "public"."node_search" as  SELECT node.id,
    node.node_type_id,
    node.user_id,
    (node.data ->> 'name'::text) AS name,
    node.hash
   FROM node;


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
$function$
;

CREATE INDEX node_search_name_idx ON public.node_search USING gin (name gin_trgm_ops);


