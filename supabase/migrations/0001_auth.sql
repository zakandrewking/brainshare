-- -- From a previous version using Clerk auth
-- create or replace function requesting_user_id()
-- returns text
-- as $$
--     select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
-- $$ language sql;
-- based on
-- https://github.com/orgs/supabase/discussions/12269#discussioncomment-4908791
CREATE OR REPLACE PROCEDURE auth.login_as_user(user_id text)
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE NOTICE '%', format('Logging in as authenticated (%L))', user_id);
    EXECUTE format('SET request.jwt.claims=''{"sub": %I}''', user_id);
    EXECUTE format('SET ROLE authenticated');
END;
$$;

CREATE OR REPLACE PROCEDURE auth.login_as_anon()
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE format('SET request.jwt.claims=' '''');
    EXECUTE format('SET ROLE anon');
END;
$$;

-- bypass RLS
CREATE OR REPLACE PROCEDURE auth.login_as_service_role()
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE NOTICE '%', format('Logging in as service_role');
    EXECUTE format('SET request.jwt.claims=' '''');
    EXECUTE format('SET ROLE service_role');
END;
$$;

-- call this after `RESET ROLE` to reset the jwt claims
CREATE OR REPLACE PROCEDURE auth.logout()
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE format('SET request.jwt.claims=' '''');
END;
$$;

