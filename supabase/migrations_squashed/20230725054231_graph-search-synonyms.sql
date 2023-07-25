drop materialized view if exists "public"."node_search";

set check_function_bodies = off;

create materialized view "public"."node_search" as  SELECT node.id,
    node.node_type_id,
    (node.data ->> 'name'::text) AS name,
    (node.data ->> 'name'::text) AS value,
    'Name'::text AS source
   FROM node
  WHERE ((node.data ->> 'name'::text) IS NOT NULL)
UNION ALL
 SELECT node1.id,
    node1.node_type_id,
    (node1.data ->> 'name'::text) AS name,
    (node2.data ->> 'value'::text) AS value,
    (node2.data ->> 'source'::text) AS source
   FROM ((node node1
     JOIN edge ON ((edge.source_id = node1.id)))
     JOIN node node2 ON ((edge.destination_id = node2.id)))
  WHERE ((node2.node_type_id = 'synonym'::text) AND ((node2.data ->> 'value'::text) IS NOT NULL));
create index node_search_value_idx on node_search using gin (value gin_trgm_ops);


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
            (SELECT jsonb_agg(r) FROM (
                SELECT n.id, n.node_type_id, n.name, weighted_similarity(query, n.value) AS score, n.source || ': ' || n.value as match
                FROM node_search AS n
                WHERE query <% n.value
                LIMIT 100
            ) as r),
            '[]'::jsonb
        )
    ) AS sub1(results) ORDER BY (results->>'score')::numeric DESC) as sub2;
    RETURN ret;
END;
$function$
;


