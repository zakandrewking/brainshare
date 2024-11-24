import { getMissingKeys } from "@/app/actions";
import { EmptyScreen } from "@/components/empty-screen";
import Container from "@/components/ui/container";
import { InternalLink } from "@/components/ui/link";
import { Stack } from "@/components/ui/stack";
import UrlEntry from "@/components/url-entry";
import { nanoid } from "@/lib/utils";

export default async function Home() {
  const id = nanoid();
  const missingKeys = await getMissingKeys();

  return (
    <Container>
      <Stack direction="col" alignItems="center" className="w-full" gap={10}>
        <EmptyScreen />
        Drop a file
        <UrlEntry />
        <InternalLink href="/table/github+https%3A%2F%2Fraw.githubusercontent.com%2FKohlbacherLab%2FCLAUDIO%2Frefs%2Fheads%2Fmain%2Ftest%2Fout%2Fsample%2Fsample_data_random_extended_old.csv">
          Example
        </InternalLink>
      </Stack>
      {/* <Stack direction="col" alignItems="center" className="w-full"> */}
      {/* <AI initialAIState={{ chatId: id, messages: [] }}>
          <Chat id={id} missingKeys={missingKeys} />
        </AI> */ }
      {/* </Stack> */}
    </Container>
  );
}
