import { get as _get, isArray as _isArray } from "lodash";
import { Link as RouterLink } from "react-router-dom";

import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";

import { parseStringTemplate } from "../../util/stringUtils";

export default function InternalLink({
  data,
  propertyKey,
  formattingRules,
  joinLimit,
}: {
  data: any;
  propertyKey: string;
  formattingRules: { nameKey: string; linkTemplate: string };
  joinLimit: number;
}) {
  const thisDataRaw = _get(data, [propertyKey], []);
  // support one-one, many-one, many-many
  const thisData = _isArray(thisDataRaw) ? thisDataRaw : [thisDataRaw];
  if (thisData.length === 0) {
    return <>None</>;
  }
  return (
    <List>
      {thisData.map((d: any, i: number) => (
        <ListItem key={i}>
          <Link
            component={RouterLink}
            to={parseStringTemplate(formattingRules.linkTemplate, {
              type: propertyKey,
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
