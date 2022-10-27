-- https://dba.stackexchange.com/questions/103821/best-index-for-similarity-function
-- https://dba.stackexchange.com/questions/90002/postgresql-operator-uses-index-but-underlying-function-does-not

SET pg_trgm.word_similarity_threshold = 0.1;

CREATE OR REPLACE FUNCTION public.search(query text) RETURNS JSONB AS $$
DECLARE
    -- query_stripped text := regexp_replace(query, '[^0-9a-zA-Z]+', ' ', 'g');
    result jsonb;
BEGIN
    -- RAISE NOTICE 'Query stripped %', query_stripped;
    SELECT jsonb_build_object('results', jsonb_agg(chemical_results)) INTO result FROM (
        (SELECT DISTINCT ON (chemical.id)
            chemical.*, 1 as score
            FROM chemical
            LEFT JOIN SYNONYM on chemical_id = chemical.id
            WHERE inchi = query OR synonym.value = query
            LIMIT 10)
        UNION ALL
        (SELECT chemical.*, word_similarity(query, chemical.name) AS score
            FROM chemical
            WHERE query <% chemical.name
            ORDER BY score DESC, length(chemical.name)
            LIMIT 100)
    ) as chemical_results;

    RETURN result;
END;
$$ LANGUAGE plpgsql;


-- postgres=# explain analyze select * from chemical where name % 'abcd' order by (name <-> 'abcd') limit 10;
--                                                                   QUERY PLAN
-- -----------------------------------------------------------------------------------------------------------------------------------------------
--  Limit  (cost=28.01..28.04 rows=10 width=301) (actual time=1.242..1.243 rows=0 loops=1)
--    ->  Sort  (cost=28.01..28.05 rows=14 width=301) (actual time=1.240..1.241 rows=0 loops=1)
--          Sort Key: ((name <-> 'abcd'::text))
--          Sort Method: quicksort  Memory: 25kB
--          ->  Bitmap Heap Scan on chemical  (cost=12.21..27.75 rows=14 width=301) (actual time=1.234..1.235 rows=0 loops=1)
--                Recheck Cond: (name % 'abcd'::text)
--                Rows Removed by Index Recheck: 3
--                Heap Blocks: exact=2
--                ->  Bitmap Index Scan on chemical_name_search_idx  (cost=0.00..12.20 rows=14 width=0) (actual time=1.171..1.171 rows=3 loops=1)
--                      Index Cond: (name % 'abcd'::text)
--  Planning Time: 2.130 ms
--  Execution Time: 1.302 ms
-- (12 rows)


-- postgres=# explain analyze select * from chemical where 'abcd' % name order by ('abcd' <-> name) limit 10;;
--                                                                   QUERY PLAN
-- -----------------------------------------------------------------------------------------------------------------------------------------------
--  Limit  (cost=28.01..28.04 rows=10 width=301) (actual time=1.238..1.239 rows=0 loops=1)
--    ->  Sort  (cost=28.01..28.05 rows=14 width=301) (actual time=1.236..1.236 rows=0 loops=1)
--          Sort Key: (('abcd'::text <-> name))
--          Sort Method: quicksort  Memory: 25kB
--          ->  Bitmap Heap Scan on chemical  (cost=12.21..27.75 rows=14 width=301) (actual time=1.230..1.231 rows=0 loops=1)
--                Filter: ('abcd'::text % name)
--                Rows Removed by Filter: 3
--                Heap Blocks: exact=2
--                ->  Bitmap Index Scan on chemical_name_search_idx  (cost=0.00..12.20 rows=14 width=0) (actual time=1.186..1.186 rows=3 loops=1)
--                      Index Cond: (name % 'abcd'::text)
--  Planning Time: 2.219 ms
--  Execution Time: 1.308 ms
-- (12 rows)

-- postgres=# explain analyze select * from chemical where 'abcd' % name order by similarity('abcd', name) limit 10;
--                                                                   QUERY PLAN
-- -----------------------------------------------------------------------------------------------------------------------------------------------
--  Limit  (cost=28.01..28.04 rows=10 width=301) (actual time=1.182..1.183 rows=0 loops=1)
--    ->  Sort  (cost=28.01..28.05 rows=14 width=301) (actual time=1.181..1.182 rows=0 loops=1)
--          Sort Key: (similarity('abcd'::text, name))
--          Sort Method: quicksort  Memory: 25kB
--          ->  Bitmap Heap Scan on chemical  (cost=12.21..27.75 rows=14 width=301) (actual time=1.175..1.175 rows=0 loops=1)
--                Filter: ('abcd'::text % name)
--                Rows Removed by Filter: 3
--                Heap Blocks: exact=2
--                ->  Bitmap Index Scan on chemical_name_search_idx  (cost=0.00..12.20 rows=14 width=0) (actual time=1.135..1.136 rows=3 loops=1)
--                      Index Cond: (name % 'abcd'::text)
--  Planning Time: 2.134 ms
--  Execution Time: 1.248 ms
-- (12 rows)

-- postgres=# explain analyze select * from chemical where similarity('abcd', name) > 0.5 order by similarity('abcd', name) limit 10;
--                                                                  QUERY PLAN
-- --------------------------------------------------------------------------------------------------------------------------------------------
--  Limit  (cost=8526.80..8527.95 rows=10 width=301) (actual time=2879.555..2879.648 rows=0 loops=1)
--    ->  Gather Merge  (cost=8526.80..11654.80 rows=27200 width=301) (actual time=2879.553..2879.645 rows=0 loops=1)
--          Workers Planned: 1
--          Workers Launched: 0
--          ->  Sort  (cost=7526.79..7594.79 rows=27200 width=301) (actual time=2879.246..2879.247 rows=0 loops=1)
--                Sort Key: (similarity('abcd'::text, name))
--                Sort Method: quicksort  Memory: 25kB
--                ->  Parallel Seq Scan on chemical  (cost=0.00..6939.01 rows=27200 width=301) (actual time=2879.239..2879.239 rows=0 loops=1)
--                      Filter: (similarity('abcd'::text, name) > '0.5'::double precision)
--                      Rows Removed by Filter: 138721
--  Planning Time: 0.150 ms
--  Execution Time: 2879.711 ms
-- (12 rows)

-- postgres=# explain analyze select name, similarity('abcd', name) from chemical where 'abcd' % name order by similarity('abcd', name) limit 10;
--                                                                   QUERY PLAN
-- -----------------------------------------------------------------------------------------------------------------------------------------------
--  Limit  (cost=28.01..28.04 rows=10 width=83) (actual time=1.300..1.301 rows=0 loops=1)
--    ->  Sort  (cost=28.01..28.05 rows=14 width=83) (actual time=1.299..1.299 rows=0 loops=1)
--          Sort Key: (similarity('abcd'::text, name))
--          Sort Method: quicksort  Memory: 25kB
--          ->  Bitmap Heap Scan on chemical  (cost=12.21..27.75 rows=14 width=83) (actual time=1.292..1.293 rows=0 loops=1)
--                Filter: ('abcd'::text % name)
--                Rows Removed by Filter: 3
--                Heap Blocks: exact=2
--                ->  Bitmap Index Scan on chemical_name_search_idx  (cost=0.00..12.20 rows=14 width=0) (actual time=1.250..1.250 rows=3 loops=1)
--                      Index Cond: (name % 'abcd'::text)
--  Planning Time: 2.139 ms
--  Execution Time: 1.355 ms
-- (12 rows)
