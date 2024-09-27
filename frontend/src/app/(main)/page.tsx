import Image from "next/image";

import { Chat } from "@/components/chat";
import { ChatPanel } from "@/components/chat-panel";
import Container from "@/components/ui/container";
import { Grid, GridItem } from "@/components/ui/grid";
import { Stack } from "@/components/ui/stack";
import { H1 } from "@/components/ui/typography";

import robotCsv from "./robot-csv.png";

export default async function Home() {
  return (
    <Container>
      <Stack direction="col" gap={3} alignItems="center" className="w-full">
        <Chat />
      </Stack>
    </Container>
  );
}
