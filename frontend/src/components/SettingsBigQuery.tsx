import {
  Button,
  Container,
  Link,
  List,
  ListItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Bold } from "./textComponents";
import { FileDownloadSharp } from "@mui/icons-material";
import FileDrop from "./FileDrop";

export default function SettingsBigQuery() {
  return (
    <Container maxWidth="sm" fixed>
      <Typography paragraph>
        <Bold>
          BigQuery is an enterprise-level data warehouse solution, offering
          comprehensive management and analysis of data.
        </Bold>
      </Typography>
      <Typography paragraph>
        Connecting Brainshare to BigQuery will allow you to run SQL queries
        directly against all of your data and graphs, without managing any
        servers or databases.
      </Typography>
      <Typography paragraph>To get started:</Typography>
      <List
        sx={{
          listStyleType: "decimal",
          "& .MuiListItem-root": {
            display: "list-item",
          },
          marginLeft: "20px",
        }}
      >
        <ListItem>
          <Typography>
            Create a Google Cloud account{" "}
            <Link href="https://console.cloud.google.com/" target="_blank">
              here
            </Link>
            .
          </Typography>
        </ListItem>
        <ListItem>
          <Typography>
            Create a service account key by following{" "}
            <Link
              href="https://cloud.google.com/iam/docs/keys-create-delete#creating"
              target="_blank"
            >
              these instructions
            </Link>
            . Download the entire service account key JSON file.
          </Typography>
        </ListItem>
        <ListItem>
          <Typography>
            Set up service account permissions. Permissions required by
            Brainshare are:{" "}
            <Bold>BigQuery Job User and BigQuery Data Viewer</Bold>.{" "}
            <Link
              href="https://cloud.google.com/iam/docs/granting-roles-to-service-accounts#granting_"
              target="_blank"
            >
              Click here.
            </Link>
          </Typography>
        </ListItem>
        <ListItem sx={{ pb: "25px" }}>
          <Typography>
            Upload the service account key JSON file to Brainshare.
          </Typography>
          <FileDrop />
        </ListItem>
        <ListItem>
          <Stack>
            <Typography>Configure the BigQuery table name</Typography>
            <TextField
              sx={{ mt: "15px" }}
              label="Table Name"
              value={"default"}
              fullWidth
              disabled
            />
          </Stack>
        </ListItem>
        <ListItem>
          <Typography>
            Connect to BigQuery from your application. Here are some examples:
            TODO
          </Typography>
        </ListItem>
      </List>
    </Container>
  );
}
