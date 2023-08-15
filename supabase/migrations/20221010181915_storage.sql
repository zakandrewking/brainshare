create policy "Anyone can read buckets"
    on storage.buckets for select
    to authenticated, anon
    using ( true );

create policy "Authenticated user can create files"
    on storage.objects for insert to authenticated
    with check ( bucket_id = 'files' );

create policy "Authenticated user can manage their own files"
    on storage.objects for all
    using ( bucket_id = 'files' and auth.uid() = owner );

insert into storage.buckets (id, name, public)
    values ('genome_sequences', 'genome_sequences', true);
create policy "Anyone can read genome sequences"
    on storage.objects for select using ( bucket_id = 'genome_sequences' );
