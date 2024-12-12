import Container from "@/components/ui/container";
import { List, ListItem, ListItemContent } from "@/components/ui/list";
import { H3 } from "@/components/ui/typography";
import { getSupabase } from "@/utils/supabase/supabaseServer";

import AddFileButton from "./AddFile";
import FileView from "./FileView";

export default async function File({
  params: { id },
}: {
  params: { id: string };
}) {
  const supabase = await getSupabase();

  const { data: file, error } = await supabase
    .from("file")
    .select("name")
    .eq("id", id)
    .single();

  return (
    <Container gap={5}>
      Name: {file?.name}
      <FileView id={id} />
      <AddFileButton />
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
