import { notFound } from "next/navigation";

import FileTablePage from "./file-page";
import GithubTablePage from "./github-page";

/**
 * This page checks that the file is valid on the server. If so, we'll ship JS
 * to the client to load and parse the file.
 */
export default async function TablePage({
  params,
}: {
  params: Promise<{ url: string }>;
}) {
  const { url } = await params;
  if (url.startsWith("github%2B")) {
    return <GithubTablePage url={url} />;
  }

  if (url.startsWith("file%2B")) {
    return <FileTablePage url={url} />;
  }

  return notFound();
}
