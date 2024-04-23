import Image from "next/image";

import { Grid, Item } from "@/components/ui/grid";
import { Stack } from "@/components/ui/stack";
import { H1 } from "@/components/ui/typography";

import robotCsv from "./robot-csv.png";

export default async function Home() {
  return (
    <Stack direction="col" gap={3} alignItems="start" className="p-3">
      <H1>Brainshare</H1>
      <Stack direction="row" gap={3} className="flex-wrap mx-auto">
        <div className="w-56 sm:w-96 flex-none">
          <Image src={robotCsv} alt="robot-csv" />
        </div>
        <div style={{ maxWidth: "500px" }}>
          The best way to build & share Data Apps
          <br />- database included (or bring your own)
          <br />
          - build visuals that work anywhere on the web
          <br />
          - share and compose visuals
          <br />
          - responsive design for everything (w tooling)
          <br />
          - the tools you like (react, svelte, vue, d3, 3js, reactflow, etc)
          <br />
          - optional database versioning & collaboration tooling
          <br />
          - fork an app with or without data
          <br />
          - local dev for everything (just pip install; add a brainshare.toml;
          runs on sqlite or from cloud postgres; imitate gradio)
          <br />
          - allow dev on the website?
          <br />
          - export as an app any time (TODO what&apos;s the most portable api
          layer?)
          <br />
          http://www.dictybase.org/ help improve
        </div>
      </Stack>
    </Stack>
  );
}
