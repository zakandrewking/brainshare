# Brainshare

An API for biology

# Status

Brainshare Metabolism is in early stage development, but feel free to peruse the code.

# Run locally

1. Run `supabase start` (terminal or vscode task)

1. Make a copy of frontend/.env.example called frontend/.env

1. Copy the Anon Key and API URL into frontend/.env

1. Make a copy of bin/.env.example called bin/.env

1. Copy the Service Role Key and API URL into bin/.env

# Generate migrations

To maintain declarative SQL migrations in `supabase/migrations`, follow the
following steps:

1. Add new database changes to existing files in `supabase/migrations`
1. Test / develop
1. Apply the new schema with `supabase db reset`
1. Stash your changes
1. Run `supabase db diff -f <name for changes>`
1. Move the new migration to `migrations_squashed`
1. Pop the stash
1. Git commit
1. Run the new migration on the remote with `psql -f`
1. If there is an issue, edit the new migration & ammend the commit
1. Git push

If you reorganize the migration files, check that they are valid before
committing:

1. Reorganize the files in `supabase/migrations`
1. Apply the new schema with `supabase db reset`
1. Stash your changes
1. Run `supabase db diff` & confirm that nothing changed
1. Pop the stash
1. Manually modify the remote migrations table
   `supabase_migrations.schema_migrations`
1. Run `supabase db push --dry-run` & make sure it does not error
1. Git commit & push

# Reset database

1. Drop public and recreate it:

```psql
DROP SCHEMA public CASCADE;
DELETE FROM supabase_migrations.schema_migrations;
CREATE SCHEMA IF NOT EXISTS public;
DROP POLICY "Anyone can read buckets" ON storage.buckets;
DROP POLICY "Anyone can read objects" ON storage.objects;
```

2. Delete buckets

3. Apply migrations:

```bash
supabase db push
```

# Troubleshooting

## must be member of role "supabase_admin" (SQLSTATE 42501) while executing migration

https://github.com/supabase/supabase/discussions/6326#discussioncomment-2604815
