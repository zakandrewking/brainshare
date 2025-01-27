-- This function ensures that a custom type name is unique for a given user.
CREATE OR REPLACE FUNCTION get_unique_custom_type_name(suggested_name text, user_id_param uuid)
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
DECLARE
    result text;
BEGIN
    WITH numbered_names AS (
        -- Find all existing names that match the pattern "name-number"
        SELECT
            (regexp_match(name, '^' || suggested_name || '(?:-(\d+))?$'))[1]::integer AS num
        FROM
            custom_type
        WHERE
            name = suggested_name -- exact match
            OR name ~('^' || suggested_name || '-\d+$') -- pattern match
            AND user_id = user_id_param
)
    SELECT
        CASE WHEN NOT EXISTS (
            SELECT
                1
            FROM
                custom_type
            WHERE
                name = suggested_name
                AND user_id = user_id_param) THEN
            suggested_name -- if exact name doesn't exist, use it
        ELSE
            suggested_name || '-' ||(coalesce((
                    SELECT
                        min(n)::text
                    FROM generate_series(1,(
                            SELECT
                                coalesce(max(num), 0) + 1
                            FROM numbered_names)) n
                WHERE
                    n NOT IN (
                        SELECT
                            coalesce(num, 0)
                        FROM numbered_names)), '1'))
        END INTO result;
    RETURN result;
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_unique_custom_type_name TO authenticated;

