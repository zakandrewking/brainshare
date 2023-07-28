CREATE INDEX edge_destination_id_idx ON public.edge USING btree (destination_id);

CREATE INDEX edge_history_edge_id_idx ON public.edge_history USING btree (edge_id);

CREATE INDEX edge_source_id_idx ON public.edge USING btree (source_id);

CREATE INDEX node_history_node_id_idx ON public.node_history USING btree (node_id);

CREATE INDEX node_node_type_id_idx ON public.node USING btree (node_type_id);


