create table file (
    id bigint generated by default as identity primary key,
    name text not null,
    size bigint not null,
    bucket_id text not null,
    object_path text not null,
    user_id uuid not null references auth.users(id) on delete cascade,
    -- null poject_id indicates the default project
    project_id bigint references project(id) on delete cascade,
    mime_type text,
    tokens int,
    latest_task_id text
);
alter table file enable row level security;
create policy "Authenticated user can manage their files" on file
  for all using (auth.uid() = user_id);