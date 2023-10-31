import { get as _get } from "lodash";
import pluralize from "pluralize";
import { useEffect, useRef, useState } from "react";
import GitInfo from "react-git-info/macro";
import { useHotkeys } from "react-hotkeys-hook";
import {
  Link as RouterLink,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import AnalyticsRoundedIcon from "@mui/icons-material/AnalyticsRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CottageRoundedIcon from "@mui/icons-material/CottageRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import Person2RoundedIcon from "@mui/icons-material/Person2Rounded";
import QuestionAnswerRoundedIcon from "@mui/icons-material/QuestionAnswerRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TopicRoundedIcon from "@mui/icons-material/TopicRounded";
import { Typography } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import Fab from "@mui/material/Fab";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { useTheme } from "@mui/material/styles";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import Toolbar from "@mui/material/Toolbar";
import useMediaQuery from "@mui/material/useMediaQuery";

import displayConfig from "../displayConfig";
import { useAuth } from "../supabase";
import { capitalizeFirstLetter } from "../util/stringUtils";
import Chat from "./Chat";
import icons from "./icons";
import NavigationGraphNodeTypes from "./NavigationGraphNodeTypes";

const drawerWidth = 240;

export default function Navigation({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchFocus, setSearchFocus] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const { session } = useAuth();

  const theme = useTheme();
  const sm = useMediaQuery(theme.breakpoints.down("sm"));
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const [searchParams, _] = useSearchParams();
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // shortcut
  const inputRef = useRef<HTMLInputElement>();
  useHotkeys("/", () => inputRef!.current!.focus(), { preventDefault: true }, [
    inputRef,
  ]);
  useHotkeys(
    "Escape",
    () => {
      inputRef!.current!.blur();
    },
    { enableOnFormTags: true },
    [inputRef]
  );

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

  function resourceList(
    resource: (typeof displayConfig.topLevelResources)[number]
  ) {
    const name = _get(resource, ["name"], resource);
    return (
      <ListItem key={name} disablePadding>
        <ListItemButton
          component={RouterLink}
          to={`/${name}`}
          selected={Boolean(pathname.match(new RegExp(`^/${name}`)))}
        >
          <ListItemIcon>
            {_get(icons, _get(displayConfig, ["icon", name], "default"))}
          </ListItemIcon>
          <ListItemText primary={capitalizeFirstLetter(pluralize(name))} />
        </ListItemButton>
      </ListItem>
    );
  }

  const drawer = (
    <Box
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
      sx={{
        display: "flex",
        justifyContent: "space-between",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <Box>
        <Toolbar sx={{ minHeight: "56px !important" }} />
        <List>
          <ListItem key="home" disablePadding>
            <ListItemButton
              component={RouterLink}
              to="/"
              selected={pathname === "/"}
            >
              <ListItemIcon>
                <CottageRoundedIcon />
              </ListItemIcon>
              <ListItemText primary="Home" />
            </ListItemButton>
          </ListItem>
          <ListItem key="files" disablePadding>
            <ListItemButton
              component={RouterLink}
              to="/file"
              selected={Boolean(pathname.match(new RegExp(`^/file`)))}
            >
              <ListItemIcon>
                <TopicRoundedIcon />
              </ListItemIcon>
              <ListItemText primary="Files" />
            </ListItemButton>
          </ListItem>
          <ListItem key="my-graphs" disablePadding>
            <ListItemButton
              component={RouterLink}
              to="/my-graphs"
              selected={pathname === "/my-graphs"}
            >
              <ListItemIcon>
                <HubRoundedIcon />
              </ListItemIcon>
              <ListItemText primary="My Graphs" />
            </ListItemButton>
          </ListItem>
          <ListItem key="chat" disablePadding>
            <ListItemButton
              component={RouterLink}
              to="/chat"
              selected={pathname === "/chat"}
            >
              <ListItemIcon>
                <QuestionAnswerRoundedIcon />
              </ListItemIcon>
              <ListItemText primary="Chat" />
            </ListItemButton>
          </ListItem>
          <ListItem key="notebooks" disablePadding>
            <ListItemButton
              component={RouterLink}
              to="/notebooks"
              selected={pathname === "/notebooks"}
              disabled
            >
              <ListItemIcon>
                <AnalyticsRoundedIcon />
              </ListItemIcon>
              <ListItemText primary="Notebooks" />
            </ListItemButton>
          </ListItem>
          {/* <ListItem key="doc" disablePadding>
            <ListItemButton
              component={RouterLink}
              to="/doc"
              selected={Boolean(pathname.match(new RegExp(`^/doc`)))}
            >
              <ListItemIcon>
                <UploadFileRoundedIcon />
              </ListItemIcon>
              <ListItemText primary="Upload PDF" />
            </ListItemButton>
          </ListItem> */}
          <Divider />
          {/* {displayConfig.topLevelResources.map(resourceList)} */}
          <NavigationGraphNodeTypes />
          <Divider />
          <ListItem key="docs" disablePadding>
            <ListItemButton
              component={RouterLink}
              to="/api-docs"
              selected={pathname === "/api-docs"}
            >
              <ListItemIcon>
                <MenuBookRoundedIcon />
              </ListItemIcon>
              <ListItemText primary="API Docs" />
            </ListItemButton>
          </ListItem>
          <ListItem key="credits" disablePadding>
            <ListItemButton
              component={RouterLink}
              to="/credits"
              selected={pathname === "/credits"}
            >
              <ListItemIcon>
                <AutoAwesomeRoundedIcon />
              </ListItemIcon>
              <ListItemText primary="Credits" />
            </ListItemButton>
          </ListItem>
          {session ? (
            <ListItem key="logOut" disablePadding>
              <ListItemButton
                component={RouterLink}
                to="/account"
                selected={pathname === "/account"}
              >
                <ListItemIcon>
                  <Person2RoundedIcon />
                </ListItemIcon>
                <ListItemText primary="Account" />
              </ListItemButton>
            </ListItem>
          ) : (
            <ListItem key="logIn" disablePadding>
              <ListItemButton
                component={RouterLink}
                to="/log-in"
                selected={pathname === "/log-in"}
              >
                <ListItemIcon>
                  <LoginRoundedIcon />
                </ListItemIcon>
                <ListItemText primary="Log In" />
              </ListItemButton>
            </ListItem>
          )}
        </List>
      </Box>
      <Typography
        sx={{ fontSize: "12px", textAlign: "center", padding: "4px" }}
      >
        version: {GitInfo().commit.shortHash}
      </Typography>
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
                display: "flex",
                flex: "0 10 auto",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "28px",
                paddingTop: "2px",
              }}
            >
              <Box
                display="inline-block"
                sx={{
                  height: "36px",
                  paddingTop: "4px",
                  marginLeft: "5px",
                  marginRight: "13px",
                }}
              >
                <img
                  src={`${process.env.PUBLIC_URL}/cell-molecule-icon${
                    prefersDarkMode ? "_dark" : ""
                  }.png`}
                  alt="logo"
                  height="100%"
                />
              </Box>
              Brainshare
            </Link>
            <Box
              component={"form"}
              sx={{
                flex: "0 1 auto",
                borderRadius: "26px",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                color: prefersDarkMode
                  ? "hsl(0deg 0% 95%)"
                  : "hsl(0deg 0% 20%)",
                backgroundColor: prefersDarkMode
                  ? "hsl(290deg 15% 30%)"
                  : "hsl(280deg 56% 96%)",
                ...(!searchFocus && {
                  "&:hover": {
                    backgroundColor: prefersDarkMode
                      ? "hsl(290deg 15% 40%)"
                      : "hsl(280deg 37% 87%)",
                  },
                }),
              }}
              name="search"
              onSubmit={(e) => {
                if (e.preventDefault) e.preventDefault();
                navigate(`/search?q=${encodeURIComponent(searchValue)}`);
              }}
            >
              <InputBase
                placeholder={sm ? "" : "Search"}
                inputProps={{ "aria-label": "search" }}
                onFocus={() => setSearchFocus(true)}
                onBlur={() => setSearchFocus(false)}
                inputRef={inputRef}
                sx={{
                  "& .MuiInputBase-input": {
                    transition: theme.transitions.create("width"),
                    padding: "8px 8px 8px 12px",
                    ...(!searchFocus &&
                      !searchParams.get("q") && {
                        color: "rgba(0,0,0,0)",
                      }),
                    ...(searchParams.get("q")
                      ? {
                          width: "2000px",
                        }
                      : {
                          width: "19px",
                          "&:focus": {
                            width: "300px",
                          },
                          [theme.breakpoints.up("sm")]: {
                            width: "150px",
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
                  position: "absolute",
                  left: "12px",
                  top: "7px",
                  pointerEvents: "none",
                  display: "none",
                  ...(!searchFocus &&
                    !searchParams.get("q") && {
                      [theme.breakpoints.up("sm")]: {
                        display: "inline-flex",
                      },
                    }),
                }}
              >
                Search (
                <Typography component="span" sx={{ fontFamily: "Monospace" }}>
                  /
                </Typography>
                )
              </Box>
              <Box
                sx={{
                  overflow: "hidden",
                  height: "100%",
                  position: "absolute",
                  right: "0px",
                  display: "inline-flex",
                  padding: "0px",
                  ...(!searchFocus && { pointerEvents: "none" }),
                }}
              >
                <Button
                  color="inherit"
                  sx={{
                    height: "100%",
                    background: "none",
                    minWidth: "39px",
                    "&:hover": { background: "none" },
                  }}
                  onMouseDown={() =>
                    navigate(`/search?q=${encodeURIComponent(searchValue)}`)
                  }
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
          p: 0,
          width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar sx={{ minHeight: "56px !important" }} />
        {children}
      </Box>
      {pathname !== "/chat" &&
        (showChat ? (
          <Chat onClose={() => setShowChat(false)} />
        ) : (
          <Box
            sx={{
              position: "fixed",
              bottom: "24px",
              right: "24px",
              zIndex: 10,
            }}
          >
            <Fab
              color="secondary"
              aria-label="chat"
              onClick={() => setShowChat(!showChat)}
            >
              <QuestionAnswerRoundedIcon />
            </Fab>
          </Box>
        ))}
    </Box>
  );
}
