import { get as _get } from "lodash";
import useSWR from "swr";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import Box from "@mui/material/Box";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import supabase, { useAuth } from "../supabase";
import { useEffect, useState } from "react";

export default function Account() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");

  const { error } = useSWR(
    session ? "/account" : null,
    async () => {
      const { data, error } = await supabase
        .from("profile")
        .select("*")
        .eq("id", session?.user.id)
        .single();
      if (error) throw Error(error.message);
      setUsername(_get(data, ["username"], ""));
    },
    {
      revalidateIfStale: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  useEffect(() => {
    if (!session) navigate("/log-in");
  }, [session, navigate]);

  if (error) {
    return <Box>Something went wrong. Try again.</Box>;
  }

  return (
    <>
      <Typography variant="h4" sx={{ marginBottom: "30px" }}>
        Account
      </Typography>
      <Stack alignItems="flex-start" spacing={3}>
        <TextField
          label="Username"
          value={username}
          fullWidth
          disabled
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setUsername(event.target.value);
          }}
        />
        <Button component={RouterLink} to="/api-docs">
          <KeyRoundedIcon sx={{ marginRight: 1 }} /> Manage Your API Key
        </Button>
        <Button component={RouterLink} to="/log-out">
          <LogoutRoundedIcon sx={{ marginRight: 1 }} /> Log Out
        </Button>
      </Stack>
    </>
  );
}
