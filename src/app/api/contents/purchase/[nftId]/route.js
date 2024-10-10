import { db } from "@/db";
import { contentAccess, contents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  try {
    const { nftId } = params;
    const id = nftId;
    const { userId } = await request.json();
    const content = await db.select().from(contents).where(eq(contents.id, id));

    if (!content[0]) throw new Error("Content not found");

    const newAccess = await db
      .insert(contentAccess)
      .values({
        id: crypto.randomUUID(),
        contentId: id,
        userId: userId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
      })
      .returning();

    return newAccess[0];
  } catch (error) {
    console.error("Error fetching NFT:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch NFT" },
      { status: 500 }
    );
  }
}
