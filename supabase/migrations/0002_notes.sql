-- Create the table
create table notes (
   id serial primary key,
   title text,
   user_id text not null
 );
alter table notes enable row level security;
create policy "Authenticated user can manage their notes" on notes
    for all to public using (requesting_user_id() = user_id);
