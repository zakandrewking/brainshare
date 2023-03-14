import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import MailIcon from "@mui/icons-material/Mail";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

export function LinkOut({
  href,
  children,
}: {
  href: string;
  children: string;
}) {
  const split = children.split(" ");
  return (
    <Link href={href} target="_blank">
      {split.length > 1 && split.slice(0, -1).join(" ") + " "}
      <Box component="span" sx={{ whiteSpace: "nowrap" }}>
        {split.slice(-1)[0]}
        <OpenInNewIcon
          fontSize="small"
          sx={{ marginLeft: "2px", marginRight: "2px" }}
        />
      </Box>
    </Link>
  );
}

export function MailOut({
  address,
  children,
}: {
  address: string;
  children: string;
}) {
  const split = children.split(" ");
  return (
    <Link href={"mailto:" + address} target="_blank">
      {split.length > 1 && split.slice(0, -1).join(" ") + " "}
      <Box component="span" sx={{ whiteSpace: "nowrap" }}>
        {split.slice(-1)[0]}
        <MailIcon fontSize="small" sx={{ marginLeft: "4px" }} />
      </Box>
    </Link>
  );
}
