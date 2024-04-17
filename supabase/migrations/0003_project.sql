create table project (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    schema_name text not null generated always as (generate_schema_name(id)) stored,
    created_at timestamptz not null default (now() at time zone 'utc'),
    user_id text not null,
    -- TODO implement organizations
    -- organization_id bigint references organization(id) on delete cascade,
    unique (user_id, name)
);
alter table project enable row level security;
create policy "Authenticated user can manage their projects" on project
  for all using (requesting_user_id() = user_id);
