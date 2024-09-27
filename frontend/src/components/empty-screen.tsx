import Image from "next/image";

import robotCsv from "./robot-csv.png";

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <Image src={robotCsv} alt="robot-csv" className="w-56" />
    </div>
  );
}
