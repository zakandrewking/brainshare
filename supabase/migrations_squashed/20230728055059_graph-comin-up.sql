alter table "public"."edge" drop constraint "edge_destination_id_fkey";

alter table "public"."edge" drop constraint "edge_source_id_fkey";

alter table "public"."edge" drop constraint "edge_user_id_fkey";

alter table "public"."node" drop constraint "node_user_id_fkey";

alter table "public"."node_history" drop constraint "node_history_user_id_fkey";

alter table "public"."edge" add constraint "edge_destination_id_fkey" FOREIGN KEY (destination_id) REFERENCES node(id) ON DELETE CASCADE not valid;

alter table "public"."edge" validate constraint "edge_destination_id_fkey";

alter table "public"."edge" add constraint "edge_source_id_fkey" FOREIGN KEY (source_id) REFERENCES node(id) ON DELETE CASCADE not valid;

alter table "public"."edge" validate constraint "edge_source_id_fkey";

alter table "public"."edge" add constraint "edge_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."edge" validate constraint "edge_user_id_fkey";

alter table "public"."node" add constraint "node_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."node" validate constraint "node_user_id_fkey";

alter table "public"."node_history" add constraint "node_history_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."node_history" validate constraint "node_history_user_id_fkey";


