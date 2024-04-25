"use client";

import { Button } from "@/components/ui/button";
import useIsSSR from "@/hooks/useIsSSR";

export default function AddFileButton() {
  const isSSR = useIsSSR();
  return <Button disabled={isSSR}>Add file to an app</Button>;
}
