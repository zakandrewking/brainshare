-- -- query name sorting

begin;
select plan( 1 );

INSERT INTO chemical (inchi, inchi_key, name)
VALUES ('test-inchi-2', 'test-inchi-key-2', 'beta-D-glucose'),
       ('test-inchi-1', 'test-inchi-key-1', 'alpha-D-glucose');

SELECT results_eq(
    $$
SELECT jsonb_path_query(res, '$.results[*].name') #>> '{}' AS name FROM search('alph glucose') AS res
    $$,
    $$
SELECT name FROM chemical WHERE inchi LIKE 'test-inchi-%' ORDER BY inchi
    $$,
    'search by name sorting'
);

select * from finish();
rollback;
