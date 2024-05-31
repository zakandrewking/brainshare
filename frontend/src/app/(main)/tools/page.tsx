import { Metadata } from "next";

import { Button } from "@/components/ui/button";
import Container from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { ExternalLink, InternalLink } from "@/components/ui/link";
import { Stack } from "@/components/ui/stack";

export const metadata: Metadata = {
  title: "Brainshare - Components",
  description: "List of components",
};

export default function ToolList() {
  return (
    <Container>
      <div className="mb-2">Add a tool:</div>
      <Stack direction="row" gap={2} className="w-full">
        <Input className="text-lg" placeholder="Github URL" />
        <Button disabled>Add</Button>
      </Stack>
      <Stack direction="row" gap={0}>
        <ExternalLink href="https://github.com/brainshare-io/map">
          Example
        </ExternalLink>
        <InternalLink href="/docs">Docs</InternalLink>
      </Stack>
    </Container>
  );
}
