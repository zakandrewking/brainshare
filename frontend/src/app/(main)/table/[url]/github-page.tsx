import { ExternalLinkIcon } from "lucide-react";

import ControlPanel from "@/components/control-panel/control-panel";
import {
  Breadcrumb,
  BreadcrumbExternalLink,
  BreadcrumbInternalLink,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Stack } from "@/components/ui/stack";

import GithubTable from "./github-table";

interface GithubTablePageProps {
  url: string;
}

export default async function GithubTablePage({ url }: GithubTablePageProps) {
  const prefixedId = decodeURIComponent(url);
  const decodedUrl = prefixedId.replace("github+", "");
  const fileName = prefixedId.split("/").pop() || "Unknown File";

  const handleAutoIdentify = () => {
    console.log("Auto-identifying columns");
  };

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
        <ControlPanel />
      </Stack>
      <GithubTable url={decodedUrl} prefixedId={prefixedId} />
    </Stack>
  );
}
