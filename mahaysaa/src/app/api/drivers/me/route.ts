import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, requireSession } from "@/lib/apiHelpers";
import { z } from "zod";

export async function GET() {
  try {
    const session = await requireSession(["DRIVER"]);
    const driver = await prisma.driver.findUnique({
      where: { userId: session.userId },
      include: { vehicles: true, earnings: { orderBy: { createdAt: "desc" } } },
    });
    if (!driver) return jsonError(404, "Driver profile not found.");

    const totalNet = driver.earnings.reduce((sum, e) => sum + e.netEarning, 0);
    const totalCommission = driver.earnings.reduce((sum, e) => sum + e.commissionAmount, 0);

    return NextResponse.json({ driver, totals: { totalNet, totalCommission } });
  } catch (err) {
    return handleApiError(err);
  }
}

const patchSchema = z.object({
  isAvailable: z.boolean().optional(),
  currentLat: z.number().optional(),
  currentLng: z.number().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession(["DRIVER"]);
    const data = patchSchema.parse(await req.json());
    const driver = await prisma.driver.update({ where: { userId: session.userId }, data });
    return NextResponse.json({ driver });
  } catch (err) {
    return handleApiError(err);
  }
}
