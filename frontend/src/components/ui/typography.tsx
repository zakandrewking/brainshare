import { ReactNode } from "react";

function H1({
  gutterBottom = true,
  children,
}: {
  gutterBottom?: boolean;
  children: ReactNode;
}) {
  let classes =
    "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl";
  if (gutterBottom) {
    classes += " mb-6";
  }
  return <h1 className={classes}>{children}</h1>;
}

function H3({
  gutterBottom = true,
  children,
}: {
  gutterBottom?: boolean;
  children: ReactNode;
}) {
  let classes = "scroll-m-20 text-2xl font-semibold tracking-tight";
  if (gutterBottom) {
    classes += " mb-4";
  }
  return <h3 className={classes}>{children}</h3>;
}

export { H1, H3 };
