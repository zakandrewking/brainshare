# Brainshare Metabolism

An API for biology

# Status

Brainshare Metabolism is in early stage development, but feel free to peruse the code.

# Features

- [ ] REST & GraphQL APIs for InChI

# Run locally

1. Run `supabase start` (terminal or vscode task)

1. Make a copy of frontend/.env.example called frontend/.env

1. Copy the Anon Key and API URL into frontend/.env

1. Make a copy of bin/.env.example called bin/.env

1. Copy the Service Role Key and API URL into bin/.env

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

## must be member of role "supabase_admin" (SQLSTATE 42501); while executing migration

https://github.com/supabase/supabase/discussions/6326#discussioncomment-2604815
