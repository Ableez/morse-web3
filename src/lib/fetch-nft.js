"use server";

import { auth } from "@clerk/nextjs/server";
import { getNFTSERVERONLY } from "./getnft_action";

export async function getNFTs() {
  try {
    const user = auth().userId;

    if (!user) {
      return null;
    }
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND}/api/contents/nfts/${user}`
    );
    if (!res.ok) {
      throw new Error("Failed to fetch NFTs");
    }

    return res.json();
  } catch (error) {
    console.error("ERROR FETCHING NFTS", error);
  }
}

export async function getNFTDetails(id) {
  try {
    const user = auth().userId;

    if (!user) {
      return null;
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND}/api/contents/detail/${id}`
    );
    if (!res.ok) {
      throw new Error("Failed to fetch NFTs");
    }

    return res.json();
  } catch (error) {
    console.error("ERROR FETCHING NFTS", error);
  }
}

export const fetchContent = async (cid) => {
  const response = await getNFTSERVERONLY(cid);
  return response;
};
