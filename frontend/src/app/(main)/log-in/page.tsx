"use client";

import React from "react";

import { useSearchParams } from "next/navigation";
import { mutate } from "swr";

import { logIn } from "@/actions/log-in";
import { signUp } from "@/actions/sign-up";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Stack } from "@/components/ui/stack";
import { useAsyncEffect } from "@/hooks/use-async-effect";
import createClient from "@/utils/supabase/client";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const supabase = createClient();

  // clear data if the user just logged out
  useAsyncEffect(
    async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        mutate(() => true, undefined, { revalidate: false });
      }
    },
    async () => {},
    []
  );

  const [stateLogIn, formActionLogIn] = React.useActionState(logIn, {
    error: null,
  });
  const [stateSignUp, formActionSignUp] = React.useActionState(signUp, {
    error: null,
  });

  return (
    <form className="max-w-md mx-auto p-4">
      <Stack direction="col" gap={2} alignItems="start">
        <input
          type="hidden"
          name="redirect"
          value={searchParams.get("redirect") ?? "/"}
        />
        <label htmlFor="email">Email:</label>
        <Input id="email" name="email" type="email" required />
        <label htmlFor="password">Password:</label>
        <Input id="password" name="password" type="password" required />
        <Button formAction={formActionLogIn}>Log in</Button>
        <Button formAction={formActionSignUp}>Sign up</Button>
        {stateLogIn.error && <p>{stateLogIn.error}</p>}
        {stateSignUp.error && <p>{stateSignUp.error}</p>}
      </Stack>
    </form>
  );
}
