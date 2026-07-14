import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, requireSession } from "@/lib/apiHelpers";
import { calculateDriverCommission } from "@/lib/commission";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession(["DRIVER"]);
    const driver = await prisma.driver.findUnique({ where: { userId: session.userId } });
    if (!driver) return jsonError(404, "Driver profile not found.");

    const delivery = await prisma.delivery.findUnique({ where: { id: params.id } });
    if (!delivery || delivery.driverId !== driver.id) return jsonError(404, "Delivery not found.");
    if (delivery.status === "DELIVERED") return jsonError(409, "Delivery already completed.");

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.delivery.update({
        where: { id: params.id },
        data: { status: "DELIVERED", deliveredAt: new Date() },
      });

      await tx.order.update({ where: { id: delivery.orderId }, data: { status: "DELIVERED" } });

      const { commissionPct, commissionAmount, netEarning } = calculateDriverCommission(delivery.fee);
      await tx.driverEarning.create({
        data: {
          deliveryId: delivery.id,
          driverId: driver.id,
          grossFee: delivery.fee,
          commissionPct,
          commissionAmount,
          netEarning,
        },
      });

      return updated;
    });

    return NextResponse.json({ delivery: result });
  } catch (err) {
    return handleApiError(err);
  }
}
