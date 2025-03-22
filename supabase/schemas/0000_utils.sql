-- Create the set_updated_at function
CREATE OR REPLACE FUNCTION public.set_updated_at()
    RETURNS TRIGGER
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN new;
END;
$$
LANGUAGE plpgsql;

