begin;
select * from no_plan();

select create_dataset(
    '00000000-0000-0000-0000-000000000000'::uuid,
    'random_string',
    array['id', 'name'],
    array['bigint', 'text']
);

select isnt_empty(
    $$
select * from dataset_metadata;
    $$,
    'dataset_metadata has data'
);

select columns_are(
    'public',
    '00000000_0000_0000_0000_000000000000_random_string',
    array['id', 'name'],
    'dataset has columns'
);

select col_type_is(
    'public',
    '00000000_0000_0000_0000_000000000000_random_string',
    'id',
    'bigint',
    'dataset id has type bigint'
);

select col_type_is(
    'public',
    '00000000_0000_0000_0000_000000000000_random_string',
    'name',
    'text',
    'dataset name has type text'
);

select * from finish();
rollback;
