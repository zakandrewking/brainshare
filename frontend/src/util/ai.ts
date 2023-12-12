export function pageTextDescription(pathname: string) {
  if (pathname === "/") {
    return "Home page";
  }
  if (pathname === "/files") {
    return "File list";
  }
  if (pathname.match(new RegExp("^/file/\\d*$"))) {
    return "Viewing file named s41540-017-0013-4.txt";
  }
  return null;
}
