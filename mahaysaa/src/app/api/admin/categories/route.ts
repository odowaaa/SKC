import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, requireSession } from "@/lib/apiHelpers";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2),
  nameSo: z.string().min(2),
  slug: z.string().min(2),
  commissionPct: z.number().min(0).max(100).default(5),
});

export async function GET() {
  try {
    await requireSession(["ADMIN", "REGIONAL_ADMIN", "FINANCE_ADMIN"]);
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ categories });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSession(["ADMIN"]);
    const data = createSchema.parse(await req.json());
    const category = await prisma.category.create({ data });
    return NextResponse.json({ category }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
