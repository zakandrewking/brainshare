begin;
select plan( 2 );

select results_eq(
    'select CAST(results AS jsonb) from search('''')',
    'select jsonb_agg(r) as results from (select 1 where false) as r',
    'empty search returns no results'
);

select results_eq(
    'select CAST(results AS jsonb) from search(''dia'')',
    'select jsonb_agg(r) as results from (select *, 0.107143 as score from chemical) as r',
    'empty search returns no results'
);

select * from finish();
rollback;
