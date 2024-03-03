-- custom tables live in a separate schema. among other things, this allows
-- helps avoid challenges with supabase type generation & database diffing. and
-- provides security. we access via custom postgres roles for each use so
-- postgrest can filter openapi specs.

-- schemas for users will be data_<user_id> and will have the same permissions
-- as this example schema
create schema data_example;
create table data_example.permission_check (
  id serial primary key
);
grant usage on schema data_example to anon;
grant select on data_example.permission_check to anon;

-- Update PostgREST settings for multi-schema support see:
-- https://github.com/orgs/supabase/discussions/12270
--
-- NOTE for debugging these settings, from the postgres docs: "SET ROLE does not
-- process session variables as specified by the role's ALTER ROLE settings;
-- this only happens during login."

-- Only allow openapi for the authenticated user
ALTER ROLE authenticator SET pgrst.openapi_mode = 'follow-privileges';
-- Add additional schemas to the PostgREST configuration
ALTER ROLE authenticator SET pgrst.db_schemas = 'public,storage,graphql_public,data_example';
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema'; -- needed if you update the schema during testing

-- ----------
-- more notes
-- ----------

-- Goal: each user gets their own schema
-- Reason: to keep the super nice auto REST auto GraphQL but not leak any schema
-- info to other users
-- Test:
-- + separate JWT validation for openapi/postgrest on each schema
-- + run pg_graphql on a schema that is not public
-- + separate JWT validation for pg_graphql on each schema
-- + test the schemas running in separate databases & regions
-- [ ]  go back and test out the local setup _without_ follow privileges
-- Implement:
-- + API gateway to handle api keys for user access
-- + Proxy (same API Gateway? python API?) for frontend to access the schemas

