import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/apiHelpers";

/**
 * Unified search across products and suppliers. Supports simple natural-language
 * queries in Somali or English by matching against both name fields.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();
    const category = searchParams.get("category");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sort = searchParams.get("sort") ?? "newest";

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(category ? { category: { slug: category } } : {}),
        ...(minPrice || maxPrice
          ? {
              price: {
                ...(minPrice ? { gte: parseFloat(minPrice) } : {}),
                ...(maxPrice ? { lte: parseFloat(maxPrice) } : {}),
              },
            }
          : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { nameSo: { contains: q } },
                { brand: { contains: q } },
                { description: { contains: q } },
                { supplier: { businessName: { contains: q } } },
                { category: { name: { contains: q } } },
                { category: { nameSo: { contains: q } } },
              ],
            }
          : {}),
      },
      include: {
        supplier: { select: { id: true, businessName: true, city: true, ratingAvg: true } },
        category: { select: { name: true, nameSo: true, slug: true } },
      },
      orderBy:
        sort === "price_asc"
          ? { price: "asc" }
          : sort === "price_low_high"
          ? { price: "asc" }
          : sort === "price_high_low"
          ? { price: "desc" }
          : { createdAt: "desc" },
      take: 60,
    });

    const suppliers = q
      ? await prisma.supplier.findMany({
          where: { status: "APPROVED", businessName: { contains: q } },
          take: 20,
        })
      : [];

    return NextResponse.json({ products, suppliers });
  } catch (err) {
    return handleApiError(err);
  }
}
