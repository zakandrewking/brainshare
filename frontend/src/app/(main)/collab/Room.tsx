"use client";

import { ReactNode } from "react";

import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";

const publicApiKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_API_KEY;

if (!publicApiKey) {
  throw new Error("NEXT_PUBLIC_LIVEBLOCKS_API_KEY is not set");
}

export default function Room({ children }: { children: ReactNode }) {
  return (
    <LiveblocksProvider publicApiKey={publicApiKey!}>
      <RoomProvider id="my-room">
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
