# Brainshare

Brainshare is a place to create and share scientific knowledge. It's an overly
amitious side project, and a place to try out lots of new technologies
(Supabase, Fly.io, LangChain, and lots more). The goal right now is to:

1. Sync files from any Google Drive folder.
1. Synced files are analyzed by Brainshare AI agents, and the results are stored
   in a private project database.
1. Files are mapped to a public knowledge graph that includes as much systems
   biology knowledge as possible (biochemicals, reactions, species, genomes,
   regulatory elements, etc)
1. Search private and public data.
1. Create custom knowledge graphs for your projects, which are also available
   via API. Your knowledge graphs can include custom content or extend the
   public graph.
1. Use the REST and GraphQL APIs to integrate data & knowledge graphs into
   external analyses (e.g. jupyter notebooks)
1. Chat with your data (a la ChatGPT)
1. Graph visualizations
1. Make all of this available as a data source for downstream applications, e.g.
   pipe knowlege graphs into an external data warehouse.

## Status

Brainshare is in early stage development; roadmap:

- [x] Authentication
- [x] Sync files from Google Drive
- [x] Basic chat interface
- [x] Queue and workers for processing files
- [x] REST API and API Gateway
- [x] Public graph that includes biochemicals, reactions, and species
- [x] Public graph search
- [x] PDF analysis - map to public graph
- [ ] AI agent that can generate a knowledge graph
- [ ] GraphQL API
- [ ] Private data search
- [ ] Intelligent chat
- [ ] Public graph for genomes, genes, proteins, etc.
- [ ] Analysis of other file types
- [ ] Collabration
- [ ] SDK for accessing data in your own apps/scripts
- [ ] visualizations
- [ ] data sync
- [ ] hardening
  - how to do deletions: soft delete, cascading deletes etc.

There is a live deployment at https://brainshare.io

## Run locally

1. `supabase start` and `supabase status`

1. Make a copy of `frontend/.env.example` called `frontend/.env`. Copy the
   Supabase Anon Key and API URL from supabase into that file.

1. `cd backend && poetry install`

1. Make a copy of `backend/.env.example` called `backend/.env.local`. Copy the
   Supabase Anon Key, and API URL from supabase into that file.

1. Run tasks in tasks.json

1. Run the full stack in launch.json

## Troubleshooting

## must be member of role "supabase_admin" (SQLSTATE 42501) while executing migration

https://github.com/supabase/supabase/discussions/6326#discussioncomment-2604815
