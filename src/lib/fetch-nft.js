"use server";

import { auth } from "@clerk/nextjs/server";

export async function getNFTs() {
  try {
    const user = auth().userId;

    if (!user) {
      return null;
    }
    const res = await fetch(`http://localhost:3030/api/contents/nfts/${user}`);
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

    const res = await fetch(`http://localhost:3030/api/contents/detail/${id}`);
    if (!res.ok) {
      throw new Error("Failed to fetch NFTs");
    }

    return res.json();
  } catch (error) {
    console.error("ERROR FETCHING NFTS", error);
  }
}
