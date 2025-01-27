"use client";

import React from "react";

import { useSearchParams } from "next/navigation";

import { logIn } from "@/actions/log-in";
import { signUp } from "@/actions/sign-up";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Stack } from "@/components/ui/stack";
import { decodeRedirect } from "@/utils/url";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [stateLogIn, formActionLogIn, isPendingLogIn] = React.useActionState(
    logIn,
    {}
  );
  const [stateSignUp, formActionSignUp, isPendingSignUp] = React.useActionState(
    signUp,
    {}
  );
  const redirect = decodeRedirect(searchParams.get("redirect"));
  const isPending = isPendingLogIn || isPendingSignUp;

  if (process.env.NODE_ENV !== "development") {
    return (
      <div className="max-w-md mx-auto p-4 text-center">
        <Stack direction="col" gap={4} alignItems="center">
          <h1 className="text-2xl font-bold">Coming Soon!</h1>
          <p>
            We&apos;re working hard to bring you something amazing. Please check
            back later.
          </p>
        </Stack>
      </div>
    );
  }

  return (
    <form className="max-w-md mx-auto p-4">
      <Stack direction="col" gap={2} alignItems="start">
        <input type="hidden" name="redirect" value={redirect} />
        <label htmlFor="email">Email:</label>
        <Input id="email" name="email" type="email" required />
        <label htmlFor="password">Password:</label>
        <Input id="password" name="password" type="password" required />
        <Button formAction={formActionLogIn} disabled={isPending}>
          Log in
        </Button>
        <Button formAction={formActionSignUp} disabled={isPending}>
          Sign up
        </Button>
        {stateLogIn.error && <p>{stateLogIn.error}</p>}
        {stateSignUp.error && <p>{stateSignUp.error}</p>}
      </Stack>
    </form>
  );
}
