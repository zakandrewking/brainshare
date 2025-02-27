import Container from "@/components/ui/container";
import {
  List,
  ListItem,
  ListItemContent,
} from "@/components/ui/list";
import { H3 } from "@/components/ui/typography";
import { createClient } from "@/utils/supabase/server";

import FileView from "./FileView";

export default async function File({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: file } = await supabase
    .from("file")
    .select("name")
    .eq("id", id)
    .single();

  return (
    <Container gap={5}>
      Name: {file?.name}
      <FileView id={id} />
      <H3 gutterBottom={false}>Apps</H3>
      <List>
        <ListItem>
          <ListItemContent>App 1</ListItemContent>
        </ListItem>
        <ListItem>
          <ListItemContent>App 2</ListItemContent>
        </ListItem>
      </List>
    </Container>
  );
}
