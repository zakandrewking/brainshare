CREATE SCHEMA IF NOT EXISTS api;
GRANT USAGE ON SCHEMA api TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA api GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA api GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA api GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;


CREATE TABLE IF NOT EXISTS api.api_key (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    -- only one key at a time for now
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    key VARCHAR(80) UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'deleting', 'deleted'))
);
ALTER TABLE IF EXISTS api.api_key ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can manage their keys" ON api.api_key
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
