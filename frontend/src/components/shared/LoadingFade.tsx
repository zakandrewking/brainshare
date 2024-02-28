import { Box, CircularProgress, Fade } from "@mui/material";

export default function LoadingFade({
  isLoading,
  center = false,
}: {
  isLoading: boolean;
  center?: boolean;
}) {
  const spinner = (
    <Fade
      in={isLoading}
      timeout={isLoading ? 2000 : 0}
      style={{
        transitionDelay: isLoading ? "800ms" : "0ms",
      }}
      unmountOnExit
    >
      <CircularProgress />
    </Fade>
  );
  return center ? (
    <Box display="flex" justifyContent="center">
      {spinner}
    </Box>
  ) : (
    <Box>{spinner}</Box>
  );
}
