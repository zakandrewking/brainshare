alter table "public"."article_content" drop constraint "article_content_article_id_fkey";

alter table "public"."article_content" drop constraint "article_content_pkey";

drop index if exists "public"."article_content_pkey";

drop table "public"."article_content";

alter table "public"."article" drop column "name";

alter table "public"."article" add column "authors" jsonb not null;

alter table "public"."article" add column "doi" text not null;

alter table "public"."article" add column "journal" text;

alter table "public"."article" add column "public" boolean not null default false;

alter table "public"."article" add column "title" text not null;

alter table "public"."article" add column "user_id" uuid not null;

alter table "public"."article" enable row level security;

CREATE UNIQUE INDEX article_user_id_doi_key ON public.article USING btree (user_id, doi);

alter table "public"."article" add constraint "article_user_id_doi_key" UNIQUE using index "article_user_id_doi_key";

alter table "public"."article" add constraint "article_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profile(id) not valid;

alter table "public"."article" validate constraint "article_user_id_fkey";

create policy "Authenticated user can manage their articles"
on "public"."article"
as permissive
for all
to public
using ((auth.uid() = user_id));



