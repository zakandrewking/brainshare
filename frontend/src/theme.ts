import { PaletteMode } from "@mui/material";

const theme = {
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
};

export function getDesignTokens(mode: PaletteMode) {
  return {
    ...theme,
    palette: {
      mode,
      ...(mode === "dark"
        ? {
            // primary: {
            //   main: "#040b12",
            // },
            secondary: {
              main: "#48384b",
            },
            background: {
              default: "#07102b",
              paper: "#040b12",
            },
          }
        : {
            // primary: {
            //   main: "#fff",
            // },
            secondary: {
              main: "#e9dcef",
            },
            background: {
              default: "#fff",
              paper: "#fff",
            },
          }),
    },
  };
}
