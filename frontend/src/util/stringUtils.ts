export function capitalizeFirstLetter(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
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
