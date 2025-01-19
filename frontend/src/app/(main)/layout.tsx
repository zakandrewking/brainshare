import { ReactNode } from "react";

import NavigationHeader from "@/components/ui/navigation-header";

export default async function Main({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <NavigationHeader />
      <main className="flex-grow flex flex-col">{children}</main>
    </div>
  );
}
