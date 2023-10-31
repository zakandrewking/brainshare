# Brainshare

Brainshare is a place to create and share scientific knowledge. More at [brainshare.io](https://brainshare.io).

# Status

Brainshare is in early stage development, but feel free to peruse the code.

# Run locally

1. Run `supabase start` (terminal or vscode task)

1. Make a copy of frontend/.env.example called frontend/.ene

1. Copy the Anon Key and API URL into frontend/.env

1. Make a copy of bin/.env.example called bin/.env

1. Copy the Service Role Key and API URL into bin/.env

# Generate migrations

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
