CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA "extensions";

CREATE TABLE public.article (
    id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    name TEXT NOT NULL
);

CREATE TABLE public.article_content (
    article_id BIGINT NOT NULL REFERENCES public.article(id),
    chunk INT,
    embedding vector(1536),
    CONSTRAINT article_content_pkey PRIMARY KEY (chunk, article_id)
);