alter table "public"."file_data" drop constraint "file_data_file_id_fkey";

alter table "public"."file_data" drop column "file_id";

alter table "public"."file_data" add column "text_summary" text;

alter table "public"."file_data" alter column "synced_file_id" set not null;

alter table "public"."synced_file" add column "deleted" boolean not null default false;


