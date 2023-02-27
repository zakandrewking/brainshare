drop trigger if exists "chemical_update_trigger" on "public"."chemical";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.on_update_chemical()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
IF (current_user) = 'authenticated' THEN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.chemical_history
            (time, chemical_id, user_id, change_type, new_values)
        VALUES
            (now(), NEW.id, auth.uid(), 'create', to_jsonb(NEW));
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.chemical_history
            (time, chemical_id, user_id, change_type, new_values)
        VALUES
            (now(), NEW.id, auth.uid(), 'update', public.jsonb_diff_val(to_jsonb(NEW), to_jsonb(OLD)));
    END IF;
END IF;
RETURN NULL; -- result is ignored since this is an AFTER trigger
END;
$function$
;

CREATE TRIGGER chemical_update_trigger AFTER INSERT OR UPDATE ON public.chemical FOR EACH ROW EXECUTE FUNCTION on_update_chemical();


