import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  try {
    const { userId } = params;
    const id = userId;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { status: "error", message: "User ID is required" },
        { status: 400 }
      );
    }

    const updatedUser = await db
      .update(users)
      .set({
        username: body.username,
        email: body.email || null,
        profileImage: body.profileImage || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json(
        { status: "error", message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { status: "success", user: updatedUser[0] },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to update user" },
      { status: 500 }
    );
  }
}
