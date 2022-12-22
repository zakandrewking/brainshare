import { useState, Fragment } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { get as _get } from "lodash";
import { useParams } from "react-router-dom";
import {
  useForm,
  SubmitHandler,
  UseFormRegister,
  FieldValues,
} from "react-hook-form";
import { useNavigate } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";
import useMediaQuery from "@mui/material/useMediaQuery";
import useSWR from "swr";
// TODO
// import rehypeSanitize from "rehype-sanitize";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Input from "@mui/material/Input";
import Link from "@mui/material/Link";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Typography from "@mui/material/Typography";

import { capitalizeFirstLetter } from "../util/stringUtils";
import supabase, {
  useStructureUrl,
  useDisplayConfig,
  useAuth,
} from "../supabaseClient";

/// Evaluate a template string at runtime
function parseStringTemplate(
  template: string,
  obj: { [index: string]: string }
): string {
  let parts = template.split(/\$\{(?!\d)[\wæøåÆØÅ]*\}/);
  let args = template.match(/[^{}]+(?=})/g) || [];
  let parameters = args.map(
    (argument) =>
      obj[argument] || (obj[argument] === undefined ? "" : obj[argument])
  );
  return String.raw({ raw: parts }, ...parameters);
}

function Text({ data }: { data: any }) {
  return (
    <Typography sx={{ wordBreak: "break-all" }}>
      {data ? data.toString() : ""}
    </Typography>
  );
}

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

function KeyValueEdit({ data }: { data: any }) {
  return <Grid></Grid>;
}

function KeyValue({
  data,
  valueUrl = null,
}: {
  data: any;
  valueUrl?: string | null;
}) {
  return data.length > 0 ? (
    <Grid container spacing={2}>
      {data.map((synonym: any) => {
        const source = _get(synonym, ["source"], "");
        const value = _get(synonym, ["value"], "");
        return (
          <Fragment key={source}>
            <Grid item xs={12} sm="auto">
              Source: {source === "chebi_id" ? "ChEBI" : source}
            </Grid>
            <Grid item xs={12} sm>
              Value:{" "}
              {valueUrl ? (
                <Link
                  href={parseStringTemplate(valueUrl, { value })}
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

  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const { svgUrl } = useStructureUrl(Number(id) || null, prefersDarkMode);

  const displayConfig = useDisplayConfig();
  // const specialCapitalize = _get(displayConfig, "specialCapitalize", {});
  const detailProperties: string[] = _get(
    displayConfig,
    ["detailProperties", table],
    {}
  );
  const joinResources: string[] = _get(
    displayConfig,
    ["joinResources", table],
    []
  );
  const propertyTypes = _get(displayConfig, ["propertyTypes"], {});
  const joinSelectString = makeJoinSelectString(joinResources);
  function makeJoinSelectString(joinResources) {
    joinResources.length === 0
      ? ""
      : ", " + joinResources.map((x) => x + "(*)").join(",");
  }

  const { data, error } = useSWR(
    id ? `/${table}/${id}` : "",
    id
      ? async () => {
          const { data, error } = await supabase
            .from(table)
            .select("*" + joinSelectString)
            .eq("id", id)
            .single();
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
        >
          Edit {table}
        </Button>
      )}
      {detailProperties.map((prop) => {
        const type = _get(propertyTypes, [prop, "type"]);
        const valueLink = _get(propertyTypes, [prop, "value_link"]);
        const propData = _get(data, [prop], "");
        return (
          <Fragment key={prop}>
            <Typography gutterBottom variant="h6">
              {capitalizeFirstLetter(prop)}
            </Typography>
            {type === "key_value" && edit ? (
              <KeyValueEdit data={propData} />
            ) : type === "key_value" ? (
              <KeyValue data={propData} valueUrl={valueLink} />
            ) : type === "markdown" && edit ? (
              <Markdown data={propData} />
            ) : type === "markdown" ? (
              <Markdown data={propData} />
            ) : edit ? (
              <TextEdit
                name={prop}
                data={propData}
                register={register}
              ></TextEdit>
            ) : (
              <Text data={propData} />
            )}
          </Fragment>
        );
      })}
      {edit && <Button type="submit">Submit</Button>}
      {submitError && <Typography>Something went wrong. Try again.</Typography>}
    </Fragment>
  );
}
