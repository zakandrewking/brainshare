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

import { capitalizeFirstLetter, getProp } from "../util/stringUtils";
import supabase, { useDisplayConfig, useAuth } from "../supabase";
import {
  AminoAcidSequence,
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
  table: string;
  edit?: boolean;
}) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { session } = useAuth();
  const [submitError, setSubmitError] = useState<PostgrestError | null>();

  const displayConfig = useDisplayConfig();
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
  const propertyTypes = _get(displayConfig, ["propertyTypes"], {});

  const { data, error } = useSWR(
    id ? `/${table}/${id}` : null,
    async () => {
      let command = supabase.from(table).select(joinResources).eq("id", id);
      detailProperties.forEach((entry) => {
        const prop = getProp(entry, table);
        if (joinResources.match(new RegExp(`\\b${prop}\\b`))) {
          command = command.limit(_get(joinLimits, [prop], defaultJoinLimit), {
            foreignTable: prop,
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
        {detailProperties.map((entry) => {
          const prop = getProp(entry, table);
          const gridSize = _get(entry, ["gridSize"], 12);
          const type = _get(propertyTypes, [prop, "type"]);
          const formattingRules = _get(propertyTypes, [
            prop,
            "formattingRules",
          ]);
          const propData = _get(data, [prop], []);
          const bucket = _get(propertyTypes, [prop, "bucket"]);
          const pathTemplate = _get(propertyTypes, [prop, "pathTemplate"]);
          const displayName = _get(
            entry,
            ["displayName"],
            _get(
              specialCapitalize,
              [prop],
              capitalizeFirstLetter(
                _includes(joinResources, prop)
                  ? _get(plural, [prop], prop)
                  : prop
              )
            )
          );
          return (
            <Grid item xs={12} sm={gridSize} key={prop}>
              {displayName.length > 0 && (
                <Typography gutterBottom variant="h6">
                  {displayName}
                </Typography>
              )}
              {type === "keyValue" && edit ? (
                <SourceValueEdit data={propData} />
              ) : type === "sourceValue" ? (
                <SourceValue
                  data={propData}
                  formattingRules={formattingRules}
                  specialCapitalize={specialCapitalize}
                />
              ) : type === "markdown" && edit ? (
                <Markdown data={propData} />
              ) : type === "markdown" ? (
                <Markdown data={propData} />
              ) : type === "internalLink" ? (
                <InternalLink
                  data={propData}
                  formattingRules={formattingRules}
                  type={prop}
                  joinLimit={_get(joinLimits, [prop], defaultJoinLimit)}
                />
              ) : type === "reactionParticipants" ? (
                <ReactionParticipants data={propData} />
              ) : type === "svg" ? (
                <Svg
                  object={data}
                  bucket={bucket}
                  pathTemplate={pathTemplate}
                  height={200}
                  maxWidth={400}
                />
              ) : type === "aminoAcidSequence" ? (
                <AminoAcidSequence data={propData} />
              ) : edit ? (
                <TextEdit
                  name={prop}
                  data={propData}
                  register={register}
                ></TextEdit>
              ) : (
                <Text data={propData} />
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
