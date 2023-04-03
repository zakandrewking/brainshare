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

/**
 * https://stackoverflow.com/questions/7033639/split-large-string-in-n-size-chunks-in-javascript
 */
export function chunkSubstring(str: string, size: number): string[] {
  const numChunks = Math.ceil(str.length / size);
  const chunks = new Array<string>(numChunks);

  for (let i = 0; i < numChunks; i += 1) {
    chunks[i] = str.slice(size * i, size * (i + 1));
  }

  return chunks;
}

/**
 * https://stackoverflow.com/a/18650828
 */
export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = [
    "Bytes",
    "KiB",
    "MiB",
    "GiB",
    "TiB",
    "PiB",
    "EiB",
    "ZiB",
    "YiB",
  ];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
