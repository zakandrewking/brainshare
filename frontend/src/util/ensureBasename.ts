const basename = "metabolism";

export default function ensureBasename() {
  if (!window.location.pathname.includes(basename)) {
    window.history.replaceState("", "", basename + window.location.pathname);
  }
}
