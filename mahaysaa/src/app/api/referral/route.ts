import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateReferralCode } from "@/lib/referral";
import { handleApiError, jsonError, requireSession } from "@/lib/apiHelpers";
import { z } from "zod";

const schema = z.object({
  supplierId: z.string(),
  productId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["CUSTOMER"]);
    const { supplierId, productId } = schema.parse(await req.json());

    const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier || supplier.status !== "APPROVED") {
      return jsonError(404, "Supplier not found.");
    }

    const existing = await prisma.referralCode.findFirst({
      where: { customerId: session.userId, supplierId, productId, redeemed: false },
    });
    if (existing) {
      return NextResponse.json({ referralCode: existing });
    }

    const code = await generateReferralCode();
    const referralCode = await prisma.referralCode.create({
      data: { code, customerId: session.userId, supplierId, productId },
    });

    return NextResponse.json({ referralCode }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET() {
  try {
    const session = await requireSession(["CUSTOMER"]);
    const referralCodes = await prisma.referralCode.findMany({
      where: { customerId: session.userId },
      include: { supplier: { select: { businessName: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ referralCodes });
  } catch (err) {
    return handleApiError(err);
  }
}
