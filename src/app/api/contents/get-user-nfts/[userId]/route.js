import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { contents } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request, { params }) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { status: "error", message: "User ID is required" },
        { status: 400 }
      );
    }

    const userNfts = await db.query.contents.findMany({
      where: eq(contents.creatorId, userId),
      with: {
        accesses: true,
        creator: true,
      },
    });

    return NextResponse.json(
      { status: "success", nfts: userNfts },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user NFTs:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch user NFTs" },
      { status: 500 }
    );
  }
}
