import FileDrag from "@/components/file-drag";
import { NavigationMenu } from "@/components/ui/navigation-menu";
import { ReactNode } from "react";

export default async function Main({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <NavigationMenu />
      <FileDrag />
      <main className="p-5 flex-grow">{children}</main>
    </div>
  );
}
