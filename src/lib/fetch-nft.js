"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { getNFTSERVERONLY } from "./getnft_action";
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

export async function getNFTDetails(id) {
  try {
    const content = await db.query.contents.findFirst({
      where: eq(contents.id, id),
      with: {
        accesses: true,
        creator: true,
      },
    });

    return content;
  } catch (error) {
    console.error("ERROR FETCHING NFTS", error);
  }
}

export const fetchContent = async (cid) => {
  const response = await getNFTSERVERONLY(cid);
  console.log(response);
  return response;
};
