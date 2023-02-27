BEGIN;
SELECT plan( 13 );

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

SELECT results_eq(
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

SELECT is_indexed('public', 'synonym', 'value', 'synonym has index on value');

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

DELETE FROM chemical;
DELETE FROM synonym;

-- -- query name sorting

INSERT INTO chemical (inchi, inchi_key, name)
VALUES ('test-inchi-2', 'test-inchi-key-2', 'beta-D-glucose'),
       ('test-inchi-1', 'test-inchi-key-1', 'alpha-D-glucose');

SELECT results_eq(
    $$
SELECT jsonb_array_elements(res->'results')->>'name' AS name FROM search('alph glucose') AS res
    $$,
    $$
SELECT name FROM chemical WHERE inchi LIKE 'test-inchi-%' ORDER BY inchi
    $$,
    'search by name sorting'
);

DELETE FROM chemical;

-- -- query name sorting; subset

INSERT INTO chemical (inchi, inchi_key, name)
VALUES ('test-inchi-3', 'test-inchi-key-3', 'Dianthramine'),
       ('test-inchi-2', 'test-inchi-key-2', 'long-hexane-1,6-diamine'),
       ('test-inchi-1', 'test-inchi-key-1', 'hexane-1,6-diamine');

SELECT results_eq(
    $$
SELECT jsonb_array_elements(res->'results')->>'name' AS name FROM search('diam') as res
    $$,
    $$
SELECT name FROM chemical WHERE inchi LIKE 'test-inchi-%' ORDER BY inchi
    $$,
    'exact search by name'
);

DELETE FROM chemical;

-- sorting between types

INSERT INTO chemical (inchi, inchi_key, name) VALUES
    ('test-inchi-1', 'test-inchi-key-1', 'caffeine'),
    ('test-inchi-2', 'test-inchi-key-2', 'caffeine monohydrate');

SELECT cmp_ok(
    (jsonb_path_query(search('caffeine'), '$.results[*] ? (@.name == "caffeine")')->>'score')::numeric,
    '>',
    (jsonb_path_query(search('caffeine'), '$.results[*] ? (@.name == "caffeine monohydrate")')->>'score')::numeric,
    'More complete matches are better'
);

DELETE FROM chemical;

-- protein by name, short name, hash, or synonym

WITH rows AS (
    INSERT INTO protein (name, short_name, sequence, hash) VALUES
        ('protein1', 'x1', 'ABC', 'def')
    RETURNING id
) INSERT INTO synonym (source, value, protein_id)
    SELECT 'uniprot', 'uni1', id FROM rows LIMIT 1;

SELECT cmp_ok(
    (search('protein')->'results'->0->>'score')::numeric,
    '>', 0.8, 'search by protein name'
);

SELECT is_indexed('public', 'protein', 'name', 'protein has name index');

SELECT cmp_ok(
    (search('x1')->'results'->0->>'score')::numeric,
    '=', 1.0, 'search by protein short name'
);

SELECT is_indexed('public', 'protein', 'short_name', 'protein has short name index');

SELECT cmp_ok(
    (search('uni1')->'results'->0->>'score')::numeric,
    '=', 1.0, 'search by protein synonym'
);

DELETE FROM protein;
DELETE FROM synonym;

-- species search

SELECT is_indexed('public', 'species', 'name', 'species has name index');

select * from finish();
rollback;

-- genome search

-- TODO "e coli mg1655"
