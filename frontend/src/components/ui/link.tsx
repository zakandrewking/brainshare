import React from "react";

import { ExternalLink as ExternalLinkIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "./button";

export function ExternalLink({
  href,
  children,
  className,
  disabled,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <Button variant="link" className={className} disabled>
        {children}
        <ExternalLinkIcon size={"0.8em"} className="ml-1" />
      </Button>
    );
  }
  return (
    <Button variant="link" asChild className={className}>
      <Link href={href} target="_blank">
        {children}
        <ExternalLinkIcon size={"0.8em"} className="ml-1" />
      </Link>
    </Button>
  );
}

// TODO we probably want two versions of these, one rendered as a button and one
// rendered as a link
export function InternalLink({
  href,
  children,
  className,
  disabled,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <Button variant="link" className={className} disabled>
        {children}
      </Button>
    );
  }
  return (
    <Button variant="link" asChild className={className}>
      <Link href={href}>{children}</Link>
    </Button>
  );
}
