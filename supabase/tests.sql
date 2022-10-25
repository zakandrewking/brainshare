begin;
select plan( 4 );

with rows as (
  INSERT INTO public.chemical (inchi, name)
  VALUES (
      'InChI=1S/C6H12O6/c7-1-2-3(8)4(9)5(10)6(11)12-2/h2-11H,1H2/t2-,3-,4+,5-,6-/m1/s1',
      'beta-D-glucose'
    )
  RETURNING id
)
INSERT INTO public.synonym (source, value, chemical_id)
SELECT 'chebi_id', '15903', id
FROM rows;

select results_eq(
    'select CAST(results AS jsonb) from search('''')',
    'select jsonb_agg(r) as results from (select 1 where false) as r',
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
