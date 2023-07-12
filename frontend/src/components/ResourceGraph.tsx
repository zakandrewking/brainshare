import { get as _get, isArray as _isArray } from "lodash";
import pluralize from "pluralize";
import { useParams } from "react-router-dom";
import useSWR from "swr";

import { Container } from "@mui/material";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

import displayConfig from "../displayConfigGraph";
import supabase from "../supabase";
import { get, normalizeEntry } from "../util/displayConfigUtils";
import { capitalizeFirstLetter } from "../util/stringUtils";
import {
  AuthorList,
  Download,
  Markdown,
  PublicPill,
  ReactionParticipants,
  SourceValue,
  Svg,
} from "./propertyComponents";
import AminoAcidSequence from "./propertyComponents/AminoAcidSequence";
import InternalLink from "./propertyComponents/InternalLink";
import Text from "./propertyComponents/Text";

const defaultJoinLimit = 5;

function Skeleton() {
  return <></>;
}

export default function ResourceGraph({ edit = false }: { edit?: boolean }) {
  const { nodeType, id } = useParams();

  const detailProperties = _get(
    displayConfig.detailProperties,
    [nodeType ?? ""],
    []
  );
  const joinLimits = _get(displayConfig.joinLimits, [nodeType ?? ""], {});
  const selectString = _get(displayConfig.selectString, [nodeType ?? ""], "id");
  const { data, error } = useSWR(
    nodeType && id ? `/graph/${nodeType}/${id}` : null,
    async () => {
      const { data, error } = await supabase
        .from("node")
        .select(selectString)
        .eq("id", id)
        .eq("type", nodeType)
        .single();
      if (error) throw Error(String(error));
      return data;
    },
    {
      revalidateIfStale: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  if (data === undefined || nodeType === undefined || id === undefined) {
    return <Skeleton />;
  }

  if (error) {
    return <Box>Something went wrong. Try again.</Box>;
  }

  return (
    <Container>
      <Grid container spacing={2} component={edit ? "form" : "div"}>
        {detailProperties.map((entryRaw: any) => {
          const entry = normalizeEntry(entryRaw);
          const property = entry.property;
          const joinLimit = get(joinLimits, property, defaultJoinLimit);
          // The Resource Components will get all the data collected from
          // "property entries" (elements of listProperties,
          // detailProperties, etc.), the propertyDefinitions, the
          // resource data from the API (as `data`), and shared rules
          // (specialCapitalize, etc.).
          const props = _get(displayConfig.propertyDefinitions, [property], {});
          const componentArguments = {
            ...props,
            ...entry,
            joinLimit,
            data: data as any,
          };
          const displayName = get(
            entry,
            "displayName",
            get(
              displayConfig.specialCapitalize,
              property,
              capitalizeFirstLetter(
                _isArray(_get(data, [property]))
                  ? pluralize(property)
                  : property
              )
            )
          );
          return (
            <Grid item xs={12} sm={get(entry, "gridSize", 12)} key={property}>
              {displayName.length > 0 && componentArguments.type !== "text" && (
                <Typography gutterBottom variant="h6">
                  {displayName}
                </Typography>
              )}
              {componentArguments.type === "sourceValue" ? (
                <SourceValue {...componentArguments} />
              ) : componentArguments.type === "markdown" ? (
                <Markdown {...componentArguments} />
              ) : componentArguments.type === "internalLink" ? (
                <InternalLink {...componentArguments} />
              ) : componentArguments.type === "reactionParticipants" ? (
                <ReactionParticipants {...componentArguments} />
              ) : componentArguments.type === "svg" ? (
                <Svg {...componentArguments} />
              ) : componentArguments.type === "aminoAcidSequence" ? (
                <AminoAcidSequence {...componentArguments} />
              ) : componentArguments.type === "download" ? (
                <Download {...componentArguments} />
              ) : componentArguments.type === "authorList" ? (
                <AuthorList {...componentArguments} />
              ) : componentArguments.type === "publicPill" ? (
                <PublicPill {...componentArguments} />
              ) : (
                <Text displayName={displayName} {...componentArguments} />
              )}
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
}
