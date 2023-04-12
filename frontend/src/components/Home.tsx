import { Link } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";

import { LinkOut, MailOut } from "./links";

export default function Home() {
  return (
    <Container maxWidth="sm" fixed>
      <Typography paragraph={true}>
        <Box component="span" sx={{ fontWeight: "medium" }}>
          Brainshare is an API for biology
        </Box>{" "}
        — well, just metabolism at the moment ... and just what I can find with
        a Creative Commons license and a convenient data dump. The data comes
        from these{" "}
        <Link component={RouterLink} to="/credits">
          wonderful projects
        </Link>
        ; please support them if you can!
      </Typography>
      <Typography paragraph={true}>
        This is a pretty simple demo. You can search for chemicals, reactions,
        proteins and species. You can{" "}
        <Link to="/doc" component={RouterLink}>
          upload research papers
        </Link>{" "}
        and they will link (using ChapGPT!) to any resources in Brainshare. And
        you can access all of the data with a{" "}
        <Link to="/api-docs" component={RouterLink}>
          REST API
        </Link>
        . It runs on <LinkOut href="https://supabase.com/">Supabase,</LinkOut>{" "}
        <LinkOut href="https://vercel.com">Vercel,</LinkOut> and{" "}
        <LinkOut href="https://fly.io">Fly.io.</LinkOut>
      </Typography>
      <Typography paragraph={true}>
        <MailOut address="zaking17@gmail.com">Drop me a line</MailOut> if you
        have ideas. Source code{" "}
        <LinkOut href="https://github.com/zakandrewking/brainshare-metabolism">
          is here,
        </LinkOut>{" "}
        and it's available under the{" "}
        <LinkOut href="https://github.com/zakandrewking/brainshare-metabolism/blob/main/LICENSE">
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
