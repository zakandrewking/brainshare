create extension if not exists "pg_jsonschema" with schema "public" version '0.1.4';

alter table "public"."node" drop constraint "node_type_fkey";

alter table "public"."node" drop constraint "node_user_id_fkey";

alter table "public"."node_type" drop constraint "node_type_pkey";

drop index if exists "public"."node_type_pkey";

create table "public"."definition" (
    "id" text not null,
    "component_id" text not null,
    "options" jsonb not null default '{}'::jsonb
);


alter table "public"."definition" enable row level security;

alter table "public"."node" drop column "type";

alter table "public"."node" add column "node_type_id" text not null;

alter table "public"."node" alter column "data" set default '{}'::jsonb;

alter table "public"."node" alter column "data" set not null;

alter table "public"."node_type" drop column "name";

alter table "public"."node_type" drop column "top_level";

alter table "public"."node_type" add column "detail_definition_ids" text[] not null;

alter table "public"."node_type" add column "id" text not null;

alter table "public"."node_type" add column "list_definition_ids" text[] not null;

alter table "public"."node_type" add column "options" jsonb not null default '{}'::jsonb;

CREATE UNIQUE INDEX definition_pkey ON public.definition USING btree (id);

CREATE UNIQUE INDEX node_type_pkey ON public.node_type USING btree (id);

alter table "public"."definition" add constraint "definition_pkey" PRIMARY KEY using index "definition_pkey";

alter table "public"."node_type" add constraint "node_type_pkey" PRIMARY KEY using index "node_type_pkey";

alter table "public"."definition" add constraint "definition_options_check" CHECK (jsonb_matches_schema('{
    "type": "object",
    "properties": {
      "bucket": {"type": "string"},
      "bucketKey": {"type": "string"},
      "buttonText": {"type": "string"},
      "dataKey": {"type": "string"},
      "displayName": {"type": "string"},
      "gridSize": {"type": "number"},
      "height": {"type": "number"},
      "linkTemplate": {"type": "string"},
      "nameKey": {"type": "string"},
      "pathTemplate": {"type": "string"},
      "sizeKeyBytes": {"type": "string"},
      "width": {"type": "number"},
      "optionsTable": {
        "type": "object",
        "patternProperties": {
          "^[a-zA-Z0-9_]+$": {
            "type": "object",
            "properties": {
              "nameKey": {"type": "string"},
              "linkTemplate": {"type": "string"}
            }
          }
        }
      }
    }
  }'::json, options)) not valid;

alter table "public"."definition" validate constraint "definition_options_check";

alter table "public"."node" add constraint "node_data_check" CHECK (jsonb_matches_schema('{
    "type": "object"
  }'::json, data)) not valid;

alter table "public"."node" validate constraint "node_data_check";

alter table "public"."node" add constraint "node_node_type_id_fkey" FOREIGN KEY (node_type_id) REFERENCES node_type(id) not valid;

alter table "public"."node" validate constraint "node_node_type_id_fkey";

alter table "public"."node_type" add constraint "node_type_options_check" CHECK (jsonb_matches_schema('{
    "type": "object",
    "properties": {
      "joinLimits": {
        "patternProperties": {
          "^[a-zA-Z0-9_]+$": {"type": "integer"}
        }
      }
    }
  }'::json, options)) not valid;

alter table "public"."node_type" validate constraint "node_type_options_check";

alter table "public"."node" add constraint "node_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."node" validate constraint "node_user_id_fkey";

create policy "Anyone can read property definitions"
on "public"."definition"
as permissive
for select
to public
using (true);



