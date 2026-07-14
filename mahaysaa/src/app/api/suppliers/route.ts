import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/apiHelpers";
import { distanceKm } from "@/lib/geo";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    const suppliers = await prisma.supplier.findMany({
      where: {
        status: "APPROVED",
        ...(q ? { businessName: { contains: q } } : {}),
      },
      include: { _count: { select: { products: true } } },
      orderBy: { ratingAvg: "desc" },
      take: 60,
    });

    let result = suppliers.map((s) => ({ ...s, distanceKm: null as number | null }));
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      result = result
        .map((s) => ({
          ...s,
          distanceKm: s.gpsLat && s.gpsLng ? distanceKm(userLat, userLng, s.gpsLat, s.gpsLng) : null,
        }))
        .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    }

    return NextResponse.json({ suppliers: result });
  } catch (err) {
    return handleApiError(err);
  }
}
