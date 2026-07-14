import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, requireSession } from "@/lib/apiHelpers";
import { z } from "zod";

export async function GET() {
  try {
    const session = await requireSession(["CUSTOMER"]);
    const favorites = await prisma.favorite.findMany({
      where: { userId: session.userId },
      include: { product: { include: { supplier: true, category: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ favorites });
  } catch (err) {
    return handleApiError(err);
  }
}

const schema = z.object({ productId: z.string() });

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["CUSTOMER"]);
    const { productId } = schema.parse(await req.json());

    const existing = await prisma.favorite.findUnique({
      where: { userId_productId: { userId: session.userId, productId } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ favorited: false });
    }

    await prisma.favorite.create({ data: { userId: session.userId, productId } });
    return NextResponse.json({ favorited: true });
  } catch (err) {
    return handleApiError(err);
  }
}
