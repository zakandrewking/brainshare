import { Link as RouterLink } from "react-router-dom";

import { Box, Button, Container, Stack, Typography } from "@mui/material";

import { useAuth } from "../supabase";

export default function GraphList() {
  const { session } = useAuth();

  return (
    <Container>
      <Stack spacing={4}>
        <Typography variant="h4">Graphs</Typography>

        {session ? (
          <Box>No graphs</Box>
        ) : (
          <Box sx={{ marginTop: "30px" }}>
            <Button
              variant="outlined"
              component={RouterLink}
              to="/log-in?redirect=/graphs"
            >
              Log in
            </Button>
          </Box>
        )}
      </Stack>
    </Container>
  );
}
