-- for a synced file, generate a simple representation of the file as a graph.
-- It's designed for fast editing with realtime updates in the frontend. Later,
-- this representation can be exported to the graph database.

create table graph_draft (
    id bigint primary key generated by default as identity not null,
    user_id uuid references public.user(id) on delete cascade,
    synced_file_id bigint not null references synced_file(id) on delete cascade
);
alter table graph_draft enable row level security;
create policy "Authenticated users can manage their graph drafts" on graph_draft
    for all using (auth.uid() = user_id);

create table graph_draft_node (
    id bigint primary key generated by default as identity not null,
    user_id uuid references public.user(id) on delete cascade,
    graph_draft_id bigint not null references graph_draft(id) on delete cascade,
    value text not null
);
alter table graph_draft_node enable row level security;
create policy "Authenticated users can manage their graph draft nodes" on graph_draft_node
    for all using (auth.uid() = user_id);
alter publication supabase_realtime add table graph_draft_node;

create table graph_draft_edge (
    id bigint primary key generated by default as identity not null,
    user_id uuid references public.user(id) on delete cascade,
    graph_draft_id bigint not null references graph_draft(id) on delete cascade,
    source_id bigint references graph_draft_node(id) on delete cascade not null,
    destination_id bigint references graph_draft_node(id) on delete cascade not null,
    value text not null
);
alter table graph_draft_edge enable row level security;
create policy "Authenticated users can manage their graph draft edges" on graph_draft_edge
    for all using (auth.uid() = user_id);
alter publication supabase_realtime add table graph_draft_edge;
