CREATE TABLE IF NOT EXISTS public.chemical
(
    id bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    created_at timestamp with time zone DEFAULT now(),
    inchi VARCHAR(10000) NOT NULL,
    name text,
    CONSTRAINT chemical_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.chemical
    OWNER to supabase_admin;

ALTER TABLE IF EXISTS public.chemical
    ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.chemical TO anon;

GRANT ALL ON TABLE public.chemical TO postgres;

GRANT ALL ON TABLE public.chemical TO supabase_admin;

GRANT ALL ON TABLE public.chemical TO authenticated;

GRANT ALL ON TABLE public.chemical TO service_role;