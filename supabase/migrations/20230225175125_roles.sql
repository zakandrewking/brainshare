CREATE TABLE public.user_role (
    user_id UUID REFERENCES auth.users(id),
    role TEXT NOT NULL CHECK (role in ('admin', 'curator')),
    CONSTRAINT user_role_pkey PRIMARY KEY (user_id, role)
);

ALTER TABLE public.user_role ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated user can read their own role" on public.user_role
    FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Admin can manage roles" ON public.user_role USING (
--     EXISTS(
--         SELECT user_id FROM public.user_role WHERE user_id = auth.uid() AND role = 'admin'
--     )
-- );
