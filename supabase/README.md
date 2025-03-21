# Supabase & db management

## Migrations

We use [declarative database
schemas](https://supabase.com/docs/guides/local-development/declarative-database-schemas).

To edit existing schemas, follow the following steps:

1. Add new database changes to existing files in `supabase/schemas`
1. Test
1. Run `supabase stop`
1. Generate a migration with `supabase db diff -f <name of the change>`
1. Run `supabase start`
1. Test again
1. Apply to prod with `supabase db push`
1. Git push

## Seeding

https://snaplet-seed.netlify.app/seed/integrations/supabase

Update the seeding script:

```bash
cd supabase
npx @snaplet/seed sync
npx tsx seed.ts > seed.sql
```

## Reset database

1. Drop public and recreate it:

```psql
DROP SCHEMA public CASCADE;
DELETE FROM supabase_migrations.schema_migrations;
CREATE SCHEMA IF NOT EXISTS public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
DROP POLICY "Anyone can read buckets" ON storage.buckets;
DROP POLICY "Authenticated user can create objects" ON storage.objects;
DROP POLICY "Authenticated user can manage their own objects" ON storage.objects;
```

Consider also dropping the procedures in `supabase/schemas/0001_auth.sql`.

1. Delete buckets
