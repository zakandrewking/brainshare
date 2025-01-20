import { ExternalLinkIcon, MoreHorizontal } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbExternalLink,
  BreadcrumbInternalLink,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Stack } from "@/components/ui/stack";
import WidgetBar from "@/components/widget-bar";

import GithubTable from "./github-table";

interface GithubTablePageProps {
  url: string;
}

export default async function GithubTablePage({ url }: GithubTablePageProps) {
  const prefixedId = decodeURIComponent(url);
  const decodedUrl = prefixedId.replace("github+", "");
  const fileName = prefixedId.split("/").pop() || "Unknown File";

  return (
    <Stack
      direction="col"
      gap={2}
      alignItems="start"
      className="w-full px-6 pt-4"
    >
      <Stack
        direction="row"
        gap={2}
        justifyContent="between"
        className="w-full"
      >
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbInternalLink href="/">Home</BreadcrumbInternalLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>GitHub File</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbExternalLink
                href={decodedUrl}
                className="flex flex-row items-center"
                // TODO move target="_blank" and ExternalLinkIcon to the link component
                target="_blank"
              >
                {fileName}
                <ExternalLinkIcon size={"0.8em"} className="ml-1" />
              </BreadcrumbExternalLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Stack direction="row" gap={2}>
          <Button variant="secondary" disabled>
            <MoreHorizontal className="h-4 w-4 mr-2" />
            More Actions
          </Button>
          <WidgetBar />
        </Stack>
      </Stack>
      <GithubTable url={decodedUrl} prefixedId={prefixedId} />
    </Stack>
  );
}
