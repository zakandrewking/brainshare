"use client";

import { Button } from "@/components/ui/button";
import { ClerkLoading, SignOutButton } from "@clerk/nextjs";

export default function LogOut() {
  const getButton = (disabled: boolean) => {
    return (
      <Button variant="outline" disabled={disabled}>
        Log out
      </Button>
    );
  };

  return (
    <>
      <ClerkLoading>{getButton(true)}</ClerkLoading>
      <SignOutButton>{getButton(false)}</SignOutButton>
    </>
  );
}
