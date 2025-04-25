"use client"; // Required for useState

import React, { useState } from "react";

import Editor from "./Editor";
import Room from "./Room";
import Rooms from "./Rooms";

export default function CollabPage() {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const handleSelectRoom = (roomId: string | null) => {
    setSelectedRoomId(roomId);
  };

  return (
    <div className="flex flex-col gap-4 p-8">
      <div className="overflow-y-auto rounded border p-4 flex-shrink-0">
        <Rooms
          onSelectRoom={handleSelectRoom}
          selectedRoomId={selectedRoomId}
        />
      </div>
      <div className="rounded border p-4 flex-grow overflow-hidden">
        {selectedRoomId ? (
          <Room key={selectedRoomId} roomId={selectedRoomId}>
            <Editor />
          </Room>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">
              Select a room to start collaborating.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
