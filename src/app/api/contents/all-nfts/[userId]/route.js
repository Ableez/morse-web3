import { db } from "@/db";
import { contents } from "@/db/schema";
import { not, eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { userId } = params;

    if (!userId || userId === 'guest') {
      // Fetch all NFTs when there's no user or for guest users
      const nfts = await db.query.contents.findMany({
        with: {
          accesses: true,
          creator: true,
        },
        orderBy: [desc(contents.createdAt)],
      });

      return NextResponse.json({ status: "success", nfts }, { status: 200 });
    }

    // Existing logic for authenticated users
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
      { status: "error", message: "Failed to fetch NFTs", nfts: [] },
      { status: 500 }
    );
  }
}
