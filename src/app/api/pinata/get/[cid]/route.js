import { NextResponse } from "next/server";

export const GET = async (request, { params }) => {
  try {
    const cid = params.cid;

    const fileBlob = await fetch(`${process.env.PINATA_API_GATEWAY}/${cid}`);

    console.log("URL", fileBlob);
    return NextResponse.json({ url: fileBlob });
  } catch (e) {
    console.log(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};
