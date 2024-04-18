/**
 * Files page. Files can be used in multiple apps, and RBAC is handled separately.
 */

import FileDrag from "@/components/file-drag";

export default function FileList() {
  return (
    <>
      <FileDrag />
      File list
    </>
  );
}
