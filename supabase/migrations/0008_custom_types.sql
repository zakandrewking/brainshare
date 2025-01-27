-- Custom types are used to define the type of a column in a table.
-- decimal: a floating point number
-- integer: an integer number
-- enum: a set of values, specified in redis
CREATE TABLE custom_type(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    kind text NOT NULL CHECK (kind IN ('decimal', 'integer', 'enum', 'date', 'time')),
    name text NOT NULL,
    description text NOT NULL,
    rules text[] NOT NULL DEFAULT '{}',
    examples text[] NOT NULL DEFAULT '{}',
    not_examples text[] NOT NULL DEFAULT '{}',
    user_id uuid NOT NULL,
    values_key text GENERATED ALWAYS AS ( CASE WHEN kind = 'enum' THEN
        'br-values-' || id
    ELSE
        NULL
    END) STORED,
    min_value numeric NOT NULL DEFAULT '-Infinity',
    max_value numeric NOT NULL DEFAULT 'Infinity',
    log_scale boolean NOT NULL DEFAULT FALSE,
    public boolean NOT NULL DEFAULT FALSE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (name, user_id)
);

ALTER TABLE custom_type ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own custom types" ON custom_type
    FOR ALL TO authenticated
        USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read public custom types" ON custom_type
    FOR SELECT
        USING (public = TRUE);

