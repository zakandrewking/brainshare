-- Projects

-- Projects are owned by users and referenced by graphs, files, and synced
-- folders

create table project (
    id bigint generated by default as identity primary key,
    name text not null,
    created_at timestamp not null default now(),
    user_id uuid not null references auth.users(id) on delete cascade,
    -- TODO implement organizations
    -- organization_id bigint references organization(id) on delete cascade,
    unique (user_id, name)
);
alter table project enable row level security;
create policy "Authenticated user can manage their projects" on project
  for all using (auth.uid() = user_id);