# Brainshare Osprey

## example files

- https://github.com/pnnl/mlprotein/blob/master/amino_list.csv
- https://github.com/sher1203/Protein-Folding/blob/main/protein_interactions.csv
- https://github.com/tashkar/Umod-proteomics-data/blob/main/2021_10_266_Serum_IP_Trypsin%2BChymo-2/DB%20search%20psm.csv

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
