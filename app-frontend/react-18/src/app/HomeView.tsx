"use client";

import { Button } from "brainshare-components/button";
import { H1 } from "brainshare-components/typography";
import { useRouter } from "next/navigation";

import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";

const config_json = process.env.NEXT_PUBLIC_CONFIG_JSON;
if (!config_json) throw Error("Missing NEXT_PUBLIC_CONFIG_JSON");
const config = JSON.parse(config_json);
const PUBLISHABLE_KEY = config.CLERK_PUBLISHABLE_KEY;

export default function HomeView() {
  const router = useRouter();
  return (
    // TODO LEFT OFF -> if we put multiple ClerkProviders in the app, will this
    // work? maybe look at the Clerk + Gatsby docs
    <ClerkProvider
      routerPush={(to) => router.push(to)}
      routerReplace={(to) => router.replace(to)}
      publishableKey={PUBLISHABLE_KEY}
    >
      <header>
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </header>
      <H1>Home</H1>
      <Button variant="default">Log In</Button>
      <div>safe</div>
    </ClerkProvider>
  );
}
