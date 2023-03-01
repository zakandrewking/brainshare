drop policy "Anyone can read reactions" on "public"."reaction";

drop policy "Anyone can read reaction history" on "public"."reaction_history";

alter table "public"."reaction_history" drop constraint "reaction_history_change_type_check";

alter table "public"."reaction" drop column "display_options";

alter table "public"."reaction_history" drop column "change_column";

alter table "public"."reaction_history" add column "new_values" jsonb;

alter table "public"."reaction_history" alter column "source" drop not null;

alter table "public"."reaction_history" alter column "source_details" drop not null;

alter table "public"."reaction_history" alter column "time" set not null;

CREATE INDEX stoichiometry_reverse_idx ON public.stoichiometry USING btree (reaction_id, chemical_id);

alter table "public"."reaction_history" add constraint "reaction_history_change_type_check" CHECK ((change_type = ANY (ARRAY['create'::text, 'update'::text, 'delete'::text]))) not valid;

alter table "public"."reaction_history" validate constraint "reaction_history_change_type_check";

create policy "Admin can manage reactions"
on "public"."reaction"
as permissive
for all
to public
using (is_admin());


create policy "Authenticated user can create their own reaction history"
on "public"."reaction_history"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Anyone can read reactions"
on "public"."reaction"
as permissive
for select
to public
using (true);


create policy "Anyone can read reaction history"
on "public"."reaction_history"
as permissive
for select
to public
using (true);


CREATE TRIGGER reaction_update_trigger AFTER INSERT OR UPDATE ON public.reaction FOR EACH ROW EXECUTE FUNCTION on_edit('reaction');


