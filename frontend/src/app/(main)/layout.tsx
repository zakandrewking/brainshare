import { NavigationHeader } from "@/components/ui/navigation-header";
import { ReactNode } from "react";

export default async function Main({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <NavigationHeader />
      <main className="p-4 flex-grow">{children}</main>
    </div>
  );
}
