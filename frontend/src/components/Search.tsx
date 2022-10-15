import { useSearchParams } from "react-router-dom";

import Box from "@mui/material/Box";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  return <Box>{searchParams.get("q")}</Box>;
}
