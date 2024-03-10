// TODO drop lodash
import { get as _get, round as _round } from "lodash";
import { Fragment } from "react";
import { Link as RouterLink } from "react-router-dom";

import Button from "@mui/material/Button";
// TODO
// import rehypeSanitize from "rehype-sanitize";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";

// Need another md editor with a smaller bundle size
// import MDEditor from "@uiw/react-md-editor";

import supabase, { useStructureUrl } from "../supabase";
import {
  capitalizeFirstLetter,
  parseStringTemplate,
} from "../util/stringUtils";
import { LinkOut } from "./links";

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
    <>
      {/* <MDEditor value={value} onChange={setValue}
      previewOptions={{
          rehypePlugins: [[rehypeSanitize]],
        }}
      /> */}
      {/* <MDEditor.Markdown
        source={value}
        style={{
          marginLeft: "15px",
          background: "none",
          whiteSpace: "pre-wrap",
        }}
      /> */}
    </>
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
      .reduce((prev: any, curr: any) => [prev, " + ", curr]);
  };
  const left = format(dataRow.filter((x: any) => x.coefficient < 0));
  const right = format(dataRow.filter((x: any) => x.coefficient > 0));
  return (
    <>
      {left}
      {"  ↔  "}
      {right}
    </>
  );
}

export function Download({
  data,
  propertyKey,
  buttonText,
  bucketKey,
  sizeKeyBytes,
}: {
  data: any;
  propertyKey: string;
  buttonText: string;
  bucketKey: string;
  sizeKeyBytes?: string;
}) {
  const bucket = _get(data, [bucketKey], "");
  const filename = _get(data, [propertyKey], "");
  const size = sizeKeyBytes ? _get(data, [sizeKeyBytes]) : null;
  const toMb = (x: any) => _round(Number(x) / 1e6);
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filename);
  return (
    <Button href={publicUrl} download>
      {buttonText + (size ? ` [${toMb(size)} Mb]` : "")}
    </Button>
  );
}

export function AuthorList({
  data,
  propertyKey,
}: {
  data: any;
  propertyKey: string;
}) {
  return (
    <>
      {_get(data, [propertyKey], [])
        .map((x: any) => `${_get(x, "given", "")} ${_get(x, "family", "")}`)
        .join("; ")}
    </>
  );
}

export function PublicPill({
  data,
  propertyKey,
}: {
  data: any;
  propertyKey: string;
}) {
  return _get(data, [propertyKey]) ? (
    <Chip label="Public" />
  ) : (
    <Chip label="Private" />
  );
}
