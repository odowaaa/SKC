import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, requireSession } from "@/lib/apiHelpers";

export async function GET() {
  try {
    const session = await requireSession(["SUPPLIER"]);
    const supplier = await prisma.supplier.findUnique({
      where: { userId: session.userId },
      include: {
        agreement: true,
        products: { orderBy: { createdAt: "desc" } },
        orders: {
          include: { items: true, commission: true, customer: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
        commissions: true,
      },
    });
    if (!supplier) return jsonError(404, "Supplier profile not found.");

    const revenue = supplier.orders.reduce((sum, o) => sum + o.total, 0);
    const totalCommission = supplier.commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
    const payout = supplier.commissions.reduce((sum, c) => sum + c.supplierPayout, 0);

    return NextResponse.json({ supplier, totals: { revenue, totalCommission, payout } });
  } catch (err) {
    return handleApiError(err);
  }
}
