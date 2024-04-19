/**
 * Files page. Files can be used in multiple apps, and RBAC is handled separately.
 */

import { Metadata } from "next";

import FileDrag from "@/components/file-drag";
import { Stack } from "@/components/ui/stack";
import { H3 } from "@/components/ui/typography";

import Uploader from "./uploader";

export const metadata: Metadata = {
  title: "Brainshare - Files",
  description: "Upload and manage files",
};

export default function FileList() {
  return (
    <FileDrag>
      <Stack direction="col" gap={2} alignItems="start">
        <H3>File list</H3>
        <Uploader />
      </Stack>
    </FileDrag>
  );
}
