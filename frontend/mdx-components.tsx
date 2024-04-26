import { H1, H2, H3, H4, LI, UL } from "@/components/ui/typography";

import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => <H1>{children}</H1>,
    h2: ({ children }) => <H2>{children}</H2>,
    h3: ({ children }) => <H3>{children}</H3>,
    h4: ({ children }) => <H4>{children}</H4>,
    // h5: ({ children }) => <H5>{children}</H5>,
    // h6: ({ children }) => <H6>{children}</H6>,
    ul: ({ children }) => <UL>{children}</UL>,
    li: ({ children }) => <LI>{children}</LI>,
    ...components,
  };
}
