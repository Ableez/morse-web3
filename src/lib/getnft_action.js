"server only";

export async function getNFTSERVERONLY(cid) {
  try {
    const response = await fetch(
      `https://${process.env.PINATA_API_GATEWAY}/${cid}?pinataGatewayToken=${process.env.PINATA_GATEWAY_KEY}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const contentType = response.headers.get("content-type");

    return { base64, contentType };
  } catch (error) {
    console.error("Error fetching content:", error);
    throw new Error("Failed to fetch content");
  }
}
