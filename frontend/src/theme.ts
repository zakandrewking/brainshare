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
    }
  },
  components: {
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },
  },
};

export function getDesignTokens (mode: PaletteMode) {
  return {...theme, palette: { mode }};
}
