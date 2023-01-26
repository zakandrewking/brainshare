-- for now, just md5(ncbi tax id)
ALTER TABLE public.species ADD COLUMN hash TEXT UNIQUE;

-- TODO make sure hashes are indexed
-- TODO make sure everything we use in search() is indexed

-- next time:
-- ALTER TABLE public.species ALTER COLUMN hash ADD NOT NULL;
