import useMediaQuery from "@mui/material/useMediaQuery";
import { chunk as _chunk } from "lodash";
import { UseFormRegister, FieldValues } from "react-hook-form";
import MDEditor from "@uiw/react-md-editor";
import { Link as RouterLink } from "react-router-dom";
// TODO
// import rehypeSanitize from "rehype-sanitize";
import { get as _get } from "lodash";

import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Input from "@mui/material/Input";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import { useStructureUrl } from "../supabase";
import { Fragment } from "react";
import {
  capitalizeFirstLetter,
  parseStringTemplate,
} from "../util/stringUtils";

export function Svg({
  object,
  bucket,
  pathTemplate,
  height,
  maxWidth,
}: {
  object: any;
  bucket: string;
  pathTemplate: string;
  height: number;
  maxWidth?: number;
}) {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const { svgUrl } = useStructureUrl(
    object,
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
  selectable = true,
}: {
  data: any;
  selectable?: boolean;
}) {
  return (
    <Typography
      sx={{ wordBreak: "break-all", ...(selectable && { userSelect: "all" }) }}
    >
      {data ? data.toString() : ""}
    </Typography>
  );
}

export function AminoAcidSequence({ data }: { data: string }) {
  return (
    <Grid container spacing={1} sx={{ display: "block", userSelect: "all" }}>
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
  formattingRules = null,
  specialCapitalize = null,
}: {
  data: any;
  formattingRules: any;
  specialCapitalize: any;
}) {
  return data.length > 0 ? (
    <Grid container spacing={2}>
      {data.map((synonym: any, index: number) => {
        const source = _get(synonym, ["source"], "");
        const value = _get(synonym, ["value"], "");
        const valueLink = _get(formattingRules, [source, "valueLink"]);
        return (
          <Fragment key={index}>
            <Grid item>
              {_get(specialCapitalize, [source], capitalizeFirstLetter(source))}
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
      {joinLimit && data.length > 0 && (
        <ListItem>
          Showing first {joinLimit} — <Button disabled>Load more</Button>
        </ListItem>
      )}
    </List>
  );
}

export function ReactionParticipants({ data }: { data: any[] }) {
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
