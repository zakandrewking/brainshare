-- Custom types are used to define the type of a column in a table.
-- decimal: a floating point number
-- integer: an integer number
-- enum: a set of values, specified in redis
create table custom_type (
    id uuid primary key default gen_random_uuid(),
    kind text not null check (kind in ('decimal', 'integer', 'enum')),
    name text not null,
    description text not null,
    rules text[] not null default '{}',
    examples text[] not null default '{}',
    not_examples text[] not null default '{}',
    user_id uuid not null,
    values_key text generated always as (
        case
            when kind = 'enum' then 'br-values-' || id
            else null
        end
    ) stored,
    min_value numeric not null default '-Infinity',
    max_value numeric not null default 'Infinity',
    log_scale boolean not null default false,
    public boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (name, user_id)
);

alter table custom_type enable row level security;

-- Create RLS policies
create policy "Users can manage their own custom types" on custom_type
    for all to authenticated using (auth.uid() = user_id);

create policy "Anyone can read public custom types" on custom_type
    for select using (public = true);
