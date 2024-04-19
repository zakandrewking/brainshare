"use client";

import { Button } from "@/components/ui/button";
import useIsSSR from "@/hooks/useIsSSR";
import { ClerkLoading, SignOutButton } from "@clerk/nextjs";

export default function LogOut() {
  const isSSR = useIsSSR();

  const getButton = (disabled: boolean) => {
    return (
      <Button variant="outline" disabled={disabled}>
        Log out
      </Button>
    );
  };

  if (isSSR) {
    return getButton(true);
  }

  return (
    <>
      {/* Button will not work yet, but we make it enabled to avoid an extra UI transition */}
      <ClerkLoading>{getButton(false)}</ClerkLoading>
      <SignOutButton>{getButton(false)}</SignOutButton>
    </>
  );
}
