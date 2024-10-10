import { db } from "@/db";
import { contents } from "@/db/schema";
import { not, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { status: "error", message: "User ID is required" },
        { status: 400 }
      );
    }

    const nfts = await db.query.contents.findMany({
      where: not(eq(contents.creatorId, userId)),
      with: {
        accesses: true,
        creator: true,
      },
    });

    return NextResponse.json({ status: "success", nfts }, { status: 200 });
  } catch (error) {
    console.error("Error fetching NFTs:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch NFTs" },
      { status: 500 }
    );
  }
}
