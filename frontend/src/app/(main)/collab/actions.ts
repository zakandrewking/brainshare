"use server"; // Mark this module as containing Server Actions

import { Liveblocks, RoomData } from "@liveblocks/node";

// Export RoomData type
export type { RoomData };

/*
// Remove the custom interface, use RoomData directly
export interface LiveblocksRoomData {
// ... removed interface ...
}
*/

// Define the possible return types for the action using RoomData
interface ActionResultSuccess {
  success: true;
  data: RoomData[];
}
interface ActionResultError {
  success: false;
  error: string;
}
type GetRoomsResult = ActionResultSuccess | ActionResultError;

// Initialize Liveblocks Node client
const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function getLiveblocksRooms(): Promise<GetRoomsResult> {
  // Ensure the secret key is configured
  if (!process.env.LIVEBLOCKS_SECRET_KEY) {
    console.error("LIVEBLOCKS_SECRET_KEY is not set.");
    return { success: false, error: "Server configuration error." };
  }

  try {
    // Fetch rooms using the Node client. It throws on error.
    const roomsPage = await liveblocks.getRooms();

    // Assuming roomsPage has a 'data' property containing the array of rooms
    // Adjust if the structure is different (e.g., roomsPage.data or just roomsPage)
    const roomsData = roomsPage.data;

    if (!roomsData) {
      console.error(
        "Liveblocks getRooms returned unexpected structure:",
        roomsPage
      );
      return {
        success: false,
        error: "Failed to parse rooms data from Liveblocks.",
      };
    }

    // Return the data directly without casting
    return { success: true, data: roomsData };
  } catch (err: any) {
    console.error("Liveblocks getRooms failed:", err);
    return {
      success: false,
      error: err.message || "Failed to fetch rooms from Liveblocks.",
    };
  }
}
