BEGIN;
SELECT plan( 5 );

WITH rows AS (
  INSERT INTO chemical (inchi, inchi_key, name)
  VALUES (
      'InChI=1S/C6H12O6/c7-1-2-3(8)4(9)5(10)6(11)12-2/h2-11H,1H2/t2-,3-,4+,5-,6-/m1/s1',
      'WQZGKKKJIJFFOK-VFUOTHLCSA-N',
      'beta-D-glucose'
    ), (
      'InChI=1S/C6H12O6/c7-1-2-3(8)4(9)5(10)6(11)12-2/h2-11H,1H2/t2-,3-,4+,5-,6?/m1/s1',
      'WQZGKKKJIJFFOK-GASJEMHNSA-N',
      'D-glucopyranose'
    )
  RETURNING id
)
INSERT INTO synonym (source, value, chemical_id)
SELECT 'chebi', '15903', id
FROM rows LIMIT 1;

select results_eq(
    $$
SELECT search('')
    $$,
    $$
SELECT jsonb_build_object('results', jsonb_agg(r)) FROM (select 1 where false) as r
    $$,
    'empty search returns no results'
);

SELECT results_eq(
    $$
SELECT search('15903')
    $$,
    $$
SELECT jsonb_build_object('results', jsonb_agg(r)) FROM (
    SELECT chemical.id, chemical.name, 1 as score, 'chemical' as resource,
        synonym.source || ': ' || synonym.value as match
    FROM chemical JOIN synonym ON chemical.id = synonym.chemical_id
    WHERE chemical.name = 'beta-D-glucose' AND synonym.source = 'chebi'
) AS r
    $$,
    'exact search by chebi id'
);

SELECT results_eq(
    $$
SELECT search('InChI=1S/C6H12O6/c7-1-2-3(8)4(9)5(10)6(11)12-2/h2-11H,1H2/t2-,3-,4+,5-,6-/m1/s1')
    $$,
    $$
SELECT jsonb_build_object('results', jsonb_agg(r)) FROM (
    SELECT id, name, 1 AS score, 'chemical' AS resource, 'InChI: ' || chemical.inchi AS match
    FROM chemical WHERE chemical.name = 'beta-D-glucose'
) AS r
    $$,
    'exact search by inchi'
);

SELECT results_eq(
    $$
SELECT search('InChI=1S/C6H12O6/c7-1-2-3(8)4(9)5(10)6(11)12-2/h2-11H,1H2/t2-,3-,4+,5-,6?/m1/s1')
    $$,
    $$
SELECT jsonb_build_object('results', jsonb_agg(r)) FROM (
    SELECT id, name, 1 AS score, 'chemical' AS resource, 'InChI: ' || chemical.inchi AS match
    FROM chemical WHERE chemical.name = 'D-glucopyranose'
) AS r
    $$,
    'exact search by inchi'
);

SELECT results_eq(
    $$
SELECT search('beta-D-glucose')
    $$,
    $$
SELECT jsonb_build_object('results', jsonb_agg(r)) FROM (
    SELECT id, name, 1 AS score, 'chemical' AS resource, 'Name: ' || chemical.name AS match
    FROM chemical WHERE chemical.name = 'beta-D-glucose'
) AS r
    $$,
    'exact search by name'
);

select * from finish();
rollback;

-- TODO
-- caffeine should give the chemical before species with longer name and same 1.0 score
-- could penalize score by length with a simple algebraic formula
-- TODO same for Guanosine
