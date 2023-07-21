import { find as _find } from "lodash";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import useSWRImmutable from "swr/immutable";

import { Container } from "@mui/material";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

import { DefinitionOptionsJson } from "../databaseExtended.types";
import supabase from "../supabase";
import AuthorListGraph from "./propertyComponents/AuthorListGraph";
import InternalLinkGraph from "./propertyComponents/InternalLinkGraph";
import PublicPillGraph from "./propertyComponents/PublicPillGraph";
import SourceValueGraph from "./propertyComponents/SourceValueGraph";
import SvgGraph from "./propertyComponents/SvgGraph";
import TextGraph from "./propertyComponents/TextGraph";

export default function ResourceGraph({ edit = false }: { edit?: boolean }) {
  const { nodeTypeId, nodeId } = useParams();

  // Get the node type details
  const { data: nodeTypes } = useSWRImmutable("/node_type", async () => {
    const { data, error } = await supabase.from("node_type").select("*");
    if (error) throw Error(error.message);
    return data;
  });
  const nodeType = _find(nodeTypes, { id: nodeTypeId });

  // Get the property definitions
  const { data: definitions } = useSWRImmutable("/definition", async () => {
    const { data, error } = await supabase.from("definition").select("*");
    if (error) throw Error(error.message);
    return data;
  });

  // map the definitions
  const detailDefinitions =
    definitions &&
    nodeType?.detail_definition_ids
      .map((id) => _find(definitions, { id }))
      .map((definition) => {
        const options = definition?.options;
        return {
          ...definition,
          options: options ? (options as DefinitionOptionsJson) : undefined,
        };
      });

  // Can only fetch if the node type & definitions are loaded
  // TODO make a useDefinitions hook
  const shouldFetch = detailDefinitions !== undefined;

  const { data: nodeAll, error } = useSWR(
    shouldFetch ? `/graph/${nodeTypeId}/${nodeId}` : null,
    async () => {
      const { data, error } = await supabase
        .from("node")
        .select(
          "*, edge!edge_source_id_fkey(*, node!edge_destination_id_fkey(*))"
        )
        .eq("id", nodeId)
        .eq("node_type_id", nodeTypeId)
        .single();
      if (error) throw Error(String(error));
      // supabasejs doesn't narrow types for relationships, so we cast them
      return data as {
        id: number;
        node_type_id: string;
        hash: string;
        data: any;
        edge: {
          node: { id: number; node_type_id: string; hash: string; data: any };
        }[];
      };
    },
    {
      revalidateIfStale: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  if (error) {
    return <Box>Something went wrong. Try again.</Box>;
  }

  // flatten the edges
  const node: { [key: string]: any } | undefined = nodeAll
    ? {
        id: nodeAll.id,
        nodeTypeId: nodeAll.node_type_id,
        hash: nodeAll.hash,
        ...nodeAll.data,
      }
    : undefined;
  if (nodeAll && node) {
    nodeAll.edge.forEach((edge) => {
      const nodeTypeId = edge.node.node_type_id;
      const newNode = { id: edge.node.id, ...edge.node.data };
      if (!node[nodeTypeId]) {
        node[nodeTypeId] = [newNode];
      } else {
        node[nodeTypeId].push(newNode);
      }
    });
  }

  return (
    <Container>
      <Grid container spacing={2} component={edit ? "form" : "div"}>
        {detailDefinitions?.map((definition, i) => {
          const componentArguments = {
            data: node,
            options: {
              ...definition?.options,
            },
          };
          const displayName = definition?.options?.displayName;
          const gridSize = definition?.options?.gridSize;
          return (
            <Grid item xs={12} sm={gridSize || 12} key={i}>
              {displayName !== undefined && (
                <Typography gutterBottom variant="h6">
                  {displayName}
                </Typography>
              )}
              {definition.component_id === "svg" ? (
                <SvgGraph {...componentArguments} />
              ) : definition.component_id === "internalLink" ? (
                <InternalLinkGraph {...componentArguments} />
              ) : definition.component_id === "sourceValue" ? (
                <SourceValueGraph {...componentArguments} />
              ) : definition.component_id === "authorList" ? (
                <AuthorListGraph {...componentArguments} />
              ) : definition.component_id === "publicPill" ? (
                <PublicPillGraph {...componentArguments} />
              ) : (
                <TextGraph {...componentArguments} />
              )}
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
}
