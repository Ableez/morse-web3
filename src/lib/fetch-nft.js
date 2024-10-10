"use server";

import { auth } from "@clerk/nextjs/server";
import { getNFTSERVERONLY } from "./getnft_action";

export async function getNFTs() {
  try {
    const user = auth().userId;

    const res = await fetch(
      `${
        process.env.NODE_ENV === "development"
          ? "http://localhost:3000"
          : process.env.BASE_URL
      }/api/contents/all-nfts/${user || 'guest'}`
    );
    if (!res.ok) {
      throw new Error("Failed to fetch NFTs");
    }

    return res.json();
  } catch (error) {
    console.error("ERROR FETCHING NFTS", error);
    return { status: "error", message: "Failed to fetch NFTs", nfts: [] };
  }
}

export async function getNFTDetails(id) {
  try {
    const user = auth().userId;

    if (!user) {
      return null;
    }

    const res = await fetch(
      `${
        process.env.NODE_ENV === "development"
          ? "http://localhost:3000"
          : process.env.BASE_URL
      }/api/contents/get-nft-info/${id}`
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
  console.log(response);
  return response;
};
