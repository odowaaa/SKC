import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/apiHelpers";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: params.id },
      include: {
        products: { where: { isActive: true }, include: { category: true } },
        reviews: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      },
    });
    if (!supplier) return jsonError(404, "Supplier not found.");
    return NextResponse.json({ supplier });
  } catch (err) {
    return handleApiError(err);
  }
}
