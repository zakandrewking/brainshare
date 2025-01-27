-- Create the table
CREATE TABLE public.notes(
  id serial PRIMARY KEY,
  title text,
  user_id uuid NOT NULL
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated user can manage their notes" ON public.notes
  FOR ALL TO authenticated
    USING (auth.uid() = user_id);

