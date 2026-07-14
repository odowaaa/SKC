import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, requireSession } from "@/lib/apiHelpers";
import { z } from "zod";

const schema = z.object({ approve: z.boolean() });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireSession(["ADMIN", "REGIONAL_ADMIN"]);
    const { approve } = schema.parse(await req.json());
    const supplier = await prisma.supplier.update({
      where: { id: params.id },
      data: { status: approve ? "APPROVED" : "REJECTED" },
    });
    await prisma.notification.create({
      data: {
        userId: supplier.userId,
        title: approve ? "Supplier account approved" : "Supplier account rejected",
        body: approve
          ? "Congratulations! Your MAHAYSAA supplier account has been approved. You can now add products."
          : "Your MAHAYSAA supplier application was not approved. Please contact support for details.",
        type: "GENERAL",
      },
    });
    return NextResponse.json({ supplier });
  } catch (err) {
    return handleApiError(err);
  }
}
