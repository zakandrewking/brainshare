import { ExternalLink } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import Container from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Stack } from "@/components/ui/stack";

export const metadata: Metadata = {
  title: "Brainshare - Components",
  description: "List of components",
};

export default function ToolList() {
  return (
    <Container>
      <div className="mb-2">Add a tool:</div>
      <Stack direction="row" gap={1} className="w-full">
        <Input className="text-lg" placeholder="Github URL" />
        <Button disabled>Add</Button>
      </Stack>
      <Stack direction="row" gap={0}>
        <Button variant="link" asChild>
          <Link href="https://github.com/brainshare-io/map">
            Example <ExternalLink size={14} className="ml-1" />
          </Link>
        </Button>
        <Button variant="link" asChild>
          <Link href="/docs">Docs</Link>
        </Button>
      </Stack>
    </Container>
  );
}
