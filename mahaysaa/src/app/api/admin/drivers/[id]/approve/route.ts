import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, requireSession } from "@/lib/apiHelpers";
import { z } from "zod";

const schema = z.object({ approve: z.boolean() });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireSession(["ADMIN", "REGIONAL_ADMIN"]);
    const { approve } = schema.parse(await req.json());
    const driver = await prisma.driver.update({
      where: { id: params.id },
      data: { status: approve ? "APPROVED" : "REJECTED" },
    });
    await prisma.notification.create({
      data: {
        userId: driver.userId,
        title: approve ? "Driver account approved" : "Driver account rejected",
        body: approve
          ? "Congratulations! Your MAHAYSAA driver account has been approved. You can now accept delivery jobs."
          : "Your MAHAYSAA driver application was not approved. Please contact support for details.",
        type: "GENERAL",
      },
    });
    return NextResponse.json({ driver });
  } catch (err) {
    return handleApiError(err);
  }
}
