import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { productSchema } from "@/lib/validation";
import { handleApiError, requireSession } from "@/lib/apiHelpers";
import { jsonError } from "@/lib/apiHelpers";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const supplierId = searchParams.get("supplierId");
    const q = searchParams.get("q");

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(category ? { category: { slug: category } } : {}),
        ...(supplierId ? { supplierId } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { nameSo: { contains: q } },
                { brand: { contains: q } },
              ],
            }
          : {}),
      },
      include: {
        supplier: { select: { id: true, businessName: true, city: true, ratingAvg: true } },
        category: { select: { name: true, nameSo: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 60,
    });

    return NextResponse.json({ products });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["SUPPLIER"]);
    const supplier = await prisma.supplier.findUnique({ where: { userId: session.userId } });
    if (!supplier) return jsonError(404, "Supplier profile not found.");
    if (supplier.status !== "APPROVED") {
      return jsonError(403, "Your supplier account is not approved yet.");
    }

    const body = await req.json();
    const data = productSchema.parse(body);

    const product = await prisma.product.create({
      data: { ...data, supplierId: supplier.id },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
