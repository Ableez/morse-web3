"use server";

import { db } from "@/db";
import { contents, contentAccess } from "@/db/schema";
import { desc, eq, not, like, sql, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function getNFTs(page = 1, pageSize = 9, search = "") {
  const { userId } = auth();

  try {
    const offset = (page - 1) * pageSize;

    let query = db
      .select({
        ...contents,
        isOwned: sql`CASE WHEN ${contentAccess.userId} = ${userId} THEN true ELSE false END`,
      })
      .from(contents)
      .leftJoin(
        contentAccess,
        and(
          eq(contents.id, contentAccess.contentId),
          eq(contentAccess.userId, userId)
        )
      )
      .limit(pageSize)
      .offset(offset)
      .orderBy(desc(contents.createdAt));

    if (search) {
      query = query.where(like(contents.title, `%${search}%`));
    }

    const nfts = await query.execute();

    const totalCount = await db
      .select({ count: sql`count(*)` })
      .from(contents)
      .where(search ? like(contents.title, `%${search}%`) : undefined)
      .execute();

    return {
      nfts: nfts.map((nft) => ({
        ...nft,
        isOwned: Boolean(nft.isOwned),
      })),
      totalPages: Math.ceil(totalCount[0].count / pageSize),
      currentPage: page,
    };
  } catch (error) {
    console.error("Error fetching NFTs:", error);
    return null;
  }
}
