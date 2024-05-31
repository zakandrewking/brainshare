import { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function H1({
  gutterBottom = true,
  className,
  children,
}: {
  gutterBottom?: boolean;
  className?: string;
  children: ReactNode;
}) {
  let classes =
    "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl";
  if (gutterBottom) {
    classes += " mb-6";
  }
  return <h1 className={cn(classes, className)}>{children}</h1>;
}

export function H2({
  gutterBottom = true,
  className,
  children,
}: {
  gutterBottom?: boolean;
  className?: string;
  children: ReactNode;
}) {
  let classes =
    "mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0";
  if (gutterBottom) {
    classes += " mb-5";
  }
  return <h2 className={cn(classes, className)}>{children}</h2>;
}

export function H3({
  gutterBottom = true,
  className,
  children,
}: {
  gutterBottom?: boolean;
  className?: string;
  children: ReactNode;
}) {
  let classes = "scroll-m-20 text-2xl font-semibold tracking-tight";
  if (gutterBottom) {
    classes += " mb-4";
  }
  return <h3 className={cn(classes, className)}>{children}</h3>;
}

export function H4({
  gutterBottom = true,
  children,
}: {
  gutterBottom?: boolean;
  children: ReactNode;
}) {
  let classes = "scroll-m-20 text-xl font-semibold tracking-tight";
  if (gutterBottom) {
    classes += " mb-3";
  }
  return <h4 className={classes}>{children}</h4>;
}

export function UL({ children }: { children: ReactNode }) {
  return <ul className="my-6 ml-6 list-disc [&>li]:mt-2">{children}</ul>;
}

export function LI({ children }: { children: ReactNode }) {
  return <li>{children}</li>;
}
