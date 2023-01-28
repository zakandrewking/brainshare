-- for now, just md5(ncbi tax id)
ALTER TABLE public.species ADD COLUMN hash TEXT UNIQUE;
