import { chunk as _chunk, get as _get } from "lodash";
import { Fragment } from "react";
import { UseFormRegister, FieldValues } from "react-hook-form";
import MDEditor from "@uiw/react-md-editor";
import { Link as RouterLink } from "react-router-dom";
import { useStructureUrl } from "../supabase";
// TODO
// import rehypeSanitize from "rehype-sanitize";

import useMediaQuery from "@mui/material/useMediaQuery";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Input from "@mui/material/Input";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";

import { get } from "../util/displayConfigUtils";
import { LinkOut } from "./links";
import {
  capitalizeFirstLetter,
  parseStringTemplate,
} from "../util/stringUtils";
import supabase from "../supabase";

export function Svg({
  data,
  bucket,
  pathTemplate,
  height = 100,
  maxWidth = 400,
}: {
  data: any;
  bucket: string;
  pathTemplate: string;
  height?: number;
  maxWidth?: number;
}) {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const { svgUrl } = useStructureUrl(
    data,
    bucket,
    pathTemplate,
    prefersDarkMode
  );
  return (
    <Fragment>
      {svgUrl && (
        <img
          style={{
            height: `${height}px`,
            ...(maxWidth && {
              maxWidth: `${maxWidth}px`,
            }),
          }}
          alt="structure"
          src={svgUrl}
        />
      )}
    </Fragment>
  );
}

export function Text({
  data,
  propertyKey,
}: {
  data: { [key: string]: any };
  propertyKey: string;
}) {
  const text = _get(data, [propertyKey], "").toString();
  return <Typography sx={{ wordBreak: "break-all" }}>{text}</Typography>;
}

export function AminoAcidSequence({ data }: { data: string }) {
  return (
    <Grid
      container
      spacing={1}
      sx={{
        display: "block",
        // userSelect: "all"
      }}
    >
      {_chunk(data, 5).map((chunk, i) => (
        <Grid
          item
          component="span"
          key={i}
          sx={{ display: "inline-block", fontFamily: "monospace" }}
        >
          {chunk.join("")}
        </Grid>
      ))}
    </Grid>
  );
}

export function TextEdit({
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

export function SourceValueEdit({ data }: { data: any }) {
  return <Grid></Grid>;
}

export function SourceValue({
  data,
  propertyKey,
  formattingRules = null,
  specialCapitalize = null,
}: {
  data: any;
  propertyKey: string;
  formattingRules?: any;
  specialCapitalize?: { [key: string]: string } | null;
}) {
  const dataRow = _get(data, [propertyKey], []);
  return dataRow.length > 0 ? (
    <Grid container spacing={2}>
      {dataRow.map((synonym: any, index: number) => {
        const source = _get(synonym, ["source"], "");
        const value = _get(synonym, ["value"], "");
        const valueLink = _get(formattingRules, [source, "valueLink"]);
        return (
          <Fragment key={index}>
            <Grid item>
              {_get(specialCapitalize, [source], capitalizeFirstLetter(source))}
              {": "}
              {valueLink ? (
                <LinkOut href={parseStringTemplate(valueLink, { value })}>
                  {value}
                </LinkOut>
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

export function Markdown({ data }: { data: any }) {
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

export function InternalLink({
  data,
  propertyKey,
  formattingRules,
  type,
  joinLimit,
}: {
  data: any;
  propertyKey: string;
  formattingRules: { nameKey: string; linkTemplate: string };
  type: string;
  joinLimit: number;
}) {
  const thisData = _get(data, [propertyKey], []);
  return (
    <List>
      {thisData.map((d: any, i: number) => (
        <ListItem key={i}>
          <Link
            component={RouterLink}
            to={parseStringTemplate(formattingRules.linkTemplate, {
              type,
              ...d,
            })}
          >
            {_get(d, [formattingRules.nameKey], "")}
          </Link>
        </ListItem>
      ))}
      {thisData.length > 0 && thisData.length >= joinLimit && (
        <ListItem>
          Showing first {joinLimit} — <Button disabled>Load more</Button>
        </ListItem>
      )}
    </List>
  );
}

export function ReactionParticipants({
  data,
  propertyKey,
}: {
  data: any;
  propertyKey: string;
}) {
  const dataRow = _get(data, [propertyKey]);
  if (!dataRow) return <></>;
  const format = (coeffs: any) => {
    if (coeffs.length === 0) {
      return <></>;
    }
    return coeffs
      .map((x: any) => (
        <Fragment key={x.chemical_id}>
          {Math.abs(x.coefficient) !== 1 ? `${Math.abs(x.coefficient)} ` : ""}
          <Link
            component={RouterLink}
            to={`/chemical/${x.chemical_id}`}
            sx={{ whiteSpace: "nowrap" }}
          >
            {x.chemical.name}
          </Link>
        </Fragment>
      ))
      .reduce((prev: any, curr: any) => [prev, " + ", curr]); // how to join with " + "?
  };
  const left = format(dataRow.filter((x: any) => x.coefficient < 0));
  const right = format(dataRow.filter((x: any) => x.coefficient > 0));
  return (
    <Fragment>
      {left}
      {"  ↔  "}
      {right}
    </Fragment>
  );
}

export function Download({
  data,
  propertyKey,
  buttonText,
  bucketKey,
}: {
  data: any;
  propertyKey: string;
  buttonText: string;
  bucketKey: string;
}) {
  const bucket = _get(data, [bucketKey], "");
  const filename = _get(data, [propertyKey], "");
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filename);
  return (
    <Button href={publicUrl} download>
      {buttonText}
    </Button>
  );
}
