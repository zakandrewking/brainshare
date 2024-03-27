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
import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import CottageRoundedIcon from "@mui/icons-material/CottageRounded";
import EmojiObjectsRoundedIcon from "@mui/icons-material/EmojiObjectsRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import Person2RoundedIcon from "@mui/icons-material/Person2Rounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import QuestionAnswerRoundedIcon from "@mui/icons-material/QuestionAnswerRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import TableChartRoundedIcon from "@mui/icons-material/TableChartRounded";
import TopicRoundedIcon from "@mui/icons-material/TopicRounded";
import {
  AppBar,
  Box,
  Button,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  InputBase,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  SwipeableDrawer,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import displayConfig from "../displayConfig";
import useCurrentProject from "../hooks/useCurrentProject";
import { useAuth } from "../supabase";
import { drawerWidth } from "../util/constants";
import { capitalizeFirstLetter } from "../util/stringUtils";
import Chat from "./Chat";
import icons from "./icons";

export default function Navigation({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchFocus, setSearchFocus] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [projectOpen, setProjectOpen] = useState(true);

  const { session } = useAuth();

  const [searchParams, _] = useSearchParams();
  const theme = useTheme();
  const sm = useMediaQuery(theme.breakpoints.down("sm"));
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // shortcuts
  const inputRef = useRef<HTMLInputElement>();
  useHotkeys(
    "/",
    () => inputRef!.current!.focus(),
    { preventDefault: true, ignoreEventWhen: () => searchFocus },
    []
  );
  useHotkeys(
    "c",
    () => setShowChat(true),
    { preventDefault: true, ignoreEventWhen: () => showChat },
    []
  );
  useHotkeys(
    "Escape",
    () => setShowChat(false),
    {
      preventDefault: true,
      ignoreEventWhen: () => !showChat,
      // these aren't working:
      // enableOnFormTags: true,
      // enableOnContentEditable: true,
    },
    []
  );

  // ------------
  // Data loading
  // ------------

  const { project, projectPrefix } = useCurrentProject();

  // -------
  // Effects
  // -------

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

  // ------
  // Render
  // ------

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
          <Divider />
          <ListItem disablePadding>
            <ListItemButton
              component={RouterLink}
              to="/projects"
              selected={Boolean(pathname.match(new RegExp("/projects")))}
            >
              <ListItemIcon>
                {" "}
                <StarBorderRoundedIcon />
              </ListItemIcon>
              Projects
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={(event) => {
                event.stopPropagation();
                setProjectOpen((open) => !open);
              }}
              sx={{
                fontStyle: "italic",
              }}
            >
              <ListItemIcon>
                <PlayArrowRoundedIcon
                  sx={{
                    transform: projectOpen ? "rotate(90deg)" : "",
                    transition: "transform 0.3s",
                  }}
                />
              </ListItemIcon>
              {project?.name}
            </ListItemButton>
          </ListItem>
          {projectOpen && (
            <>
              <ListItem key="files" disablePadding sx={{ pl: 2 }}>
                <ListItemButton
                  component={RouterLink}
                  to={`/${projectPrefix}/files`}
                  selected={Boolean(pathname.match(new RegExp("/files?($|/)")))}
                  disabled={!projectPrefix}
                >
                  <ListItemIcon>
                    <TopicRoundedIcon />
                  </ListItemIcon>
                  <ListItemText primary="Files" />
                </ListItemButton>
              </ListItem>
              <ListItem key="datasets" disablePadding sx={{ pl: 2 }}>
                <ListItemButton
                  component={RouterLink}
                  to={`/${projectPrefix}/datasets`}
                  selected={Boolean(
                    pathname.match(new RegExp("/datasets?($|/)"))
                  )}
                  disabled={!projectPrefix}
                >
                  <ListItemIcon>
                    <TableChartRoundedIcon />
                  </ListItemIcon>
                  <ListItemText primary="Datasets" />
                </ListItemButton>
              </ListItem>
              <ListItem key="graphs" disablePadding sx={{ pl: 2 }}>
                <ListItemButton
                  component={RouterLink}
                  to={`/${projectPrefix}/graphs`}
                  selected={Boolean(
                    pathname.match(new RegExp("/graphs?($|/)"))
                  )}
                  disabled={!projectPrefix}
                >
                  <ListItemIcon>
                    <HubRoundedIcon />
                  </ListItemIcon>
                  <ListItemText primary="Graphs" />
                </ListItemButton>
              </ListItem>
              <ListItem key="models" disablePadding sx={{ pl: 2 }}>
                <ListItemButton
                  component={RouterLink}
                  to="/models"
                  selected={pathname === "/models"}
                  disabled
                >
                  <ListItemIcon>
                    <AutoGraphRoundedIcon />
                  </ListItemIcon>
                  <ListItemText primary="Models" />
                </ListItemButton>
              </ListItem>
              <ListItem key="ai-scientist" disablePadding sx={{ pl: 2 }}>
                <ListItemButton
                  component={RouterLink}
                  to="/ai-scientist"
                  selected={pathname === "/ai-scientist"}
                  disabled
                >
                  <ListItemIcon>
                    <EmojiObjectsRoundedIcon />
                  </ListItemIcon>
                  <ListItemText primary="AI Scientist" />
                </ListItemButton>
              </ListItem>
              <ListItem key="notebooks" disablePadding sx={{ pl: 2 }}>
                <ListItemButton
                  component={RouterLink}
                  to="notebooks"
                  selected={pathname === "/notebooks"}
                  disabled
                >
                  <ListItemIcon>
                    <AnalyticsRoundedIcon />
                  </ListItemIcon>
                  <ListItemText primary="Notebooks" />
                </ListItemButton>
              </ListItem>
            </>
          )}
          {/* <Divider /> */}
          {/* <NavigationGraphNodeTypes /> */}
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
                selected={Boolean(pathname.match(new RegExp("^/account($|/)")))}
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
              // justifyContent: "space-between",
              gap: "10px",
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
                fontFamily: "Rajdhani, Ubuntu, sans-serif",
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
            <Box sx={{ flexGrow: 1 }} />
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
                navigate(`/search-graph?q=${encodeURIComponent(searchValue)}`);
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
                    navigate(
                      `/search-graph?q=${encodeURIComponent(searchValue)}`
                    )
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
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
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
              bottom: "10px",
              right: "10px",
              zIndex: 10,
            }}
          >
            <Button
              variant="contained"
              disableElevation
              color="secondary"
              aria-label="chat"
              onClick={() => setShowChat(!showChat)}
            >
              <QuestionAnswerRoundedIcon sx={{ mr: 1 }} />
              Chat (C)
            </Button>
          </Box>
        ))}
    </Box>
  );
}
