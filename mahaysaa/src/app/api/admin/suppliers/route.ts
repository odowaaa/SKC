import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, requireSession } from "@/lib/apiHelpers";

export async function GET() {
  try {
    await requireSession(["ADMIN", "REGIONAL_ADMIN", "SUPPORT_ADMIN"]);
    const suppliers = await prisma.supplier.findMany({
      include: { agreement: true, user: { select: { name: true, phone: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ suppliers });
  } catch (err) {
    return handleApiError(err);
  }
}
