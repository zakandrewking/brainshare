"use client";

import React, { ReactNode } from "react";

import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";

import { LoadingSpinner } from "@/components/ui/loading";

interface RoomProps {
  children: ReactNode;
  roomId: string; // The ID of the room to connect to
}

export default function Room({ children, roomId }: RoomProps) {
  // Check if the public API key is available
  const publicApiKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_API_KEY;

  if (!publicApiKey) {
    throw new Error("NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY is not set");
  }

  return (
    <LiveblocksProvider publicApiKey={publicApiKey}>
      <RoomProvider
        id={roomId}
        initialPresence={{
          cursor: null, // Initial presence for anonymous users
        }}
      >
        <ClientSideSuspense fallback={<LoadingSpinner />}>
          {() => children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
