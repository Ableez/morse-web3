"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { getNFTSERVERONLY } from "./getnft_action";
import { db } from "@/db";
import { contents } from "@/db/schema";
import { desc, eq, not } from "drizzle-orm";


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

export async function getUserNFTs(userId) {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const userNfts = await db.query.contents.findMany({
      where: eq(contents.creatorId, userId),
      with: {
        accesses: true,
        creator: true,
      },
      orderBy: [desc(contents.createdAt)],
    });

    return userNfts;
  } catch (error) {
    console.error("Error fetching user NFTs:", error);
    throw new Error("Failed to fetch user NFTs");
  }
}
