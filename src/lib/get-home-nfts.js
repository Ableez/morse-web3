"use server";

import { db } from "@/db";
import { contents } from "@/db/schema";
import { desc, eq, not } from "drizzle-orm";

export async function getNFTs(userId) {
  try {
    if (!userId || userId === "guest") {
      // Fetch all NFTs when there's no user or for guest users
      const nfts = await db.query.contents.findMany({
        with: {
          accesses: true,
          creator: true,
        },
        orderBy: [desc(contents.createdAt)],
      });

      return nfts;
    }

    // Existing logic for authenticated users
    const nfts = await db.query.contents.findMany({
      where: not(eq(contents.creatorId, userId)),
      with: {
        accesses: true,
        creator: true,
      },
    });

    return nfts;
  } catch (error) {
    console.error("Error fetching NFTs:", error);
    return null;
  }
}
