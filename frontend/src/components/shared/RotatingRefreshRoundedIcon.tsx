import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { styled } from "@mui/material";

const RotatingRefreshRoundedIcon = styled(RefreshRoundedIcon)(
  () => `
  animation: spin 2s linear infinite;
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`
);

export default RotatingRefreshRoundedIcon;
