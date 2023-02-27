drop policy "Authenticated user can manage chemical_history" on "public"."chemical_history";

alter table "public"."chemical_history" drop constraint "chemical_history_change_type_check";

alter table "public"."chemical_history" drop constraint "chemical_history_user_id_fkey";

alter table "public"."genome_history" drop constraint "genome_history_user_id_fkey";

alter table "public"."protein_history" drop constraint "protein_history_user_id_fkey";

alter table "public"."reaction_history" drop constraint "reaction_history_user_id_fkey";

alter table "public"."species_history" drop constraint "species_history_user_id_fkey";

alter table "public"."user_role" drop constraint "user_role_user_id_fkey";

create table "public"."profile" (
    "id" uuid not null,
    "username" text
);


alter table "public"."profile" enable row level security;

alter table "public"."chemical_history" drop column "change_column";

alter table "public"."chemical_history" add column "new_values" jsonb;

alter table "public"."chemical_history" alter column "source" drop not null;

alter table "public"."chemical_history" alter column "source_details" drop not null;

alter table "public"."chemical_history" alter column "time" set not null;

CREATE UNIQUE INDEX profile_pkey ON public.profile USING btree (id);

CREATE UNIQUE INDEX profile_username_key ON public.profile USING btree (username);

alter table "public"."profile" add constraint "profile_pkey" PRIMARY KEY using index "profile_pkey";

alter table "public"."profile" add constraint "profile_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) not valid;

alter table "public"."profile" validate constraint "profile_id_fkey";

alter table "public"."profile" add constraint "profile_username_key" UNIQUE using index "profile_username_key";

alter table "public"."chemical_history" add constraint "chemical_history_change_type_check" CHECK ((change_type = ANY (ARRAY['create'::text, 'update'::text, 'delete'::text]))) not valid;

alter table "public"."chemical_history" validate constraint "chemical_history_change_type_check";

alter table "public"."chemical_history" add constraint "chemical_history_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profile(id) not valid;

alter table "public"."chemical_history" validate constraint "chemical_history_user_id_fkey";

alter table "public"."genome_history" add constraint "genome_history_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profile(id) not valid;

alter table "public"."genome_history" validate constraint "genome_history_user_id_fkey";

alter table "public"."protein_history" add constraint "protein_history_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profile(id) not valid;

alter table "public"."protein_history" validate constraint "protein_history_user_id_fkey";

alter table "public"."reaction_history" add constraint "reaction_history_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profile(id) not valid;

alter table "public"."reaction_history" validate constraint "reaction_history_user_id_fkey";

alter table "public"."species_history" add constraint "species_history_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profile(id) not valid;

alter table "public"."species_history" validate constraint "species_history_user_id_fkey";

alter table "public"."user_role" add constraint "user_role_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profile(id) not valid;

alter table "public"."user_role" validate constraint "user_role_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.jsonb_diff_val(val1 jsonb, val2 jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  result JSONB;
  v RECORD;
BEGIN
   result = val1;
   FOR v IN SELECT * FROM jsonb_each(val2) LOOP
     IF result @> jsonb_build_object(v.key,v.value)
        THEN result = result - v.key;
     ELSIF result ? v.key THEN CONTINUE;
     ELSE
        result = result || jsonb_build_object(v.key, 'null');
     END IF;
   END LOOP;
   RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.on_update_chemical()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
IF (current_user) = 'authenticated' THEN
    INSERT INTO public.chemical_history
        (time, chemical_id, user_id, change_type, new_values)
    VALUES
        (now(), NEW.id, auth.uid(), 'update', public.jsonb_diff_val(to_jsonb(NEW), to_jsonb(OLD)));
END IF;
RETURN NULL;
END;
$function$
;

create policy "Authenticated user can create chemical_history"
on "public"."chemical_history"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Anyone can read profiles"
on "public"."profile"
as permissive
for select
to public
using (true);


create policy "Authenticated user can manage their profile"
on "public"."profile"
as permissive
for all
to public
using ((auth.uid() = id));


CREATE TRIGGER chemical_update_trigger AFTER UPDATE ON public.chemical FOR EACH ROW EXECUTE FUNCTION on_update_chemical();


