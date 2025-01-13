export function logInRedirect(redirect: string) {
  return `/log-in?redirect=${Buffer.from(redirect, "utf8").toString("base64")}`;
}

export function decodeRedirect(redirect: string | null) {
  if (!redirect) {
    return "";
  }
  return Buffer.from(redirect, "base64").toString("utf8");
}
