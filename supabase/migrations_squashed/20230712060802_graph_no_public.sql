drop policy "Anyone can read edges that are public" on "public"."edge";

drop policy "Anyone can read nodes that are public" on "public"."node";

drop policy "Admin can manage node types" on "public"."node_type";

alter table "public"."node" drop constraint "node_user_id_fkey";

create table "public"."edge_history" (
    "id" bigint generated by default as identity not null,
    "time" timestamp without time zone,
    "edge_id" bigint not null,
    "source" text not null,
    "source_details" text not null,
    "user_id" uuid,
    "change_type" text not null,
    "change_column" text
);


alter table "public"."edge_history" enable row level security;

create table "public"."node_history" (
    "id" bigint generated by default as identity not null,
    "time" timestamp without time zone,
    "node_id" bigint not null,
    "source" text not null,
    "source_details" text not null,
    "user_id" uuid,
    "change_type" text not null,
    "change_column" text
);


alter table "public"."node_history" enable row level security;

alter table "public"."edge" drop column "public";

alter table "public"."edge" add column "id" bigint generated by default as identity not null;

alter table "public"."node" drop column "public";

alter table "public"."node" add column "hash" text not null;

CREATE UNIQUE INDEX edge_history_pkey ON public.edge_history USING btree (id);

CREATE UNIQUE INDEX edge_pkey ON public.edge USING btree (id);

CREATE UNIQUE INDEX node_hash_key ON public.node USING btree (hash);

CREATE UNIQUE INDEX node_history_pkey ON public.node_history USING btree (id);

alter table "public"."edge" add constraint "edge_pkey" PRIMARY KEY using index "edge_pkey";

alter table "public"."edge_history" add constraint "edge_history_pkey" PRIMARY KEY using index "edge_history_pkey";

alter table "public"."node_history" add constraint "node_history_pkey" PRIMARY KEY using index "node_history_pkey";

alter table "public"."edge_history" add constraint "edge_history_change_type_check" CHECK ((change_type = ANY (ARRAY['create'::text, 'modify'::text, 'delete'::text]))) not valid;

alter table "public"."edge_history" validate constraint "edge_history_change_type_check";

alter table "public"."edge_history" add constraint "edge_history_edge_id_fkey" FOREIGN KEY (edge_id) REFERENCES edge(id) ON DELETE CASCADE not valid;

alter table "public"."edge_history" validate constraint "edge_history_edge_id_fkey";

alter table "public"."edge_history" add constraint "edge_history_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."edge_history" validate constraint "edge_history_user_id_fkey";

alter table "public"."node" add constraint "node_hash_key" UNIQUE using index "node_hash_key";

alter table "public"."node_history" add constraint "node_history_change_type_check" CHECK ((change_type = ANY (ARRAY['create'::text, 'modify'::text, 'delete'::text]))) not valid;

alter table "public"."node_history" validate constraint "node_history_change_type_check";

alter table "public"."node_history" add constraint "node_history_node_id_fkey" FOREIGN KEY (node_id) REFERENCES node(id) ON DELETE CASCADE not valid;

alter table "public"."node_history" validate constraint "node_history_node_id_fkey";

alter table "public"."node_history" add constraint "node_history_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."node_history" validate constraint "node_history_user_id_fkey";

alter table "public"."node" add constraint "node_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profile(id) not valid;

alter table "public"."node" validate constraint "node_user_id_fkey";

create policy "Anyone can read edges"
on "public"."edge"
as permissive
for select
to public
using (true);


create policy "Anyone can read edge_history"
on "public"."edge_history"
as permissive
for select
to public
using (true);


create policy "Anyone can read nodes"
on "public"."node"
as permissive
for select
to public
using (true);


create policy "Anyone can read node_history"
on "public"."node_history"
as permissive
for select
to public
using (true);


