import { createUser } from "@/lib/create-user-action";
import { inngest } from "./client";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { updateUser } from "@/lib/update-user-action";

// Function to handle user creation
export const createUserFunction = inngest.createFunction(
  { id: "morse-create-user" },
  { event: "morse/user.created" },
  async ({ event }) => {
    try {
      const created = await createUser({
        id: event.data.id,
        username: event.data.username,
        email: event.data.email_addresses[0]?.email_address || "",
        profileImage: event.data.image_url || "",
        primary_web3_wallet_id: event.data.primary_web3_wallet_id || "",
      });

      console.log("User created:", {
        status: "success",
        user: created,
      });

      return created;
    } catch (error) {
      console.error("Error creating user:", error);
      return { status: "error", message: "Failed to create user" };
    }
  }
);

// Function to handle user updates
export const updateUserFunction = inngest.createFunction(
  { id: "morse-update-user" },
  { event: "morse/user.updated" },
  async ({ event }) => {
    console.log("User update event received:", event);

    try {
      const updated = await updateUser(event.data.id, {
        username: event.data.username,
        email: event.data.email_addresses[0].email_address,
        profileImage: event.data.image_url,
        walletAddress: event.data.primary_web3_wallet_id,
      });

      if (!updated) {
        return { status: "error", message: "User not found" };
      }

      console.log("User updated:", updated);
      return updated;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }
);

// Function to handle user deletion
export const deleteUserFunction = inngest.createFunction(
  { id: "morse-delete-user" },
  { event: "morse/user.deleted" },
  async ({ event }) => {
    console.log("User deletion event received:", event);

    try {
      const response = await db
        .delete(users)
        .where(eq(users.id, event.data.id));

      console.log("User deletion response:", response);

      console.log("User deleted:", response);
      return response;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }
);

// Export all functions
export const functions = {
  createUserFunction,
  updateUserFunction,
  deleteUserFunction,
};
