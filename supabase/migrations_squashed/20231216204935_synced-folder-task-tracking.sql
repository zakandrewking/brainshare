alter table "public"."synced_folder" add column "update_task_created_at" timestamp without time zone;

alter table "public"."synced_folder" add column "update_task_error" text;

alter table "public"."synced_folder" add column "update_task_id" text;


