"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";

import { AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";

import { RoomData } from "@liveblocks/node";

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
  deleteLiveblocksRoom,
  forkLiveblocksRoom,
  getLiveblocksRooms,
  nukeAllLiveblocksRooms,
} from "./actions";

// Define a fetcher function for SWR
const fetcher = async (key: string): Promise<RoomData[]> => {
  console.log(`SWR fetching key: ${key}`); // Log which key is being fetched
  if (key !== "liveblocksRooms") {
    throw new Error("Invalid SWR key for rooms");
  }
  const result = await getLiveblocksRooms();
  if (result.success) {
    return result.data;
  } else {
    console.error("SWR fetcher failed:", result.error);
    // Throw an error to be caught by SWR's error handling
    throw new Error(result.error || "Failed to fetch rooms");
  }
};

interface RoomsProps {
  onSelectRoom: (roomId: string | null) => void;
  selectedRoomId: string | null;
}

export default function Rooms({ onSelectRoom, selectedRoomId }: RoomsProps) {
  const {
    data: rooms,
    error: fetchError,
    isLoading: isSWRLoading,
    mutate: mutateRooms,
  } = useSWR<RoomData[]>("liveblocksRooms", fetcher, {
    refreshInterval: 15_000,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
  });

  // Keep useTransition for managing pending state of *actions* (create, fork, delete, nuke)
  const [isPending, startTransition] = useTransition();

  const [newRoomName, setNewRoomName] = useState("");

  // State for Fork Dialog
  const [isForkDialogOpen, setIsForkDialogOpen] = useState(false);
  const [forkingRoomId, setForkingRoomId] = useState<string | null>(null);
  const [forkingRoomOriginalName, setForkingRoomOriginalName] =
    useState<string>("");
  const [newForkName, setNewForkName] = useState("");

  // Ref for the fork dialog input
  const forkNameInputRef = useRef<HTMLInputElement>(null);

  // Re-add Nuke Dialog state
  const [isNukeDialogOpen, setIsNukeDialogOpen] = useState(false);

  // State for Delete Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);
  const [deletingRoomName, setDeletingRoomName] = useState<string>("");

  // Handle fetch errors from SWR
  useEffect(() => {
    if (fetchError) {
      toast.error(fetchError.message || "Failed to load rooms");
      console.error("SWR fetch error:", fetchError);
    }
  }, [fetchError]);

  // Handler for creating a new room
  const handleCreateRoom = () => {
    if (!newRoomName.trim()) return;

    startTransition(async () => {
      const result = await createLiveblocksRoom(newRoomName.trim());

      if (result.success) {
        // Update SWR cache optimistically or revalidate
        // Optimistic update: add the new room immediately
        mutateRooms((currentRooms) => [...(currentRooms || []), result.data], {
          revalidate: false,
        }); // Avoid immediate revalidation if optimistic update is sufficient
        onSelectRoom(result.data.id);
        setNewRoomName("");
        toast.success(
          `Room '${result.data.metadata?.name || result.data.id}' created.`
        );
      } else {
        console.error("Failed to create room:", result.error);
        toast.error(result.error || "Failed to create room");
        // Optional: Trigger revalidation on error if needed
        // mutateRooms();
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
  };

  // Handles the actual forking when confirmed in the dialog
  const handleConfirmFork = () => {
    if (!forkingRoomId || !newForkName.trim()) return;

    startTransition(async () => {
      const result = await forkLiveblocksRoom(
        forkingRoomId,
        newForkName.trim()
      );

      if (result.success) {
        // Update SWR cache
        mutateRooms((currentRooms) => [...(currentRooms || []), result.data], {
          revalidate: false,
        });
        onSelectRoom(result.data.id);
        setIsForkDialogOpen(false);
        toast.success(
          `Room '${
            result.data.metadata?.name || result.data.id
          }' created from fork.`
        );
      } else {
        console.error("Failed to fork room:", result.error);
        toast.error(result.error || "Failed to fork room");
        // Refocus the input field on error, use setTimeout for timing
        setTimeout(() => {
          forkNameInputRef.current?.focus();
        }, 10); // Small delay
      }
    });
  };

  // Re-add Nuke handler
  const handleNukeRooms = () => {
    startTransition(async () => {
      let result;
      try {
        result = await nukeAllLiveblocksRooms();
      } catch (e: any) {
        console.error("Nuke action failed unexpectedly:", e);
        toast.error("An unexpected error occurred while nuking rooms.");
        setIsNukeDialogOpen(false);
        return;
      } finally {
        setIsNukeDialogOpen(false);
      }

      if (result.success) {
        // Update SWR cache to empty array
        mutateRooms([], { revalidate: false });
        onSelectRoom(null);
        let message = `Successfully deleted ${result.deletedCount} rooms.`;
        if (result.errors.length > 0) {
          message += ` Failed to delete ${result.errors.length}. See console.`;
          console.error("Nuke errors:", result.errors);
          toast.warning(message, { duration: 5000 });
        } else {
          toast.success(message);
        }
      } else {
        console.error("Failed to nuke rooms:", result.error);
        toast.error(`Failed to nuke rooms: ${result.error}`);
        // Optionally revalidate on failure
        mutateRooms();
      }
    });
  };

  // --- Delete Logic ---
  const openDeleteDialog = (roomId: string, roomName: string | undefined) => {
    setDeletingRoomId(roomId);
    setDeletingRoomName(roomName || roomId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingRoomId) return;

    const roomNameToDelete = deletingRoomName; // Capture name before state might change
    const roomIdToDelete = deletingRoomId;

    startTransition(async () => {
      const result = await deleteLiveblocksRoom(roomIdToDelete);

      if (result.success) {
        toast.success(`Room '${roomNameToDelete}' deleted.`);
        // Update SWR cache by filtering out the deleted room
        mutateRooms(
          (currentRooms) =>
            currentRooms?.filter((room) => room.id !== roomIdToDelete) || [],
          { revalidate: false }
        );
        // If the deleted room was selected, deselect it
        if (selectedRoomId === roomIdToDelete) {
          onSelectRoom(null);
        }
        setIsDeleteDialogOpen(false); // Close dialog on success
      } else {
        toast.error(
          result.error || `Failed to delete room '${roomNameToDelete}'.`
        );
        // Keep dialog open on error
        // Optionally revalidate on failure
        mutateRooms();
      }
    });
  };

  // Use isSWRLoading for the initial loading state
  if (isSWRLoading) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <LoadingSpinner className="h-6 w-6" />
      </div>
    );
  }

  // Use rooms directly from SWR data
  const currentRooms = rooms || []; // Default to empty array if data is undefined
  const noRooms = !isSWRLoading && currentRooms.length === 0;

  return (
    <div className="flex flex-col space-y-4">
      {/* --- Controls Area --- */}
      <div className="space-y-4 border-b pb-4">
        {/* Create New Room Section */}
        <div className="space-y-2">
          <h3 className="text-md font-semibold">Create New Room</h3>
          {/* Wrap input and button in a form */}
          <form
            className="flex space-x-2"
            onSubmit={(e) => {
              e.preventDefault(); // Prevent default page reload
              handleCreateRoom(); // Call existing handler
            }}
          >
            <Input
              type="text"
              placeholder="New room name..."
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="flex-grow"
              disabled={isPending}
              autoComplete="off"
            />
            {/* Button inside form defaults to type="submit" */}
            <Button
              type="submit" // Explicitly set type submit
              disabled={!newRoomName.trim() || isPending}
              size="sm"
            >
              {/* Show spinner only during the create action, not initial load */}
              {isPending && !forkingRoomId && !deletingRoomId ? (
                <LoadingSpinner className="mr-2 h-4 w-4" />
              ) : null}
              Create
            </Button>
          </form>
        </div>

        {/* --- Nuke Button/Dialog --- */}
        {/* Only show nuke if not loading AND there are rooms */}
        {!isSWRLoading && (
          <div className="mt-4 pt-4 border-t">
            <Dialog open={isNukeDialogOpen} onOpenChange={setIsNukeDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isPending || currentRooms.length === 0} // Disable if no rooms or action pending
                  className="w-auto"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" /> Nuke All Rooms
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you absolutely sure?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete
                    all Liveblocks rooms associated with this project&apos;s API
                    keys.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4">
                  <DialogClose asChild>
                    <Button variant="outline" disabled={isPending}>
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    variant="destructive"
                    onClick={handleNukeRooms}
                    disabled={isPending} // Disable during the nuke action
                  >
                    {isPending && isNukeDialogOpen ? ( // Show spinner only when nuke is pending
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                    ) : null}
                    Yes, Nuke Everything
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Use calculated noRooms */}
      {noRooms && !fetchError && <div>No rooms found.</div>}
      {fetchError && !isSWRLoading && (
        <div className="text-destructive">
          Error loading rooms: {fetchError.message}
        </div>
      )}
      {!noRooms && !fetchError && (
        <div className="flex flex-col space-y-2 border-t pt-4">
          <h2 className="mb-2 text-lg font-semibold">Available Rooms:</h2>
          {/* Loading/Empty state for list specifically */}
          {/* SWR handles the loading state, so we just check if rooms exist */}
          {currentRooms.length === 0 ? ( // Re-check after potential SWR loading state
            <div>No rooms found.</div>
          ) : (
            <ul className="flex flex-col space-y-1">
              {currentRooms.map((room: RoomData) => (
                <li key={room.id} className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectRoom(room.id)}
                    className={cn(
                      "flex-grow justify-start px-2 text-left",
                      selectedRoomId === room.id && "bg-accent font-medium"
                    )}
                    disabled={isPending} // Disable during any action
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
                        disabled={isPending} // Disable during any action
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
                      <form
                        onSubmit={(e) => {
                          e.preventDefault(); // Prevent page reload
                          handleConfirmFork(); // Call the existing confirm handler
                        }}
                      >
                        <DialogHeader>
                          <DialogTitle>Fork Room</DialogTitle>
                          <DialogDescription>
                            Create a new room based on &apos;
                            {forkingRoomOriginalName}&apos;. Enter a name for
                            the new room.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                              htmlFor="new-fork-name"
                              className="text-right"
                            >
                              New Name
                            </Label>
                            <Input
                              ref={forkNameInputRef}
                              id="new-fork-name"
                              value={newForkName}
                              onChange={(e) => setNewForkName(e.target.value)}
                              className="col-span-3"
                              disabled={isPending}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline" disabled={isPending}>
                              Cancel
                            </Button>
                          </DialogClose>
                          <Button
                            type="submit" // Set type to submit
                            onClick={handleConfirmFork} // Keep onClick for direct clicks
                            disabled={!newForkName.trim() || isPending} // Disable during any action
                          >
                            {/* Show spinner only when this specific fork is pending */}
                            {isPending &&
                            isForkDialogOpen &&
                            forkingRoomId === room.id ? (
                              <LoadingSpinner className="mr-2 h-4 w-4" />
                            ) : null}
                            Fork Room
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>

                  {/* --- Delete Button Trigger --- */}
                  <Dialog
                    open={isDeleteDialogOpen && deletingRoomId === room.id}
                    onOpenChange={setIsDeleteDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost" // Use ghost for less emphasis
                        size="icon-sm"
                        className="text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() =>
                          openDeleteDialog(
                            room.id,
                            room.metadata?.name as string
                          )
                        }
                        disabled={isPending} // Disable during any action
                        title={`Delete room '${
                          (room.metadata?.name as string) || room.id
                        }'`}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Room?</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete the room &apos;
                          {deletingRoomName}&apos;? This action cannot be
                          undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="mt-4">
                        <DialogClose asChild>
                          <Button variant="outline" disabled={isPending}>
                            Cancel
                          </Button>
                        </DialogClose>
                        <Button
                          variant="destructive"
                          onClick={handleConfirmDelete}
                          disabled={isPending} // Disable during any action
                        >
                          {/* Show spinner only when this specific delete is pending */}
                          {isPending &&
                          isDeleteDialogOpen &&
                          deletingRoomId === room.id ? (
                            <LoadingSpinner className="mr-2 h-4 w-4" />
                          ) : null}
                          Delete Room
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
