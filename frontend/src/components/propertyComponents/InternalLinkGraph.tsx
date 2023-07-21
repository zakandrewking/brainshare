import { get as _get, isArray as _isArray } from "lodash";
import { Link as RouterLink } from "react-router-dom";

import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";

import { parseStringTemplate } from "../../util/stringUtils";
import { DefinitionOptionsJson } from "../../databaseExtended.types";

const joinLimit = 5;

export default function InternalLinkGraph({
  data,
  options,
}: {
  data?: { [key: string]: Object };
  options?: DefinitionOptionsJson;
}): JSX.Element {
  if (!data) {
    // skeleton
    return <></>;
  }
  const list = data[options?.dataKey ?? ""];
  const linkTemplate = options?.linkTemplate;
  const nameTemplate = options?.nameTemplate;
  if (!_isArray(list)) {
    console.warn(`InternalLinkGraph: data.${options?.dataKey} is not an array`);
    return <></>;
  }
  if (list.length === 0) {
    return <>None</>;
  }
  return (
    <List>
      {list.map((d: any, i: number) => (
        <ListItem key={i}>
          <Link
            component={RouterLink}
            to={linkTemplate ? parseStringTemplate(linkTemplate, d) : ""}
          >
            {nameTemplate ? parseStringTemplate(nameTemplate, d) : d}
          </Link>
        </ListItem>
      ))}
      {list.length > 0 && list.length >= joinLimit && (
        <ListItem>
          Showing first {joinLimit} — <Button disabled>Load more</Button>
        </ListItem>
      )}
    </List>
  );
}
