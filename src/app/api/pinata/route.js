import { NextResponse } from "next/server";
import { pinata } from "../../../../utils/pinata";

export const runtime = "edge"; // Add this line

export async function POST(request) {
  try {
    const data = await request.formData();
    const file = data.get("file");
    const ownerAddress = data.get("ownerAddress");

    const uploadData = await pinata.upload.file(file, {
      metadata: {
        name: file.name,
        keyValues: {
          ownerAddress,
        },
      },
    });

    return NextResponse.json(uploadData, { status: 200 });
  } catch (e) {
    console.log(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
