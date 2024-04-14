import { ReactNode, useEffect, useState } from "react";

export default function useIsSSR() {
  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  return !mounted;
}
