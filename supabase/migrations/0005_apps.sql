create table app (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    user_id text not null,
    deploy_subdomain text,
    deploy_subdomain_ready boolean not null default false,
    deploy_app_task_link_id bigint references task_link(id),
    -- TODO implement organizations
    unique (name, user_id)
);
alter table app enable row level security;
create policy "Authenticated user can manage their apps" on app
  for all using (requesting_user_id() = user_id);


create table app_files (
    id uuid primary key default uuid_generate_v4(),
    app_id uuid not null references app(id),
    name text not null,
    file bytea not null,
    unique (app_id, name)
);
alter table app_files enable row level security;
create policy "Authenticated user can manage their app files" on app_files
  for all using (requesting_user_id() = (select user_id from app where id = app_id));
