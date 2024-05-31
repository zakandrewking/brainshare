create table app (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    user_id text not null,
    deploy_subdomain_ready boolean not null default false,
    deploy_app_task_link_id bigint references task_link(id),
    prefix text unique,
    deployed_db_file_id bigint references file(id),
    -- TODO implement organizations
    unique (name, user_id)
);
alter table app enable row level security;
create policy "Authenticated user can manage their apps" on app
  for all using (requesting_user_id() = user_id);


create table app_db_file (
    app_id uuid not null references app(id),
    file_id bigint not null references file(id),
    created_at timestamptz not null default (now() at time zone 'utc'),
    primary key (app_id, file_id)
);
alter table app_db_file enable row level security;
create policy "Authenticated user can manage their app files" on app_db_file
  for all using (requesting_user_id() = (select user_id from app where id = app_id));
