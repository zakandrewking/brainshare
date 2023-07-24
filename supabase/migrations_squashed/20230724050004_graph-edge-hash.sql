alter table "public"."edge" add column "hash" text not null;

alter table "public"."edge" add column "relationship" text not null;

CREATE UNIQUE INDEX edge_hash_key ON public.edge USING btree (hash);

alter table "public"."edge" add constraint "edge_hash_key" UNIQUE using index "edge_hash_key";


