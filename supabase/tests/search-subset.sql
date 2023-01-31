-- -- query name sorting; subset

begin;
select plan( 1 );

DELETE FROM chemical;

INSERT INTO chemical (inchi, inchi_key, name)
VALUES ('test-inchi-3', 'test-inchi-key-3', 'Dianthramine'),
       ('test-inchi-2', 'test-inchi-key-2', 'long-hexane-1,6-diamine'),
       ('test-inchi-1', 'test-inchi-key-1', 'hexane-1,6-diamine');

select results_eq(
    'select jsonb_path_query(res, ''$.results[*].name'') #>> ''{}'' as name from search(''diam'') as res',
    'select name from chemical where inchi like ''test-inchi-%'' ORDER BY inchi',
    'exact search by name'
);

select * from finish();
rollback;
