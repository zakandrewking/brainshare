"use client"; // Required for useState

import React, { useState } from "react";

import Editor from "./Editor";
import Room from "./Room";
import Rooms from "./Rooms";

export default function CollabPage() {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
  };

  return (
    <div className="flex h-full flex-col space-y-4 p-8">
      {/* Room list section */}
      <div className="h-1/4 overflow-y-auto rounded border p-4">
        <Rooms
          onSelectRoom={handleSelectRoom}
          selectedRoomId={selectedRoomId}
        />
      </div>
      {/* Editor section */}
      <div className="h-3/4 rounded border p-4">
        {selectedRoomId ? (
          <Room roomId={selectedRoomId}>
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
