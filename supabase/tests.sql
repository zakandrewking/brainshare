begin;
select plan( 4 );

with rows as (
  INSERT INTO chemical (inchi, inchi_key, name)
  VALUES (
      'InChI=1S/C6H12O6/c7-1-2-3(8)4(9)5(10)6(11)12-2/h2-11H,1H2/t2-,3-,4+,5-,6-/m1/s1',
      'WQZGKKKJIJFFOK-GASJEMHNSA-N',
      'beta-D-glucose'
    )
  RETURNING id
)
INSERT INTO synonym (source, value, chemical_id)
SELECT 'chebi_id', '15903', id
FROM rows;

select results_eq(
    'select * from search('''')',
    'SELECT jsonb_build_object(''results'', jsonb_agg(r)) FROM (select 1 where false) as r',
    'empty search returns no results'
);

select results_eq(
    'select CAST(results AS jsonb) from search(''15903'')',
    'select jsonb_agg(r) as results from (select *, 1 as score from chemical where chemical.name = ''beta-D-glucose'') as r',
    'exact search by chebi id'
);

select results_eq(
    'select CAST(results AS jsonb) from search(''InChI=1S/C6H12O6/c7-1-2-3(8)4(9)5(10)6(11)12-2/h2-11H,1H2/t2-,3-,4+,5-,6-/m1/s1'')',
    'select jsonb_agg(r) as results from (select *, 1 as score from chemical where chemical.name = ''beta-D-glucose'') as r',
    'exact search by inchi'
);

select results_eq(
    'select CAST(results AS jsonb) from search(''beta-D-glucose'')',
    'select jsonb_agg(r) as results from (select *, 1 as score from chemical where chemical.name = ''beta-D-glucose'') as r',
    'exact search by name'
);

select * from finish();
rollback;

-- query name sorting

begin;
select plan( 1 );

INSERT INTO chemical (inchi, inchi_key, name)
VALUES ('test-inchi-1', 'test-inchi-key-1', 'alpha-D-glucose'),
       ('test-inchi-2', 'test-inchi-key-2', 'beta-D-glucose');

select results_eq(
    'select jsonb_path_query(res, ''$.results[*].name'') #>> ''{}'' as name from search(''a-D-glucose'') as res',
    'select name from chemical where inchi like ''test-inchi-%'' ORDER BY inchi',
    'exact search by name'
);

select * from finish();
rollback;

-- query name sorting; subset

begin;
select plan( 1 );

DELETE FROM chemical;

INSERT INTO chemical (inchi, inchi_key, name)
VALUES ('test-inchi-3', 'test-inchi-key-3', 'Dianthramine'),
       ('test-inchi-2', 'test-inchi-key-2', 'long-hexane-1,6-diamine'),
       ('test-inchi-1', 'test-inchi-key-1', 'hexane-1,6-diamine');

select results_eq(
    'select jsonb_path_query(res, ''$.results[*].name'') #>> ''{}'' as name from search(''diamine'') as res',
    'select name from chemical where inchi like ''test-inchi-%'' ORDER BY inchi',
    'exact search by name'
);

select * from finish();
rollback;
