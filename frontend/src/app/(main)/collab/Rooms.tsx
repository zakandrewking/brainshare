"use client";

import React, { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading";
import { cn } from "@/utils/tailwind";

import {
  createLiveblocksRoom,
  forkLiveblocksRoom,
  getLiveblocksRooms,
  RoomData,
} from "./actions";

interface RoomsProps {
  onSelectRoom: (roomId: string) => void;
  selectedRoomId: string | null;
}

export default function Rooms({ onSelectRoom, selectedRoomId }: RoomsProps) {
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newRoomName, setNewRoomName] = useState("");

  // State for Fork Dialog
  const [isForkDialogOpen, setIsForkDialogOpen] = useState(false);
  const [forkingRoomId, setForkingRoomId] = useState<string | null>(null);
  const [forkingRoomOriginalName, setForkingRoomOriginalName] =
    useState<string>("");
  const [newForkName, setNewForkName] = useState("");

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
        setError(null); // Clear error on success
      } else {
        console.error("Failed to create room:", result.error);
        setError(result.error || "Failed to create room");
      }
    });
  };

  // Opens the dialog and sets initial state
  const openForkDialog = (roomId: string, originalName: string | undefined) => {
    const suggestedName = `Fork of ${originalName || roomId}`;
    setForkingRoomId(roomId);
    setForkingRoomOriginalName(originalName || roomId);
    setNewForkName(suggestedName); // Pre-fill input
    setIsForkDialogOpen(true);
    setError(null); // Clear previous errors
  };

  // Handles the actual forking when confirmed in the dialog
  const handleConfirmFork = () => {
    if (!forkingRoomId || !newForkName.trim()) return;

    startTransition(async () => {
      setError(null);
      const result = await forkLiveblocksRoom(
        forkingRoomId,
        newForkName.trim()
      );

      if (result.success) {
        setRooms((prevRooms) => [...prevRooms, result.data]);
        onSelectRoom(result.data.id);
        setIsForkDialogOpen(false); // Close dialog on success
      } else {
        console.error("Failed to fork room:", result.error);
        // Display error within the dialog
        setError(result.error || "Failed to fork room");
      }
    });
  };

  // Loading state for the whole component initially
  if (isInitialLoading) {
    return (
      <div className="flex h-full items-center justify-center p-4">
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
            {isPending && !forkingRoomId ? (
              <LoadingSpinner className="mr-2 h-4 w-4" />
            ) : null}{" "}
            {/* Show spinner only for create action */}
            Create
          </Button>
        </div>
        {error && !isForkDialogOpen && (
          <p className="text-sm text-red-600">Error: {error}</p>
        )}{" "}
        {/* Show create error only when dialog closed */}
      </div>

      {/* Existing Room List */}
      <div className="flex flex-col space-y-2 border-t pt-4">
        <h2 className="mb-2 text-lg font-semibold">Available Rooms:</h2>
        {/* Loading/Empty state for list specifically */}
        {isPending && rooms.length === 0 ? (
          <div className="flex items-center justify-center p-4">
            <LoadingSpinner className="h-6 w-6" />
          </div>
        ) : rooms.length === 0 ? (
          <div>No rooms found.</div>
        ) : (
          <ul className="flex flex-col space-y-1">
            {rooms.map((room: RoomData) => (
              <li key={room.id} className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectRoom(room.id)}
                  className={cn(
                    "flex-grow justify-start px-2 text-left",
                    selectedRoomId === room.id && "bg-accent font-medium"
                  )}
                  disabled={isPending}
                >
                  {(room.metadata?.name as string) || room.id}
                </Button>

                {/* --- Fork Button Trigger --- */}
                <Dialog
                  open={isForkDialogOpen && forkingRoomId === room.id}
                  onOpenChange={setIsForkDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        openForkDialog(room.id, room.metadata?.name as string)
                      }
                      disabled={isPending}
                      title={`Fork room '${
                        (room.metadata?.name as string) || room.id
                      }'`}
                      className="shrink-0"
                    >
                      {/* Git Fork Icon SVG */}
                      <svg
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        height="1em"
                        width="1em"
                        className="mr-1 h-4 w-4"
                      >
                        <path d="M5 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm0 2.122a2.25 2.25 0 1 0-1.5 0v.878A2.25 2.25 0 0 0 5.75 8.5h1.5v2.128a2.251 2.251 0 1 0 1.5 0V8.5h1.5a2.25 2.25 0 0 0 2.25-2.25v-.878a2.25 2.25 0 1 0-1.5 0v.878a.75.75 0 0 1-.75.75h-4.5A.75.75 0 0 1 5 6.25v-.878Zm3.75 7.378a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm3-8.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
                      </svg>
                      Fork
                    </Button>
                  </DialogTrigger>
                  {/* --- Fork Dialog Content --- */}
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Fork Room</DialogTitle>
                      <DialogDescription>
                        Create a new room based on &apos;
                        {forkingRoomOriginalName}&apos;. Enter a name for the
                        new room.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="new-fork-name" className="text-right">
                          New Name
                        </Label>
                        <Input
                          id="new-fork-name"
                          value={newForkName}
                          onChange={(e) => setNewForkName(e.target.value)}
                          className="col-span-3"
                          disabled={isPending}
                        />
                      </div>
                      {/* Display error inside the dialog */}
                      {error && isForkDialogOpen && (
                        <p className="col-span-4 text-right text-sm text-red-600">
                          Error: {error}
                        </p>
                      )}
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline" disabled={isPending}>
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button
                        onClick={handleConfirmFork}
                        disabled={!newForkName.trim() || isPending}
                      >
                        {isPending ? (
                          <LoadingSpinner className="mr-2 h-4 w-4" />
                        ) : null}
                        Fork Room
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
