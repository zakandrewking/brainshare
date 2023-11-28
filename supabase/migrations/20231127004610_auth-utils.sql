-- based on
-- https://github.com/orgs/supabase/discussions/12269#discussioncomment-4908791

CREATE OR REPLACE PROCEDURE auth.login_as_user (user_id uuid)
    LANGUAGE plpgsql
    AS $$
DECLARE
    auth_user auth.users;
BEGIN
    SELECT * INTO auth_user FROM auth.users WHERE id = user_id;
    EXECUTE format('SET request.jwt.claim.sub=%I', (auth_user).id::text);
    EXECUTE format('SET request.jwt.claim.role=%I', (auth_user).ROLE);
    EXECUTE format('SET request.jwt.claim.email=%I', (auth_user).email);
    EXECUTE format('SET request.jwt.claims=%I', json_strip_nulls(json_build_object('app_metadata', (auth_user).raw_app_meta_data))::text);

    RAISE NOTICE '%', format( 'SET ROLE %I; -- Logging in as %L (%L)', (auth_user).ROLE, (auth_user).id, (auth_user).email);
    EXECUTE format('SET ROLE %I', (auth_user).ROLE);
END;
$$;

CREATE OR REPLACE PROCEDURE auth.login_as_anon ()
    LANGUAGE plpgsql
    AS $$
BEGIN
    EXECUTE format('SET request.jwt.claim.sub=''''');
    EXECUTE format('SET request.jwt.claim.role=''''');
    EXECUTE format('SET request.jwt.claim.email=''''');
    EXECUTE format('SET request.jwt.claims=''''');
    EXECUTE format('SET ROLE anon');
END;
$$;

-- bypass RLS
CREATE OR REPLACE PROCEDURE auth.login_as_service_role ()
    LANGUAGE plpgsql
    AS $$
BEGIN
    EXECUTE format('SET request.jwt.claim.sub=''''');
    EXECUTE format('SET request.jwt.claim.role=''''');
    EXECUTE format('SET request.jwt.claim.email=''''');
    EXECUTE format('SET request.jwt.claims=''''');
    EXECUTE format('SET ROLE service_role');
END;
$$;

-- call this after `RESET ROLE` to reset the jwt claims
CREATE OR REPLACE PROCEDURE auth.logout ()
    LANGUAGE plpgsql
    AS $$
BEGIN
    EXECUTE format('SET request.jwt.claim.sub=''''');
    EXECUTE format('SET request.jwt.claim.role=''''');
    EXECUTE format('SET request.jwt.claim.email=''''');
    EXECUTE format('SET request.jwt.claims=''''');
END;
$$;
