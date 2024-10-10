import { db } from "@/db";
import { contents } from "@/db/schema";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request) {
  try {
    const body = await request.json();

    const newCt = {
      id: crypto.randomUUID(),
      creatorId: body.creatorId,
      title: body.title,
      tokenId: body.tokenId,
      description: body.description,
      priceETH: body.priceETH,
      priceUSD: body.priceUSD,
      coverImage: "https://g-fvxujch8ow7.vusercontent.net/placeholder.svg",
      creatorAddress: body.creatorAddress,
    };

    const newContent = await db.insert(contents).values(newCt).returning();

    return NextResponse.json({ data: newContent[0], ok: true }, { status: 201 });
  } catch (error) {
    console.error("Error in content creation:", error);
    return NextResponse.json({ data: null, ok: false }, { status: 500 });
  }
}