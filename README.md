# Brainshare Metabolism

A bair-bones tools for collaborating on metabolic models with https://github.com/zakandrewking/brainshare

# Status

Brainshare Metabolism in early stage development, but feel free to peruse the code and try it out.

# Features

- [ ] Upload a model in COBRA JSON format
- [ ] Collaborative editing powered by https://github.com/zakandrewking/brainshare
- [ ] Download a model
- [ ] Fork a model

# Versioning

There are a few options to consider for versioning:

- duplicate the whole DB
- duplicate model content with a versions table
- implement git-like hash-based versioning with Postgres
- implement a Brainshare back-end with an indelible & chronological database like [Datomic](https://www.datomic.com/)
