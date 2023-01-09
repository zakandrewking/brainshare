import { useState, Fragment } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { get as _get, includes as _includes } from "lodash";

import { useParams, Link as RouterLink } from "react-router-dom";
import {
  useForm,
  SubmitHandler,
  UseFormRegister,
  FieldValues,
} from "react-hook-form";
import { useNavigate } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";
import useSWR from "swr";
// TODO
// import rehypeSanitize from "rehype-sanitize";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Input from "@mui/material/Input";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Typography from "@mui/material/Typography";

import {
  capitalizeFirstLetter,
  parseStringTemplate,
  getProp,
} from "../util/stringUtils";
import supabase, { useDisplayConfig, useAuth } from "../supabaseClient";
import { Svg, Text } from "./propertyComponents";
import { kMaxLength } from "buffer";

function TextEdit({
  name,
  data,
  register,
}: {
  name: string;
  data: any;
  register: UseFormRegister<FieldValues>;
}) {
  return (
    <Input fullWidth {...register(name, { required: true })} />
    // {data ? data.toString() : ""}
  );
}

function SourceValueEdit({ data }: { data: any }) {
  return <Grid></Grid>;
}

function SourceValue({
  data,
  formattingRules = null,
}: {
  data: any;
  formattingRules: any;
}) {
  return data.length > 0 ? (
    <Grid container spacing={2}>
      {data.map((synonym: any, index: number) => {
        const source = _get(synonym, ["source"], "");
        const value = _get(synonym, ["value"], "");
        const sourceDisplay = _get(formattingRules, [source, "sourceDisplay"]);
        const valueLink = _get(formattingRules, [source, "valueLink"]);
        return (
          <Fragment key={index}>
            <Grid item>
              {sourceDisplay || source}
              {": "}
              {valueLink ? (
                <Link
                  href={parseStringTemplate(valueLink, { value })}
                  target="_blank"
                >
                  {value}
                  <OpenInNewIcon fontSize="small" sx={{ marginLeft: "4px" }} />
                </Link>
              ) : (
                value
              )}
            </Grid>
          </Fragment>
        );
      })}
    </Grid>
  ) : (
    <Typography>None</Typography>
  );
}

function Markdown({ data }: { data: any }) {
  const value = data ? data.toString() : "";
  return (
    <Fragment>
      {/* <MDEditor value={value} onChange={setValue}
      previewOptions={{
          rehypePlugins: [[rehypeSanitize]],
        }}
      /> */}
      <MDEditor.Markdown
        source={value}
        style={{
          marginLeft: "15px",
          background: "none",
          whiteSpace: "pre-wrap",
        }}
      />
    </Fragment>
  );
}

function InternalLink({
  data,
  formattingRules,
  type,
  joinLimit,
}: {
  data: any[];
  formattingRules: any;
  type: string;
  joinLimit?: number;
}) {
  return (
    <List>
      {data.map((d: any, i: number) => (
        <ListItem key={i}>
          <Link
            component={RouterLink}
            to={parseStringTemplate(
              _get(formattingRules, ["linkTemplate"], ""),
              {
                type,
                ...d,
              }
            )}
          >
            {_get(d, [_get(formattingRules, ["nameKey"])], "")}
          </Link>
        </ListItem>
      ))}
      {joinLimit && (
        <ListItem>
          Showing first {joinLimit} — <Button disabled>Load more</Button>
        </ListItem>
      )}
    </List>
  );
}

function ReactionParticipants({ data }: { data: any[] }) {
  if (!data) return <Fragment></Fragment>;
  const format = (coeffs: any) =>
    coeffs.map((x: any) => (
      <Fragment key={x.chemical_id}>
        {x.coefficient}{" "}
        <Link component={RouterLink} to={`/chemical/${x.chemical_id}`}>
          {x.chemical.name}
        </Link>
      </Fragment>
    )); // how to join with " + "?
  const left = format(data.filter((x) => x.coefficient < 0));
  const right = format(data.filter((x) => x.coefficient > 0));
  return (
    <Fragment>
      {left}
      {"  <=>  "}
      {right}
    </Fragment>
  );
}

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

  // const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  // const { svgUrl } = useStructureUrl(Number(id) || null, prefersDarkMode);

  const displayConfig = useDisplayConfig();
  // const specialCapitalize = _get(displayConfig, "specialCapitalize", {});
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
    id ? `/${table}/${id}` : "",
    id
      ? async () => {
          let command = supabase.from(table).select(joinResources).eq("id", id);
          for (const foreignTable in joinLimits) {
            command = command.limit(joinLimits[foreignTable], { foreignTable });
          }
          const { data, error } = await command.single();
          if (error) throw Error(String(error));
          return data;
        }
      : () => null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
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
    console.error(error);
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
                  joinLimit={_get(joinLimits, [prop], null)}
                />
              ) : type === "reactionParticipants" ? (
                <ReactionParticipants data={propData} />
              ) : type === "svg" ? (
                <Svg
                  object={data}
                  bucket={bucket}
                  pathTemplate={pathTemplate}
                  height={200}
                />
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
