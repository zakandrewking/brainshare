drop policy "Anyone can read chemicals" on "public"."chemical";

drop policy "Anyone can read chemical history" on "public"."chemical_history";

create table "public"."user_role" (
    "user_id" uuid not null,
    "role" text not null
);


alter table "public"."user_role" enable row level security;

CREATE UNIQUE INDEX user_role_pkey ON public.user_role USING btree (user_id, role);

alter table "public"."user_role" add constraint "user_role_pkey" PRIMARY KEY using index "user_role_pkey";

alter table "public"."user_role" add constraint "user_role_role_check" CHECK ((role = ANY (ARRAY['admin'::text, 'curator'::text]))) not valid;

alter table "public"."user_role" validate constraint "user_role_role_check";

alter table "public"."user_role" add constraint "user_role_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."user_role" validate constraint "user_role_user_id_fkey";

create policy "Authenticated user can manage chemicals"
on "public"."chemical"
as permissive
for all
to authenticated
using (true);


create policy "Authenticated user can manage chemical_history"
on "public"."chemical_history"
as permissive
for all
to public
using ((auth.uid() = user_id));


create policy "Authenticated user can read their own role"
on "public"."user_role"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Anyone can read chemicals"
on "public"."chemical"
as permissive
for select
to public
using (true);


create policy "Anyone can read chemical history"
on "public"."chemical_history"
as permissive
for select
to public
using (true);



