import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();

    const userAlreadyExists = await db
      .select()
      .from(users)
      .where(eq(users.id, body.id))
      .limit(1);

    if (userAlreadyExists.length > 0) {
      return NextResponse.json({ status: "error", message: "User already exists" }, { status: 400 });
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

    return NextResponse.json({ status: "success", user: newUser[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ status: "error", message: "Failed to create user" }, { status: 500 });
  }
}

