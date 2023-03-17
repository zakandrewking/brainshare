alter table "public"."article_content" add column "text" text not null;

alter table "public"."article_content" alter column "embedding" set not null;


