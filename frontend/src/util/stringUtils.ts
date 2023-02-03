import { get as _get, isString as _isString } from "lodash";

export function capitalizeFirstLetter(s: string) {
  return s
    .split("_")
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(" ");
}

/// Evaluate a template string at runtime
export function parseStringTemplate(
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

export function getProp(entry: any, table: string): string {
  const prop = _isString(entry) ? entry : _get(entry, ["property"]);
  if (!prop)
    throw Error(`Missing "property" key for "${table}" in "listProperties"`);
  return prop;
}
