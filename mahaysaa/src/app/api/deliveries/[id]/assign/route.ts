import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, requireSession } from "@/lib/apiHelpers";

/** A driver claims an unassigned delivery job (nearest-job-first is handled client-side via GET /api/deliveries). */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession(["DRIVER"]);
    const driver = await prisma.driver.findUnique({ where: { userId: session.userId } });
    if (!driver) return jsonError(404, "Driver profile not found.");
    if (driver.status !== "APPROVED") return jsonError(403, "Your driver account is not approved yet.");
    if (!driver.isAvailable) return jsonError(400, "Set yourself as available before accepting jobs.");

    const delivery = await prisma.delivery.findUnique({ where: { id: params.id } });
    if (!delivery) return jsonError(404, "Delivery not found.");
    if (delivery.status !== "UNASSIGNED") return jsonError(409, "This delivery has already been claimed.");

    const updated = await prisma.delivery.update({
      where: { id: params.id },
      data: { driverId: driver.id, status: "ASSIGNED", assignedAt: new Date() },
    });
    await prisma.order.update({ where: { id: delivery.orderId }, data: { status: "DELIVERING" } });

    return NextResponse.json({ delivery: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
