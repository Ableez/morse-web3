import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function updateUser(userId, userData) {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const updatedUser = await db
      .update(users)
      .set({
        username: userData.username,
        email: userData.email || null,
        profileImage: userData.profileImage || null,
        updatedAt: new Date(),
        walletAddress: userData.walletAddress || null,
      })
      .where(eq(users.id, userId))
      .returning();

    if (updatedUser.length === 0) {
      throw new Error("User not found");
    }

    return updatedUser[0];
  } catch (error) {
    console.error("Error updating user:", error);
    throw new Error("Failed to update user");
  }
}
