import { Link } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";

import { LinkOut, MailOut } from "./links";

export default function Home() {
  return (
    <Container maxWidth="sm" fixed sx={{ marginLeft: 0 }}>
      <Typography paragraph={true}>
        <Box component="span" sx={{ fontWeight: "medium" }}>
          Brainshare is an API for biology
        </Box>{" "}
        — well, just metabolism at the moment ... and just what I can find with
        a Creative Commons license and a convenient data dump.{" "}
        <Link component={RouterLink} to="/credits">
          Please support these projects!
        </Link>
      </Typography>
      <Typography paragraph={true}>
        This is a pretty simple demo. You can search for chemicals, reactions,
        proteins and species. And you can access all of the data with a{" "}
        <Link to="/api-docs" component={RouterLink}>
          REST API
        </Link>
        . It runs on <LinkOut href="https://supabase.com/">Supabase</LinkOut>{" "}
        and <LinkOut href="https://vercel.com/dashboard">Vercel.</LinkOut>
      </Typography>
      <Typography paragraph={true}>
        Use the links in the menu to look around, and{" "}
        <MailOut address="zaking17@gmail.com">drop me a line</MailOut> if you're
        thinking of a way to make this better.
      </Typography>
      <Typography paragraph={true}>
        Source code{" "}
        <LinkOut href="https://github.com/zakandrewking/brainshare-metabolism">
          is here,
        </LinkOut>{" "}
        and it's available under the{" "}
        <LinkOut href="https://github.com/zakandrewking/brainshare-metabolism/blob/main/LICENSE">
          Apache 2.0 license.
        </LinkOut>{" "}
        The data is provided under{" "}
        <Link component={RouterLink} to="/credits">
          the original licenses
        </Link>
        .
      </Typography>
    </Container>
  );
}
