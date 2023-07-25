import { isArray as _isArray } from "lodash";
import { Fragment } from "react";
import { Link as RouterLink } from "react-router-dom";

import { Link } from "@mui/material";

import { DefinitionOptionsJson } from "../../databaseExtended.types";

/**
 * This will eventually replace <ReactionParticipants/>
 */
export default function ReactionParticipantsGraph({
  data,
  options,
}: {
  data?: { [key: string]: Object };
  options?: DefinitionOptionsJson;
}) {
  const dataRow = data?.[options?.dataKey ?? ""];
  if (!data || !_isArray(dataRow)) {
    // skeleton
    return <></>;
  }
  const format = (coeffs: any) => {
    if (coeffs.length === 0) {
      return <></>;
    }
    return coeffs
      .map((x: any) => (
        <Fragment key={x.id}>
          {Math.abs(x.coefficient) !== 1 ? `${Math.abs(x.coefficient)} ` : ""}
          <Link
            component={RouterLink}
            to={`/node/chemical/${x.id}`}
            sx={{ whiteSpace: "nowrap" }}
          >
            {x.name}
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
