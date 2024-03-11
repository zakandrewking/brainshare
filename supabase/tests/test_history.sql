BEGIN;

-- NOTE: cannot use no_plan() with `supabase db test`
SELECT plan( 2 );

CREATE OR REPLACE PROCEDURE auth.login_as_user(user_email text) AS $$
DECLARE
    auth_user auth.users;
BEGIN
    SELECT * INTO auth_user FROM auth.users WHERE email = user_email;
    EXECUTE format('SET request.jwt.claim.sub=%I', (auth_user).id::text);
    EXECUTE format('SET request.jwt.claim.role=%I', (auth_user).ROLE);
    EXECUTE format('SET request.jwt.claim.email=%I', (auth_user).email);
    EXECUTE format('SET request.jwt.claims=%I', json_strip_nulls(json_build_object('app_metadata', (auth_user).raw_app_meta_data))::text);

    RAISE NOTICE '%', format( 'SET ROLE %I; -- Logging in as %L (%L)', (auth_user).ROLE, (auth_user).id, (auth_user).email);
    EXECUTE format('SET ROLE %I', (auth_user).ROLE);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE PROCEDURE auth.login_as_anon() AS $$
BEGIN
    SET request.jwt.claim.sub='';
    SET request.jwt.claim.role='';
    SET request.jwt.claim.email='';
    SET request.jwt.claims='';
    SET ROLE anon;
END;
$$ LANGUAGE plpgsql;

-- first run SET SESSION AUTHORIZATION default;
CREATE OR REPLACE PROCEDURE auth.logout() AS $$
BEGIN
    SET request.jwt.claim.sub='';
    SET request.jwt.claim.role='';
    SET request.jwt.claim.email='';
    SET request.jwt.claims='';
    SET ROLE postgres;
END;
$$ LANGUAGE plpgsql;

CALL auth.login_as_user('test@example.com');

INSERT INTO chemical (id, inchi, inchi_key) VALUES (1, 'abc', 'def');

SELECT results_eq($$
SELECT change_type FROM chemical_history;
$$,$$
SELECT 'create' as change_type;
$$, 'insert creates a history entry');

UPDATE chemical SET inchi = 'ghi';

SELECT results_eq($$
SELECT new_values FROM chemical_history WHERE change_type = 'update';
$$,$$
SELECT '{"inchi":"ghi"}'::jsonb as new_values;
$$, 'insert creates a history entry');

SET SESSION AUTHORIZATION default;
CALL auth.logout();

DELETE FROM chemical;
DELETE FROM article;
DELETE FROM auth.users;

select * from finish();
rollback;
