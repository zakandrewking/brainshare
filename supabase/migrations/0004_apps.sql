create table app (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    user_id text not null,
    -- TODO implement organizations
    unique (name, user_id)
);
alter table app enable row level security;
create policy "Authenticated user can manage their projects" on app
  for all using (requesting_user_id() = user_id);
