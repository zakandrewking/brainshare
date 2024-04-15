# Brainshare Osprey

## atlas

```bash
atlas schema inspect -u "postgresql://postgres:postgres@127.0.0.1:54322/postgres?sslmode=disable" --format '{{ sql . }}' > schema.sql
```

```bash
atlas migrate diff create_blog_posts \
  --dir "file://migrations" \
  --to "file://schema.sql" \
  --dev-url "docker://mysql/8/example"
```
