alter table "public"."synced_file" drop constraint "synced_file_parent_id_fkey";

alter table "public"."synced_file" drop column "parent_id";

alter table "public"."synced_file" add column "parent_ids" bigint[] not null default '{}'::bigint[];


