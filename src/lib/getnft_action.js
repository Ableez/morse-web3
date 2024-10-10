

export async function getNFTSERVERONLY(cid) {
  try {
    const response = await fetch(
      `https://${process.env.PINATA_API_GATEWAY_URL}/${cid}?pinataGatewayToken=${process.env.PINATA_GATEWAY_KEY}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log(response);

    const file = await response.blob();
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const contentType = response.headers.get("content-type");

    return { file, base64, contentType };
  } catch (error) {
    console.error("Error fetching content:", error);
  }
}
