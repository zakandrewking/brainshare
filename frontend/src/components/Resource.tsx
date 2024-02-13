import { get as _get, isArray as _isArray, pickBy as _pickBy } from "lodash";
import pluralize from "pluralize";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import useSWR, { useSWRConfig } from "swr";

import { Container } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PostgrestError } from "@supabase/supabase-js";

import displayConfig from "../displayConfig";
import supabase, { useAuth } from "../supabase";
import { get, normalizeEntry, TableName } from "../util/displayConfigUtils";
import { capitalizeFirstLetter } from "../util/stringUtils";
import ConfirmDelete from "./ConfirmDelete";
import History from "./History";
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

export default function Resource({
  table,
  edit = false,
}: {
  table: TableName;
  edit?: boolean;
}) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = edit && !id;

  const { session, role } = useAuth();
  const [submitError, setSubmitError] = useState<PostgrestError | null>();

  const detailProperties = displayConfig.detailProperties[table];
  const joinResources = displayConfig.joinResources[table];
  const joinLimits = get(displayConfig.joinLimits, table, {});

  const { mutate } = useSWRConfig();
  const { data, error } = useSWR(
    id ? `/${table}/${id}` : null,
    async () => {
      let command = supabase.from(table).select(joinResources).eq("id", id);
      if (joinResources.match(new RegExp(`\\b${table}_history\\b`))) {
        command = command.order("time", {
          foreignTable: `${table}_history`,
          ascending: false,
        });
      }
      detailProperties.forEach((entryRaw) => {
        const { property } = normalizeEntry(entryRaw);
        if (joinResources.match(new RegExp(`\\b${property}\\b`))) {
          command = command.limit(get(joinLimits, property, defaultJoinLimit), {
            foreignTable: property,
          });
        }
      });
      const { data, error } = await command.single();
      if (error) throw Error(String(error));
      return data;
    },
    {
      revalidateIfStale: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  // on submit
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit: SubmitHandler<any> = async (newData) => {
    if (isNew) {
      const { data, error } = await supabase
        .from(table)
        .insert(newData)
        .select()
        .single();
      const id = _get(data, ["id"]);
      setSubmitError(error);
      if (error) console.error(error.message);
      if (!id) {
        console.error("Data missing");
      } else {
        const key = `/${table}/${id}`;
        // mutate(key, data); // TODO only mutate changed data && mutate history
        navigate(key);
      }
    } else {
      const updatedData: any = _pickBy(
        newData,
        (value, key: string) => value !== _get(data, [key])
      );
      const { error } = await supabase
        .from(table)
        .update(updatedData)
        .eq("id", id);
      setSubmitError(error);
      if (error) {
        console.error(error.message);
      } else {
        const key = `/${table}/${id}`;
        mutate(key);
        // mutate(key, data); // TODO only mutate changed data && mutate history
        navigate(key);
      }
    }
  };

  const onDelete = async () => {
    if (!id) throw Error("Missing ID. Cannot delete.");
    const { error } = await supabase.from(table).delete().eq("id", id);
    setSubmitError(error);
    if (error) console.error(error.message);
    navigate(`/${table}`);
  };

  const hasHistory = joinResources.match(new RegExp(`\\b${table}_history\\b`));

  if (error) {
    return <Box>Something went wrong. Try again.</Box>;
  }

  return (
    <Container>
      {!edit && (
        <Button
          onClick={() => navigate("edit")}
          sx={{ position: "fixed", right: 7, top: 65 }}
          disabled={!(session && role === "admin")}
        >
          Edit {table}
        </Button>
      )}
      {isNew && (
        <Typography gutterBottom variant="h5">
          New {table}
        </Typography>
      )}
      <Grid
        container
        spacing={2}
        component={edit ? "form" : "div"}
        {...(edit && { onSubmit: handleSubmit(onSubmit) })}
      >
        {detailProperties.map((entryRaw) => {
          const entry = normalizeEntry(entryRaw);
          const property = entry.property;
          const joinLimit = get(joinLimits, property, defaultJoinLimit);
          // The Resource Components will get all the data collected from
          // "property entries" (elements of listProperties,
          // detailProperties, etc.), the propertyDefinitions, the
          // resource data from the API (as `data`), and shared rules
          // (specialCapitalize, etc.).
          const props = displayConfig.propertyDefinitions[property];
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
                <Text
                  displayName={displayName}
                  {...componentArguments}
                  {...(edit && { register, errors })}
                />
              )}
            </Grid>
          );
        })}
        {hasHistory && !edit && (
          <Grid item>
            <History
              data={data}
              table={table}
              specialCapitalize={displayConfig.specialCapitalize}
            />
          </Grid>
        )}
        {edit && (
          <Grid item xs={12}>
            <Stack direction="row" spacing={5}>
              <Button type="submit">Save</Button>
              {!isNew && <ConfirmDelete table={table} onConfirm={onDelete} />}
            </Stack>
          </Grid>
        )}
        {submitError && (
          <Grid item xs={12}>
            <Typography color="warning.main">
              Something went wrong. Try again.
            </Typography>
          </Grid>
        )}
      </Grid>
    </Container>
  );
}
