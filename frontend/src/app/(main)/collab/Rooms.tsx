"use client"; // Required for useState and useEffect

import React, { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button"; // Import Button component
import { LoadingSpinner } from "@/components/ui/loading"; // Import the spinner
import { cn } from "@/utils/tailwind"; // Assuming cn utility exists for class merging

import { getLiveblocksRooms, RoomData } from "./actions"; // Import the server action

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
    <div className="flex flex-col space-y-2">
      <h2 className="mb-2 text-lg font-semibold">Available Rooms:</h2>
      <ul className="flex flex-col space-y-1">
        {rooms.map((room: RoomData) => (
          <li key={room.id}>
            <Button
              variant="ghost" // Use ghost variant for minimal styling
              size="sm" // Use small size
              onClick={() => onSelectRoom(room.id)}
              className={cn(
                "w-full justify-start px-2 text-left", // Ensure text aligns left, full width
                selectedRoomId === room.id && "bg-accent font-medium" // Apply accent background when selected
              )}
            >
              {(room.metadata?.name as string) || room.id}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
