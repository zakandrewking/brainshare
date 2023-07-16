import { isArray as _isArray } from "lodash";

import { DefinitionOptionsJson } from "../../databaseExtended.types";

/**
 * will replace AuthorList
 */
export default function AuthorListGraph({
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
  if (!_isArray(list)) {
    console.warn(`AuthorListGraph: data.${options?.dataKey} is not an array`);
    return <></>;
  }
  return (
    <>
      {list.map((x: any) => `${x?.given ?? ""} ${x?.family ?? ""}`).join("; ")}
    </>
  );
}
