# Supabase & db management

## Seeding

https://snaplet-seed.netlify.app/seed/integrations/supabase

Update the seeding script:

```bash
cd supabase
npx @snaplet/seed sync
npx tsx seed.ts > seed.sql
```

## Migrations

If you have a brand new migration, you can simply run:

```sh
supabase db push
```

To edit existing migrations, and maintain declarative SQL files in
`supabase/migrations`, follow the following steps:

1. Add new database changes to existing files in `supabase/migrations`
1. Test / develop
1. Apply the new schema with `supabase db reset`
1. Stash your changes
1. Run `supabase db diff -f <name for changes>`
1. Move the new migration to `migrations_squashed` if there are changes
1. Pop the stash
1. Git commit
1. Manually modify the remote migrations table
   `supabase_migrations.schema_migrations` if there are changes in the migration list
1. Run new migration(s) on the remote with `psql -f`
1. If there is an issue, edit the new migration(s) & ammend the commit
1. Git push

## Reset database

1. Drop public and recreate it:

```psql
DROP SCHEMA public CASCADE;
DELETE FROM supabase_migrations.schema_migrations;
CREATE SCHEMA IF NOT EXISTS public;
DROP POLICY "Anyone can read buckets" ON storage.buckets;
DROP POLICY "Anyone can read objects" ON storage.objects;
```

1. Delete buckets

1. Apply migrations:

```bash
supabase db push
```
