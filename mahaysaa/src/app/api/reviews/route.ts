import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, requireSession } from "@/lib/apiHelpers";
import { z } from "zod";

const schema = z.object({
  orderId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["CUSTOMER"]);
    const data = schema.parse(await req.json());

    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: { items: true },
    });
    if (!order || order.customerId !== session.userId) return jsonError(404, "Order not found.");
    if (order.status !== "DELIVERED") return jsonError(400, "You can only review delivered orders.");

    const review = await prisma.review.create({
      data: {
        userId: session.userId,
        supplierId: order.supplierId,
        productId: order.items[0]?.productId,
        orderId: order.id,
        rating: data.rating,
        comment: data.comment,
        verified: true,
      },
    });

    const stats = await prisma.review.aggregate({
      where: { supplierId: order.supplierId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await prisma.supplier.update({
      where: { id: order.supplierId },
      data: { ratingAvg: stats._avg.rating ?? 0, ratingCount: stats._count.rating },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
