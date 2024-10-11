import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createUser(body) {
  try {
    const userAlreadyExists = await db
      .select()
      .from(users)
      .where(eq(users.id, body.id))
      .limit(1);

    if (userAlreadyExists.length > 0) {
      return null;
    }

    const newUser = await db
      .insert(users)
      .values({
        id: body.id,
        username: body.username,
        email: body.email || null,
        profileImage: body.profileImage || null,
        walletAddress: body.primary_web3_wallet_id,
      })
      .returning();

    return newUser[0];
  } catch (error) {
    console.error("Error creating user:", error);
    return null;
  }
}
