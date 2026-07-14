import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, requireSession } from "@/lib/apiHelpers";
import { distanceKm } from "@/lib/geo";

export async function GET() {
  try {
    const session = await requireSession(["DRIVER"]);
    const driver = await prisma.driver.findUnique({ where: { userId: session.userId } });
    if (!driver) return jsonError(404, "Driver profile not found.");

    const myJobs = await prisma.delivery.findMany({
      where: { driverId: driver.id },
      include: { order: { include: { supplier: true, items: { include: { product: true } } } } },
      orderBy: { createdAt: "desc" },
    });

    const openJobs = await prisma.delivery.findMany({
      where: { status: "UNASSIGNED" },
      include: { order: { include: { supplier: true, items: { include: { product: true } } } } },
      orderBy: { createdAt: "asc" },
      take: 30,
    });

    const sortedOpenJobs =
      driver.currentLat != null && driver.currentLng != null
        ? openJobs
            .map((job) => ({
              ...job,
              distanceFromDriverKm:
                job.pickupLat != null && job.pickupLng != null
                  ? distanceKm(driver.currentLat!, driver.currentLng!, job.pickupLat, job.pickupLng)
                  : null,
            }))
            .sort((a, b) => (a.distanceFromDriverKm ?? Infinity) - (b.distanceFromDriverKm ?? Infinity))
        : openJobs.map((job) => ({ ...job, distanceFromDriverKm: null }));

    return NextResponse.json({ myJobs, openJobs: sortedOpenJobs });
  } catch (err) {
    return handleApiError(err);
  }
}
