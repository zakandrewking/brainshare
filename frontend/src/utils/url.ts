export function logInRedirect(redirect: string) {
  return `/log-in?redirectCode=${Buffer.from(redirect, "utf8").toString(
    "base64"
  )}`;
}

export function decodeRedirect(redirect: string) {
  return Buffer.from(redirect, "base64").toString("utf8");
}
