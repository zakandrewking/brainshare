"use client"; // Required for useState and useEffect

import React, { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button"; // Import Button component
import { Input } from "@/components/ui/input"; // Import Input component
import { LoadingSpinner } from "@/components/ui/loading"; // Import the spinner
import { cn } from "@/utils/tailwind"; // Assuming cn utility exists for class merging

import { createLiveblocksRoom, getLiveblocksRooms, RoomData } from "./actions"; // Import the server action

// Props for the Rooms component
interface RoomsProps {
  onSelectRoom: (roomId: string) => void; // Callback to parent
  selectedRoomId: string | null; // Currently selected room ID
}

export default function Rooms({ onSelectRoom, selectedRoomId }: RoomsProps) {
  const [rooms, setRooms] = useState<RoomData[]>([]);
  // State for initial loading before transition starts
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // State for new room name input
  const [newRoomName, setNewRoomName] = useState("");

  useEffect(() => {
    startTransition(async () => {
      setError(null);
      try {
        const result = await getLiveblocksRooms();
        if (result.success) {
          setRooms(result.data);
        } else {
          console.error("Failed to fetch rooms:", result.error);
          setError(result.error || "Failed to load rooms");
          setRooms([]);
        }
      } finally {
        // Mark initial load as complete once transition finishes
        setIsInitialLoading(false);
      }
    });
  }, []);

  // Handler for creating a new room
  const handleCreateRoom = () => {
    if (!newRoomName.trim()) return; // Basic validation

    startTransition(async () => {
      setError(null);
      const result = await createLiveblocksRoom(newRoomName.trim());

      if (result.success) {
        // Add new room to the list and select it
        setRooms((prevRooms) => [...prevRooms, result.data]);
        onSelectRoom(result.data.id);
        setNewRoomName(""); // Clear input
      } else {
        console.error("Failed to create room:", result.error);
        setError(result.error || "Failed to create room");
      }
    });
  };

  // Show loading if it's the initial load OR if a transition is pending
  if (isInitialLoading || isPending) {
    return (
      <div className="flex items-center justify-center p-4">
        <LoadingSpinner className="h-6 w-6" />
      </div>
    );
  }

  if (error) {
    return <div>Error loading rooms: {error}</div>;
  }

  // Show "No rooms" only after initial load/transition is done and rooms are empty
  if (rooms.length === 0 && !isPending && !isInitialLoading) {
    return <div>No rooms found.</div>;
  }

  return (
    <div className="flex flex-col space-y-4">
      {/* New Room Input/Button */}
      <div className="space-y-2">
        <h3 className="text-md font-semibold">Create New Room</h3>
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="New room name..."
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            className="flex-grow"
            disabled={isPending} // Disable input during transition
          />
          <Button
            onClick={handleCreateRoom}
            disabled={!newRoomName.trim() || isPending}
            size="sm"
          >
            Create
          </Button>
        </div>
        {error && <p className="text-sm text-red-600">Error: {error}</p>}
      </div>

      {/* Existing Room List */}
      <div className="flex flex-col space-y-2 border-t pt-4">
        <h2 className="mb-2 text-lg font-semibold">Available Rooms:</h2>
        {/* Loading/Empty state for list specifically */}
        {isInitialLoading ? (
          <div className="flex items-center justify-center p-4">
            <LoadingSpinner className="h-6 w-6" />
          </div>
        ) : rooms.length === 0 ? (
          <div>No rooms found.</div>
        ) : (
          <ul className="flex flex-col space-y-1">
            {rooms.map((room: RoomData) => (
              <li key={room.id}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectRoom(room.id)}
                  className={cn(
                    "w-full justify-start px-2 text-left",
                    selectedRoomId === room.id && "bg-accent font-medium"
                  )}
                  disabled={isPending} // Disable buttons during transition
                >
                  {(room.metadata?.name as string) || room.id}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
