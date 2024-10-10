import { BASE_URL } from "../base-url";
import { inngest } from "./client";

// Function to handle user creation
export const createUserFunction = inngest.createFunction(
  { id: "morse-create-user" },
  { event: "morse/user.created" },
  async ({ event }) => {
    try {
      console.log({
        id: event.data.id,
        username: event.data.username,
        email: event.data.email_addresses[0]?.email_address || "",
        profileImage: event.data.image_url || "",
        primary_web3_wallet_id: event.data.primary_web3_wallet_id || "",
      });
      const resp = await fetch(`${BASE_URL || ""}/api/user/create`, {
        method: "POST",
        body: JSON.stringify({
          id: event.data.id,
          username: event.data.username,
          email: event.data.email_addresses[0]?.email_address || "",
          profileImage: event.data.image_url || "",
          primary_web3_wallet_id: event.data.primary_web3_wallet_id || "",
        }),
      });

      console.log("User created:", {
        status: "success",
        user: await resp.json(),
      });
      // return
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
      const response = await fetch(
        `${BASE_URL || ""}/api/user/update/{event.data.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            username: event.data.username,
            email: event.data.email_addresses[0].email_address,
            profileImage: event.data.image_url,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update user: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("User updated:", result);
      return result;
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
      const response = await fetch(
        `${BASE_URL || ""}/api/user/delete/${event.data.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete user: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("User deleted:", result);
      return result;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }
);

// Export all functions
const funcs = [createUserFunction, updateUserFunction, deleteUserFunction];
export default funcs;
