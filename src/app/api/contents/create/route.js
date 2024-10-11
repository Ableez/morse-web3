import { db } from "@/db";
import { contents } from "@/db/schema";
import { NextResponse } from "next/server";
import { v4 } from "uuid";

export async function POST(request) {
  try {
    const data = await request.json();
    const newContent = await db
      .insert(contents)
      .values({ id: v4(), ...data })
      .returning();
    return NextResponse.json(newContent[0]);
  } catch (error) {
    console.error("Error in content creation:", error);
    return NextResponse.json(
      { error: "Failed to create content" },
      { status: 500 }
    );
  }
}
