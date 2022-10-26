import { useEffect, useState } from "react";
import {
  Link as RouterLink,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { useTheme } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import Toolbar from "@mui/material/Toolbar";
import useMediaQuery from "@mui/material/useMediaQuery";

import Co2RoundedIcon from "@mui/icons-material/Co2Rounded";
import CottageRoundedIcon from "@mui/icons-material/CottageRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

const drawerWidth = 200;

export default function Navigation({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchFocus, setSearchFocus] = useState(false);

  const theme = useTheme();
  const sm = useMediaQuery(theme.breakpoints.down("sm"));
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const [searchParams, _] = useSearchParams();
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();

  // update the search input value when we navigate
  useEffect(() => {
    const val = searchParams.get("q");
    if (val) {
      setSearchValue(val);
    }
  }, [searchParams]);

  const toggleDrawer =
    (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
      if (
        event &&
        event.type === "keydown" &&
        ((event as React.KeyboardEvent).key === "Tab" ||
          (event as React.KeyboardEvent).key === "Shift")
      ) {
        return;
      }

      setMobileOpen(open);
    };

  const drawer = (
    <Box onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
      <Toolbar />
      <List>
        <ListItem key="home" disablePadding>
          <ListItemButton component={RouterLink} to="/">
            <ListItemIcon>
              <CottageRoundedIcon />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItemButton>
        </ListItem>
        <ListItem key="Chemicals" disablePadding>
          <ListItemButton component={RouterLink} to="/chemicals">
            <ListItemIcon>
              <Co2RoundedIcon />
            </ListItemIcon>
            <ListItemText primary="Chemicals" />
          </ListItemButton>
        </ListItem>
        <ListItem key="docs" disablePadding>
          <ListItemButton component={RouterLink} to="/docs">
            <ListItemIcon>
              <MenuBookRoundedIcon />
            </ListItemIcon>
            <ListItemText primary="Docs" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  const container =
    window !== undefined ? () => window.document.body : undefined;

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        elevation={0}
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: "background.paper",
          color: "text.primary",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Toolbar sx={{ minHeight: "56px !important" }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={toggleDrawer(true)}
            sx={{ display: { md: "none" } }}
          >
            <MenuRoundedIcon />
          </IconButton>
          <Box
            sx={{
              display: "flex",
              flex: "auto",
              alignItems: "center",
              justifyContent: "space-between",
              marginLeft: "10px",
              overflow: "hidden",
            }}
          >
            <Link
              component={RouterLink}
              to="/"
              noWrap
              underline="none"
              color="inherit"
              sx={{
                flex: "0 10 auto",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Brainshare Metabolism
            </Link>
            <Box
              component={"form"}
              sx={{
                flex: "0 1 auto",
                borderRadius: "5px",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                backgroundColor: prefersDarkMode
                  ? "secondary.dark"
                  : "secondary.light",
                "&:hover": {
                  backgroundColor: "secondary.main",
                },
              }}
              name="search"
              onSubmit={(e) => {
                if (e.preventDefault) e.preventDefault();
                navigate(`/search?q=${searchValue}`);
                console.log("submit");
              }}
            >
              <InputBase
                placeholder={sm ? "" : "Search"}
                inputProps={{ "aria-label": "search" }}
                onFocus={() => setSearchFocus(true)}
                onBlur={() => setSearchFocus(false)}
                sx={{
                  color: "secondary.contrastText",
                  "& .MuiInputBase-input": {
                    transition: theme.transitions.create("width"),
                    padding: "8px 8px 8px 12px",
                    ...(searchParams.get("q")
                      ? {
                          width: "2000px",
                        }
                      : {
                          width: "52px",
                          "&:focus": {
                            width: "300px",
                          },
                          [theme.breakpoints.up("sm")]: {
                            width: "200px",
                          },
                        }),
                  },
                }}
                value={searchValue}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setSearchValue(event.target.value);
                }}
              />
              <Box
                sx={{
                  overflow: "hidden",
                  height: "100%",
                  padding: "4px",
                  position: "absolute",
                  right: "0px",
                  display: "inline-flex",
                  ...(searchFocus ? {} : { pointerEvents: "none" }),
                }}
              >
                <Button
                  color="inherit"
                  sx={{
                    height: "100%",
                    backgroundColor: `rgba(255,255,255,${
                      prefersDarkMode ? 0.2 : 0.5
                    })`,
                    color: "secondary.contrastText",
                    padding: 0,
                    "&:hover": {
                      backgroundColor: `rgba(255,255,255,${
                        prefersDarkMode ? 0.3 : 0.3
                      })`,
                    },
                  }}
                  onMouseDown={() => navigate(`/search?q=${searchValue}`)}
                >
                  <SearchRoundedIcon />
                </Button>
              </Box>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
        <SwipeableDrawer
          elevation={0}
          container={container}
          variant="temporary"
          open={mobileOpen}
          onOpen={() => {}}
          onClose={toggleDrawer(false)}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          PaperProps={{
            sx: {
              borderRight: prefersDarkMode ? 1 : 0,
              borderColor: "divider",
              backgroundColor: "background.paper",
            },
          }}
        >
          {drawer}
        </SwipeableDrawer>
        <Drawer
          elevation={0}
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          PaperProps={{
            sx: { backgroundColor: "background.paper" },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
