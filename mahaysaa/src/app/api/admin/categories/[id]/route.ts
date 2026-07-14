import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, requireSession } from "@/lib/apiHelpers";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  nameSo: z.string().min(2).optional(),
  commissionPct: z.number().min(0).max(100).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireSession(["ADMIN", "FINANCE_ADMIN"]);
    const data = patchSchema.parse(await req.json());
    const category = await prisma.category.update({ where: { id: params.id }, data });
    return NextResponse.json({ category });
  } catch (err) {
    return handleApiError(err);
  }
}
