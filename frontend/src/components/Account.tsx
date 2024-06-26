/**
 * Design Spec:
 * - Simple field that can be edited and saved (new password)
 */

import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import useSWR from "swr";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import useErrorBar from "../hooks/useErrorBar";
import supabase, { logOut, useAuth } from "../supabase";

export default function Account() {
  const { session, username } = useAuth();
  const navigate = useNavigate();
  const { showError } = useErrorBar();

  // TODO this is a minimal example for an editable field. pull it out into a
  // reusable component if we need it elsewhere (e.g. for username)
  const [password, setPassword] = useState("");
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [didSetPassword, setDidSetPassword] = useState(false);

  useEffect(() => {
    if (!session) navigate("/log-in");
  }, [session, navigate]);

  return (
    <Container>
      <Typography variant="h4" sx={{ marginBottom: "30px" }}>
        Account
      </Typography>
      <Stack alignItems="flex-start" spacing={3}>
        <TextField
          label="Username"
          value={username || ""}
          fullWidth
          autoComplete="off"
          disabled
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            // setUsername(event.target.value);
          }}
        />
        <Button component={RouterLink} to="/api-docs">
          <KeyRoundedIcon sx={{ marginRight: 1 }} /> Manage Your API Key
        </Button>
        <Button component={RouterLink} to="/account/bigquery">
          <StorageRoundedIcon sx={{ marginRight: 1 }} /> BigQuery Settings
        </Button>
        <Button onClick={() => logOut(navigate)}>
          <LogoutRoundedIcon sx={{ marginRight: 1 }} /> Log Out
        </Button>
        <Typography variant="h4">Debugging</Typography>
        <TextField
          label="new password"
          fullWidth
          autoComplete="off"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setDidSetPassword(false);
          }}
          disabled={isSettingPassword}
        />
        <Button
          onClick={async () => {
            setIsSettingPassword(true);
            const { error } = await supabase.auth.updateUser({
              password,
            });
            if (error) {
              setIsSettingPassword(false);
              setDidSetPassword(false);
              console.error(error);
              if (error.status === 422) {
                showError(
                  "New password should be different from the old password."
                );
              } else {
                showError();
              }
              throw Error("Could not set password");
            }
            setIsSettingPassword(false);
            setDidSetPassword(true);
          }}
          disabled={isSettingPassword || didSetPassword}
        >
          {didSetPassword && <CheckRoundedIcon sx={{ marginRight: "3px" }} />}
          Change Password
        </Button>
      </Stack>
    </Container>
  );
}
