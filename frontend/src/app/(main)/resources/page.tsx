import { Metadata } from "next";

import { Button } from "@/components/ui/button";
import Container from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { InternalLink } from "@/components/ui/link";
import { Stack } from "@/components/ui/stack";

export const metadata: Metadata = {
  title: "Brainshare - Resources",
  description: "List of resources",
};

export default function ResourceList() {
  return (
    <Container>
      <div className="mb-2">Add a resource</div>
      <div>
        Resources:
        {/* List */}
      </div>
      <Stack direction="row" gap={0}>
        <InternalLink href="/docs">Docs</InternalLink>
      </Stack>
    </Container>
  );
}
