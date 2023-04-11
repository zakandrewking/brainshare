import { PaletteMode } from "@mui/material";

const theme = {
  transitions: {
    duration: {
      shortest: 100,
      shorter: 100,
      short: 100,
      standard: 100,
      complex: 100,
      enteringScreen: 100,
      leavingScreen: 100,
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
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          color: "white",
        },
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
    components: {
      ...theme.components,
      ...(mode === "dark"
        ? {
            MuiTabs: {
              styleOverrides: {
                root: {
                  borderBottom: "2px hsl(213deg 23% 15%) solid",
                },
              },
            },
            MuiTab: {
              styleOverrides: {
                root: {
                  color: "#fff",
                  "&.Mui-disabled": {
                    color: "rgba(255,255,255,0.2)",
                  },
                },
              },
            },
          }
        : {
            MuiTabs: {
              styleOverrides: {
                root: {
                  backgroundColor: "hsl(213deg 54% 31%)",
                  borderBottom: "2px hsl(213deg 54% 31%) solid",
                },
                indicator: { backgroundColor: "#fff" },
              },
            },
            MuiTab: {
              styleOverrides: {
                root: {
                  color: "#fff",
                  "&.Mui-disabled": {
                    color: "rgba(255,255,255,0.4)",
                  },
                  "&.Mui-selected": {
                    color: "#fff",
                  },
                },
              },
            },
            MuiListItemButton: {
              styleOverrides: {
                root: {
                  "&.Mui-selected": {
                    backgroundColor: "hsl(213deg 48% 91%)",
                  },
                },
              },
            },
          }),
    },
    palette: {
      mode,
      ...(mode === "dark"
        ? {
            secondary: {
              main: "#48384b",
            },
            background: {
              default: "hsl(213deg 23% 19%)",
              paper: "hsl(213deg 23% 15%)",
            },
          }
        : {
            secondary: {
              main: "#e9dcef",
            },
          }),
    },
  };
}
