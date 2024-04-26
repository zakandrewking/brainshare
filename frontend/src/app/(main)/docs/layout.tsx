import { ReactNode } from "react";

import Container from "@/components/ui/container";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return <Container>{children}</Container>;
}
