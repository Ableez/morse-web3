import { db } from "@/db";
import { contents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { status: "error", message: "Content ID is required" },
        { status: 400 }
      );
    }

    const updatedContent = await db
      .update(contents)
      .set({
        title: body.title,
        description: body.description,
        priceETH: body.priceETH,
        priceUSD: body.priceUSD,
        coverImage: body.coverImage,
        updatedAt: new Date(),
      })
      .where(eq(contents.id, id))
      .returning();

    if (updatedContent.length === 0) {
      return NextResponse.json(
        { status: "error", message: "Content not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { status: "success", content: updatedContent[0] },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating content:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to update content" },
      { status: 500 }
    );
  }
}
