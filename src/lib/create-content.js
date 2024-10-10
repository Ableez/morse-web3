import { v4 } from "uuid";

export const createContent = async (data) => {
  try {
    const newCt = {
      id: v4(),
      creatorId: data.creatorId,
      title: data.title,
      tokenId: data.tokenId,
      description: data.description,
      priceETH: data.priceETH,
      priceUSD: data.priceUSD,
      coverImage: "/placeholder.svg",
      creatorAddress: data.creatorAddress,
    };

    const response = await fetch("/api/contents/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newCt),
    });

    if (!response.ok) {
      throw new Error("Failed to create content");
    }

    const newContent = await response.json();
    return newContent;
  } catch (error) {
    console.error("Error in content creation:", error);
    return null;
  }
};
