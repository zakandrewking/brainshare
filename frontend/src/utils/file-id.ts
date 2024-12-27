/**
 * Generate a file ID for either uploaded files or GitHub files
 */
export function generateFileId(
  params:
    | {
        type: "uploaded";
        id: string;
      }
    | {
        type: "github";
        url: string;
      }
) {
  if (params.type === "uploaded") {
    return params.id;
  }

  // For GitHub files, create a deterministic ID
  return `github+${params.url}`;
}
