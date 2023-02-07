import { get as _get, includes as _includes } from "lodash";
import { useState, Fragment } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { PostgrestError } from "@supabase/supabase-js";
import useSWR from "swr";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

import { Database } from "../database.types";
import displayConfig from "../displayConfig";
import { capitalizeFirstLetter } from "../util/stringUtils";
import { normalizeEntry } from "../util/displayConfigUtils";
import supabase, { useAuth } from "../supabase";
import {
  AminoAcidSequence,
  Download,
  InternalLink,
  Markdown,
  ReactionParticipants,
  SourceValue,
  SourceValueEdit,
  Svg,
  Text,
  TextEdit,
} from "./propertyComponents";

const defaultJoinLimit = 5;

export default function Resource({
  table,
  edit = false,
}: {
  table: keyof Database["public"]["Tables"];
  edit?: boolean;
}) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { session } = useAuth();
  const [submitError, setSubmitError] = useState<PostgrestError | null>();

  const detailProperties: string[] = _get(
    displayConfig,
    ["detailProperties", table],
    {}
  );
  const joinResources: string = _get(
    displayConfig,
    ["joinResources", table],
    "*"
  );
  const joinLimits = _get(displayConfig, ["joinLimits", table], {});
  const plural = _get(displayConfig, ["plural"], {});
  const specialCapitalize = _get(displayConfig, ["specialCapitalize"], {});
  const propertyDefinitions = _get(displayConfig, ["propertyDefinitions"], {});

  const { data, error } = useSWR(
    id ? `/${table}/${id}` : null,
    async () => {
      let command = supabase.from(table).select(joinResources).eq("id", id);
      detailProperties.forEach((entryRaw) => {
        const { property } = normalizeEntry(entryRaw);
        if (joinResources.match(new RegExp(`\\b${property}\\b`))) {
          command = command.limit(
            _get(joinLimits, [property], defaultJoinLimit),
            {
              foreignTable: property,
            }
          );
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
    if (id) {
      // const { error } = await supabase
      //   .from(table)
      //   .update()
      //   .filter("id", "eq", id);
    } else {
      const { data, error } = await supabase
        .from(table)
        .insert(newData)
        .select();
      const id = _get(data, [0, "id"]);
      setSubmitError(error);
      if (error) console.error(error);
      if (!id) console.error("Data missing");
      else {
        // TODO mutate swr for /${table}/{id}
        navigate(`/${table}/${id}`);
      }
    }
  };

  if (error) {
    return <Box>Something went wrong. Try again.</Box>;
  }

  return (
    <Fragment>
      {session && !edit && (
        <Button
          onClick={() => navigate("edit")}
          sx={{ position: "fixed", right: 25 }}
          disabled
        >
          Edit {table}
        </Button>
      )}
      <Grid container>
        {detailProperties.map((entryRaw) => {
          const entry = normalizeEntry(entryRaw);
          const property = entry.property;
          // The property can have a different key in the data payload
          const gridSize = _get(entry, ["gridSize"], 12);
          const type = _get(propertyDefinitions, [property, "type"]);
          // The Resource Components will get all the data collected from
          // "property entries" (elements of listProperties,
          // detailProperties, etc.), the propertyDefinitions, the
          // resource data from the API (as `data`), and shared rules
          // (specialCapitalize, plural, etc.).
          const componentArguments = {
            ..._get(propertyDefinitions, [property], {}),
            ...entry,
            data,
          };
          const displayName = _get(
            entry,
            ["displayName"],
            _get(
              specialCapitalize,
              [property],
              capitalizeFirstLetter(
                _includes(joinResources, property)
                  ? _get(plural, [property], property)
                  : property
              )
            )
          );
          return (
            <Grid item xs={12} sm={gridSize} key={property}>
              {displayName.length > 0 && (
                <Typography gutterBottom variant="h6">
                  {displayName}
                </Typography>
              )}
              {type === "keyValue" && edit ? (
                <SourceValueEdit {...componentArguments} />
              ) : type === "sourceValue" ? (
                <SourceValue {...componentArguments} />
              ) : type === "markdown" && edit ? (
                <Markdown {...componentArguments} />
              ) : type === "markdown" ? (
                <Markdown {...componentArguments} />
              ) : type === "internalLink" ? (
                <InternalLink {...componentArguments} />
              ) : type === "reactionParticipants" ? (
                <ReactionParticipants {...componentArguments} />
              ) : type === "svg" ? (
                <Svg {...componentArguments} />
              ) : type === "aminoAcidSequence" ? (
                <AminoAcidSequence {...componentArguments} />
              ) : type === "download" ? (
                <Download {...componentArguments} />
              ) : edit ? (
                <TextEdit {...componentArguments}></TextEdit>
              ) : (
                <Text {...componentArguments} />
              )}
            </Grid>
          );
        })}
      </Grid>
      {edit && <Button type="submit">Submit</Button>}
      {submitError && <Typography>Something went wrong. Try again.</Typography>}
    </Fragment>
  );
}
