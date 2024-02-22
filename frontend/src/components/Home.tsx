import { Link } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";

import { LinkOut, MailOut } from "./links";

export default function Home() {
  return (
    <Container maxWidth="sm" fixed>
      <Typography paragraph>
        <Box component="span" sx={{ fontWeight: "medium" }}>
          Brainshare is a place to create and share scientific knowledge.
        </Box>
      </Typography>
      <Typography paragraph>
        To start, your can sync files from any Google Drive folder. Synced files
        are analyzed by our AI, and the results are stored in a database. You
        can search the database, and you can use the{" "}
        <Link to="/api-docs" component={RouterLink}>
          REST API
        </Link>{" "}
        to build your own apps, conduct your own analyses, and more.
      </Typography>
      <img src={`${process.env.PUBLIC_URL}/robot-csv.png`} alt="robot" />
      <Typography paragraph>
        As you upload more files, Brainshare will get smarter. It will learn to
        recognize more types of data, and it will learn to extract more
        information from those files.
      </Typography>
      <Typography paragraph>
        To take your analyses to the next level, you can create custom knowledge
        graphs for your projects, which are also available via the API. Your
        knowledge graphs can include custom content, or extend our public graph,
        which is based on these{" "}
        <Link component={RouterLink} to="/credits">
          wonderful projects
        </Link>
        ; please support them if you can!
      </Typography>
      <Typography paragraph>
        Brainshare runs on{" "}
        <LinkOut href="https://supabase.com/">Supabase,</LinkOut>{" "}
        <LinkOut href="https://vercel.com">Vercel,</LinkOut>{" "}
        <LinkOut href="https://fly.io">Fly.io,</LinkOut> and{" "}
        <LinkOut href="https://langchain.com/">LangChain</LinkOut>.
      </Typography>
      <Typography paragraph>
        <MailOut address="zaking17@gmail.com">Drop me a line</MailOut> if you
        have ideas. Source code{" "}
        <LinkOut href="https://github.com/zakandrewking/brainshare">
          is here,
        </LinkOut>{" "}
        and it's available under the{" "}
        <LinkOut href="https://github.com/zakandrewking/brainshare/blob/main/LICENSE">
          Apache 2.0 license.
        </LinkOut>{" "}
        All data is provided under{" "}
        <Link component={RouterLink} to="/credits">
          the original licenses
        </Link>
        .
      </Typography>
    </Container>
  );
}
