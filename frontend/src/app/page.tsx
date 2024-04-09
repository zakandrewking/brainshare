import { Button } from "@/components/ui/button";

import ModeToggle from "./ModeToggle";

export default function Home() {
  let x = 3;
  let y = 4;
  return (
    <main>
      <div className="flex flex-col items-center justify-center h-screen gap-3">
        <ModeToggle />
        <Button variant="secondary">Click me</Button>
      </div>
    </main>
  );
}
