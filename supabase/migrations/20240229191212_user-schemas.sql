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

create or replace function public.create_data_jwt() returns text as $$
declare
    jwt text;
    role_id text;
    user_id text;
    iat integer;
    exp integer;
    payload json;
begin
    user_id := auth.uid();
    if user_id is null then
        raise exception 'Cannot generate data JWT' using detail = 'Could not find logged in user ID';
    end if;
    role_id := 'data_role_' || replace(user_id, '-', '_');
    iat := round(extract(epoch from current_timestamp));
    exp := iat + 60 * 60 * 1; -- 1 hour
    payload := '{"iss":"supabase","sub":"' || user_id || '","role":"' || role_id || '",' ||
        '"iat":' || iat::text || ',"exp":' || exp::text || '}';
    raise notice 'payload: %', payload;
    jwt := extensions.sign( -- https://supabase.com/docs/guides/database/extensions/pgjwt
        payload :=  payload,
        secret := current_setting('app.settings.jwt_secret')
    );
    return jwt;
end;
$$ language plpgsql;
grant execute on function public.create_data_jwt to authenticated, service_role;

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

