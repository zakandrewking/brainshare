import React from "react";

import { ExternalLink } from "@/components/external-link";
import { cn } from "@/lib/utils";

export function FooterText({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "px-2 text-center text-xs leading-normal text-muted-foreground",
        className
      )}
      {...props}
    >
      AI chatbot built with{" "}
      <ExternalLink href="https://sdk.vercel.ai">Vercel AI SDK</ExternalLink>{" "}
      and based on{" "}
      <ExternalLink href="https://vercel.com/templates/next.js/nextjs-ai-chatbot">
        Next.js AI Chatbot
      </ExternalLink>
      .
    </p>
  );
}
