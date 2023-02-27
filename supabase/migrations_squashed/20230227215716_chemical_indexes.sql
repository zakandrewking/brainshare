alter table "public"."chemical" drop column "display_options";

CREATE INDEX chemical_inchi_key_idx ON public.chemical USING btree (inchi_key);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.node_setup(table_name text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    EXECUTE format($rls$
        ALTER TABLE public.%1$s ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Anyone can read %1$ss" ON public.%1$s FOR SELECT USING (true);
        CREATE POLICY "Authenticated user can manage %1$ss" ON public.%1$s
            TO authenticated USING (true);
    $rls$, table_name);
END;
$function$
;


