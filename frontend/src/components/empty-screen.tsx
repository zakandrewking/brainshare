import Image from "next/image";

import robotCsv from "./robot-csv.png";
import { Stack } from "./ui/stack";

export function EmptyScreen() {
  return (
    <Stack direction="col" alignItems="center" className="w-full" gap={4}>
      <Image src={robotCsv} alt="robot-csv" className="w-56" priority />
      <div className="text-2xl font-bold mt-4">
        Hello, human! Drop your CSVs here, and I&apos;ll build you some charts.
      </div>
    </Stack>
  );
}
