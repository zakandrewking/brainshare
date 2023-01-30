import { Link } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import MailIcon from "@mui/icons-material/Mail";

export default function Home() {
  return (
    <Container maxWidth="sm" sx={{ marginLeft: 0 }}>
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
        proteins and species. And you can access all of the data with a REST
        API. It runs on{" "}
        <Link href="https://supabase.com/" target="_blank">
          Supabase
          <OpenInNewIcon fontSize="small" sx={{ marginLeft: "4px" }} />
        </Link>{" "}
        and{" "}
        <Link href="https://vercel.com/dashboard" target="_blank">
          Vercel.
          <OpenInNewIcon fontSize="small" sx={{ marginLeft: "4px" }} />
        </Link>
      </Typography>
      <Typography paragraph={true}>
        Use the links in the menu to look around, and{" "}
        <Link href="mailto:zaking17@gmail.com">
          drop me a line
          <MailIcon fontSize="small" sx={{ marginLeft: "4px" }} />
        </Link>{" "}
        if you're thinking of a way to make this better.
      </Typography>
      <Typography paragraph={true}>
        Source code{" "}
        <Link
          href="https://github.com/zakandrewking/brainshare-metabolism"
          target="_blank"
        >
          is here,
          <OpenInNewIcon fontSize="small" sx={{ marginLeft: "4px" }} />
        </Link>{" "}
        and it's available under the{" "}
        <Link
          href="https://github.com/zakandrewking/brainshare-metabolism/blob/main/LICENSE"
          target="_blank"
        >
          Apache 2.0 license.
          <OpenInNewIcon fontSize="small" sx={{ marginLeft: "4px" }} />
        </Link>
      </Typography>
    </Container>
  );
}
