import Image from "next/image";

import robotCsv from "./robot-csv.png";
import { Stack } from "./ui/stack";

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <Stack direction="row" gap={3} alignItems="center">
        <Image src={robotCsv} alt="robot-csv" className="w-56 sm:w-64" />
      </Stack>
      <div className="flex flex-col gap-2 rounded-lg border bg-background p-8">
        <h1 className="text-lg font-semibold">Welcome to a chatbot</h1>
        <p className="leading-normal text-muted-foreground">
          It&apos;s gonna do some stuff and hopefully teach you something. What
          do you want to learn about?
        </p>
      </div>
    </div>
  );
}
