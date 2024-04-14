import { Button } from "@/components/ui/button";

import { Filter } from "@/components/ui/filter";
import { NavigationMenu } from "@/components/ui/navigation-menu";

export default function Home() {
  let x = 3;
  let y = 4;
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
          <Button variant="secondary">Click me</Button>
        </div>
      </main>
    </>
  );
}
