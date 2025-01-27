import Link from "next/link";

import { EmptyScreen } from "@/components/empty-screen";
import { Button } from "@/components/ui/button";
import Container from "@/components/ui/container";
import { InternalLink } from "@/components/ui/link";
import { Stack } from "@/components/ui/stack";
import UrlEntry from "@/components/url-entry";

export default async function Home() {
  return (
    <Container>
      <Stack direction="col" alignItems="center" className="w-full" gap={10}>
        <EmptyScreen />
        <Stack direction="col" alignItems="start" className="w-full" gap={0}>
          <UrlEntry />
          <InternalLink href="/table/github+https%3A%2F%2Fraw.githubusercontent.com%2FKohlbacherLab%2FCLAUDIO%2Frefs%2Fheads%2Fmain%2Ftest%2Fout%2Fsample%2Fsample_data_random_extended_old.csv">
            Example: KohlbacherLab/CLAUDIO {">"}{" "}
            sample_data_random_extended_old.csv
          </InternalLink>
          <InternalLink href="/table/github+https%3A%2F%2Fgist.githubusercontent.com%2Fdikaio%2F0ce2a7e9f7088918f8c6ff24436fd035%2Fraw%2Fdfde3a7940b8ac11e29869ce9b3b0f03c8b483f4%2Fdata.csv">
            Example: dikaio/gist {">"} data.csv
          </InternalLink>
        </Stack>
        <Stack direction="col" alignItems="center" className="w-full" gap={2}>
          <p>If your data is not in GitHub, you can upload it here:</p>
          <Button asChild>
            <Link href="/files">Upload & Manage Files</Link>
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
