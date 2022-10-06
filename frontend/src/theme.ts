import { PaletteMode } from "@mui/material";

const theme = {
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
