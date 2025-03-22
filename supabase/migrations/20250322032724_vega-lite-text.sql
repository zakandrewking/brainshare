drop policy "Authenticated user can manage their table widgets" on "public"."widget";

alter table "public"."widget" alter column "vega_lite_spec" set data type text using "vega_lite_spec"::text;

create policy "Authenticated user can manage their widgets"
on "public"."widget"
as permissive
for all
to authenticated
using ((auth.uid() = user_id));



