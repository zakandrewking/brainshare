import Link from "next/link";

import { getMissingKeys } from "@/app/actions";
import { EmptyScreen } from "@/components/empty-screen";
import { Button } from "@/components/ui/button";
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
        <Stack direction="col" alignItems="start" className="w-full" gap={0}>
          <UrlEntry />
          <InternalLink href="/table/github+https%3A%2F%2Fraw.githubusercontent.com%2FKohlbacherLab%2FCLAUDIO%2Frefs%2Fheads%2Fmain%2Ftest%2Fout%2Fsample%2Fsample_data_random_extended_old.csv">
            Example: KohlbacherLab/CLAUDIO {">"}{" "}
            sample_data_random_extended_old.csv
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
