"use server";
import { db } from "@/db";
import { contents } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function getNFTs() {
  try {
    const nfts = await db.query.contents.findMany({
      with: {
        accesses: true,
        creator: true,
      },
      orderBy: [desc(contents.createdAt)],
    });

    return nfts;
  } catch (error) {
    console.error("Error fetching NFTs:", error);
    return null;
  }
}
