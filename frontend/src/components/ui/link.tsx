import { ExternalLink as ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

import { Button } from "./button";

export function ExternalLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Button variant="link" asChild className={className}>
      <Link href={href} target="_blank">
        {children}
        <ExternalLinkIcon size={"0.8em"} className="ml-1" />
      </Link>
    </Button>
  );
}

export function InternalLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Button variant="link" asChild className={className}>
      <Link href={href}>{children}</Link>
    </Button>
  );
}
