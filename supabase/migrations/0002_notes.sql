-- Create the table
create table public.notes (
   id serial primary key,
   title text,
   user_id uuid not null
 );
alter table public.notes enable row level security;
create policy "Authenticated user can manage their notes" on public.notes
    for all to authenticated using (auth.uid() = user_id);
