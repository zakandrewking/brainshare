import { ReactNode } from "react";

/**
 * The container for any app content on the main page.
 */
export default function Container({ children }: { children: ReactNode }) {
  return <div className="p-6 sm:p-10">{children}</div>;
}
