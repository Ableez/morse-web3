import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request, { params }) {
  const { nftId } = params;

  const content = await db.query.contents.findFirst({
    where: eq(contents.id, nftId),
    with: {
      accesses: true,
      creator: true,
    },
  });

  if (!content) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 });
  }

  return NextResponse.json(content);
}