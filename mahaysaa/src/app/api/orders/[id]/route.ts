import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, requireSession } from "@/lib/apiHelpers";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PREPARING",
    "READY_FOR_DELIVERY",
    "DELIVERING",
    "DELIVERED",
    "CANCELLED",
  ]),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: { include: { product: true } },
        supplier: true,
        delivery: { include: { driver: true } },
        commission: true,
        customer: { select: { name: true, phone: true } },
      },
    });
    if (!order) return jsonError(404, "Order not found.");
    if (
      order.customerId !== session.userId &&
      order.supplier.userId !== session.userId &&
      !["ADMIN", "REGIONAL_ADMIN", "FINANCE_ADMIN", "SUPPORT_ADMIN"].includes(session.role)
    ) {
      return jsonError(403, "You do not have access to this order.");
    }
    return NextResponse.json({ order });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession(["SUPPLIER", "ADMIN"]);
    const { status } = patchSchema.parse(await req.json());

    const order = await prisma.order.findUnique({ where: { id: params.id }, include: { supplier: true } });
    if (!order) return jsonError(404, "Order not found.");
    if (session.role === "SUPPLIER" && order.supplier.userId !== session.userId) {
      return jsonError(403, "You do not have access to this order.");
    }

    const updated = await prisma.order.update({ where: { id: params.id }, data: { status } });
    return NextResponse.json({ order: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
