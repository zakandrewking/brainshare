-- This function ensures that a custom type name is unique for a given user.

create or replace function get_unique_custom_type_name(suggested_name text, user_id_param uuid)
returns text
language plpgsql
security definer
as $$
declare
    result text;
begin
    with numbered_names as (
        -- Find all existing names that match the pattern "name-number"
        select
            (regexp_match(name, '^' || suggested_name || '(?:-(\d+))?$'))[1]::integer as num
        from custom_type
        where
            name = suggested_name  -- exact match
            or name ~ ('^' || suggested_name || '-\d+$')  -- pattern match
            and user_id = user_id_param
    )
    select
        case
            when not exists (select 1 from custom_type where name = suggested_name and user_id = user_id_param)
            then suggested_name  -- if exact name doesn't exist, use it
            else suggested_name || '-' || (
                coalesce(
                    (select min(n)::text
                    from generate_series(1, (select coalesce(max(num), 0) + 1 from numbered_names)) n
                    where n not in (select coalesce(num, 0) from numbered_names)
                    ), '1'
                )
            )
        end into result;

    return result;
end;
$$;

-- Grant access to authenticated users
grant execute on function get_unique_custom_type_name to authenticated;
