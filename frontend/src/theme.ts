import { PaletteMode } from "@mui/material";

const theme = {
  typography: {
    h1: {
      marginTop: "20px",
    },
    h2: {
      marginTop: "20px",
    },
    h3: {
      marginTop: "20px",
    },
    h4: {
      marginTop: "20px",
    },
    h5: {
      marginTop: "20px",
    },
    h6: {
      marginTop: "20px",
    },
  },
  components: {
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        fontSizeSmall: { fontSize: "12px" },
      },
    },
  },
};

export function getDesignTokens(mode: PaletteMode) {
  return {
    ...theme,
    palette: {
      mode,
      ...(mode === "dark"
        ? { background: { default: "rgb(8 20 33)" } }
        : { background: {} }),
    },
  };
}
