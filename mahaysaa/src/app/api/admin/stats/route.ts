import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, requireSession } from "@/lib/apiHelpers";

export async function GET() {
  try {
    await requireSession(["ADMIN", "REGIONAL_ADMIN", "FINANCE_ADMIN", "SUPPORT_ADMIN"]);

    const [customers, suppliers, drivers, orders, commissions, driverEarnings] = await Promise.all([
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.supplier.count(),
      prisma.driver.count(),
      prisma.order.count(),
      prisma.commission.aggregate({ _sum: { commissionAmount: true } }),
      prisma.driverEarning.aggregate({ _sum: { commissionAmount: true } }),
    ]);

    const pendingSuppliers = await prisma.supplier.count({ where: { status: "PENDING" } });
    const pendingDrivers = await prisma.driver.count({ where: { status: "PENDING" } });

    return NextResponse.json({
      customers,
      suppliers,
      drivers,
      orders,
      pendingSuppliers,
      pendingDrivers,
      totalCommissionRevenue:
        (commissions._sum.commissionAmount ?? 0) + (driverEarnings._sum.commissionAmount ?? 0),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
