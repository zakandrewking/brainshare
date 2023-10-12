import {
  Button,
  Container,
  List,
  ListItem,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import supabase from "../supabase";
import { mutate } from "swr";

export default function MyGraph() {
  const navigate = useNavigate();

  const deleteGraph = async (id: string, path: string) => {
    const { error } = await supabase.from("graph").delete().match({ id });
    if (error) throw Error(error.message);
    mutate(
      "graph",
      (rows: any) => ({ rows: rows?.filter((row: any) => row.id !== id) }),
      { revalidate: false }
    );
    navigate(`/my-graph`);
  };

  return (
    <Container>
      <Stack spacing={4}>
        <Typography variant="h4">My Graphs</Typography>
      </Stack>
      <List>
        <ListItem>
          <Button
            variant="outlined"
            disabled
            //   onClick={deleteGraph(row.id)}
          >
            Delete
          </Button>
        </ListItem>
      </List>
    </Container>
  );
}
