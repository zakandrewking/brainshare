-- Projects

-- Projects are owned by users and referenced by graphs, files, and synced
-- folders

create or replace function generate_schema_name(project_id uuid) returns text as $$
begin
  return 'data_' || replace(project_id::text, '-', '_');
end;
$$ language plpgsql immutable;

create table project (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    schema_name text not null generated always as (generate_schema_name(id)) stored,
    created_at timestamptz not null default (now() at time zone 'utc'),
    user_id uuid not null references public.user(id) on delete cascade,
    -- TODO implement organizations
    -- organization_id bigint references organization(id) on delete cascade,
    unique (user_id, name)
);
alter table project enable row level security;
create policy "Authenticated user can manage their projects" on project
  for all using (auth.uid() = user_id);

create or replace function public.generate_username(num_digits int default 0) returns text as $$
declare
  adjectives text[] := array['Algorithm', 'Arcadian', 'Astrophysical', 'Augmented', 'Chimeric', 'Cosmogonic', 'Cosmological', 'Chaos', 'Cryptographic', 'Cybernetic', 'Cyberspace', 'Ecliptic', 'Elysian', 'Enigmatic', 'Esoteric', 'Ethereal', 'Evolutionary', 'Exoplanetary', 'Extradimensional', 'Fearless', 'Genetic', 'Genomic', 'Hyperspace', 'Infinite', 'Interstellar', 'Ionic', 'Lunar', 'Magnetic', 'Manifold', 'Molecular', 'Mythic', 'Neuro', 'Paleological', 'Parallel', 'Photon', 'Plasma', 'Quantal', 'Quantum', 'Radiant', 'Scientific', 'Solar', 'Sonic', 'Spectral', 'Star', 'Subatomic', 'Symbiotic', 'Synthetic', 'Telekenetic', 'Time', 'Transcendental', 'Virtual'];
  nouns text[] := array['Aetherist', 'Alchemist', 'Architect', 'Archaeologist', 'Artisan', 'Astronomer', 'Biochemist', 'Biologist', 'Biomancer', 'Biophysicist', 'Botanist', 'Chemist', 'Chronomancer', 'Chronosage', 'Collector', 'Crafter', 'Cryptologist', 'Cybernetician', 'Cyborg', 'Developer', 'Diviner', 'Dreamweaver', 'Ecologist', 'Eidolon', 'Elementalist', 'Engineer', 'Futurist', 'Geneticist', 'Geologist', 'Harbinger', 'Holographer', 'Horologist', 'Illuminatus', 'Imaginarian', 'Inventor', 'Journeyer', 'Kaleidoscopist', 'Kinesis', 'Lorekeeper', 'LucidDreamer', 'Machinist', 'Maker', 'Mathematician', 'Mechanist', 'Meteorologist', 'Mystagogue', 'Navigator', 'Neuromancer', 'Oracle', 'Physicist', 'Psion', 'Punk', 'Quasar', 'Roboticist', 'Runecaster', 'Sage', 'Sculptor', 'Seer', 'Shifter', 'Specter', 'Synthesist', 'Systematician', 'Technologist', 'Theorist', 'Timekeeper', 'Umbramancer', 'Virtuoso', 'Visionary', 'Wizard', 'Wright', 'Yggdrasil', 'Zoologist'];
  random_index_adjectives int := floor(random() * array_length(adjectives, 1)) + 1;
  random_index_nouns int := floor(random() * array_length(nouns, 1)) + 1;
  random_numbers text := '';
begin
  for i in 1..num_digits loop
    random_numbers := random_numbers || floor(random() * 10)::text;
  end loop;
  return adjectives[random_index_adjectives] || nouns[random_index_nouns] || random_numbers;
end;
$$ language plpgsql;

-- Set up new users with default project & profile
create or replace function public.handle_new_user() returns trigger
  security definer as $$
declare
  num_digits int := 0;
  generated_username text;
begin
  loop
    generated_username := public.generate_username(num_digits);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.user WHERE username = generated_username) OR num_digits >= 10;
    num_digits := num_digits + 1;
  end loop;
  insert into public.user (id, username) values (new.id, generated_username);
  insert into public.project (name, user_id) values ('default',  new.id);
  return new;
end;
$$ language plpgsql;

-- Trigger to execute the function after a new user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
