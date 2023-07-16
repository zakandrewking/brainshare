import { find as _find, uniq as _uniq } from "lodash";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import useSWRImmutable from "swr/immutable";

import { Container } from "@mui/material";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

import { DefinitionOptionsJson } from "../databaseExtended.types";
import supabase from "../supabase";
import PublicPillGraph from "./propertyComponents/PublicPillGraph";
import SvgGraph from "./propertyComponents/SvgGraph";
import TextGraph from "./propertyComponents/TextGraph";
import AuthorListGraph from "./propertyComponents/AuthorListGraph";

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

  // Get the list of properties that we need to query. Don't query for the SVG
  // because it's in object storage.
  let selectString = "id";
  const dataKeys = _uniq(
    detailDefinitions
      ?.map((definition) => definition?.options?.dataKey)
      .filter((dataKey) => dataKey !== undefined)
  );
  if (dataKeys.length > 0) {
    selectString +=
      "," + dataKeys.map((dataKey) => `data->${dataKey}`).join(",");
  }

  const { data: node, error } = useSWR(
    shouldFetch ? `/graph/${nodeTypeId}/${nodeId}` : null,
    async () => {
      const { data, error } = await supabase
        .from("node")
        .select(selectString)
        .eq("id", nodeId)
        .eq("node_type_id", nodeTypeId)
        .single();
      if (error) throw Error(String(error));
      // Cast the types because supabase gets caught by the dynamic select string.
      // We flattened the query, so the data is flat object.
      return data as unknown as { [key: string]: any };
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
