import { Button } from "@/components/ui/button";

import { Filter } from "@/components/ui/filter";
import { NavigationMenu } from "@/components/ui/navigation-menu";

export default function Home() {
  return (
    <>
      <NavigationMenu />
      <main>
        <div className="flex flex-col items-center justify-center h-screen gap-3">
          <Filter
            items={[
              { value: "one", label: "one" },
              { value: "two", label: "two" },
            ]}
          />
        </div>
      </main>
    </>
  );
}
