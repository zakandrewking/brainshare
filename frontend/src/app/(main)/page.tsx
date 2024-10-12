import { getMissingKeys } from "@/app/actions";
import { Chat } from "@/components/chat";
import Container from "@/components/ui/container";
import { Stack } from "@/components/ui/stack";
import { AI } from "@/lib/chat/actions";
import { nanoid } from "@/lib/utils";

export default async function Home() {
  const id = nanoid();
  const missingKeys = await getMissingKeys();

  return (
    <Container>
      <Stack direction="col" alignItems="center" className="w-full">
        <AI initialAIState={{ chatId: id, messages: [] }}>
          <Chat id={id} missingKeys={missingKeys} />
        </AI>
      </Stack>
    </Container>
  );
}
