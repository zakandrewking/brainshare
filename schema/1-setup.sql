-- Some tables already exist for you:

-- CREATE TABLE auth.users (
-- id uuid NOT NULL UNIQUE,
-- ...
-- );

-- You can take control of these by running `brain eject`

CREATE TABLE model (
    id uuid NOT NULL UNIQUE,
    string name,
)

CREATE TABLE universal_reaction (
    id uuid NOT NULL UNIQUE,
    string name,
)

CREATE TABLE universal_pseudoisomer (
    id uuid NOT NULL UNIQUE,
    string name,
)