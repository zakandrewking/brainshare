import { notFound } from "next/navigation";

import FileTablePage from "./file-table";
import GithubTablePage from "./github-table";

/**
 * This page checks that the file is valid on the server. If so, we'll ship JS
 * to the client to load and parse the file.
 */
export default async function TablePage({
  params,
}: {
  params: { url: string };
}) {
  if (params.url.startsWith("github%2B")) {
    return <GithubTablePage params={params} />;
  }

  if (params.url.startsWith("file%2B")) {
    return <FileTablePage params={params} />;
  }

  return notFound();
}
