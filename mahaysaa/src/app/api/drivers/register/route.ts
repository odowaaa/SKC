import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { driverRegisterSchema } from "@/lib/validation";
import { handleApiError, jsonError, requireSession } from "@/lib/apiHelpers";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["DRIVER"]);

    const existing = await prisma.driver.findUnique({ where: { userId: session.userId } });
    if (existing) return jsonError(409, "You have already registered a driver profile.");

    const body = await req.json();
    const data = driverRegisterSchema.parse(body);

    const driver = await prisma.driver.create({
      data: {
        userId: session.userId,
        fullName: data.fullName,
        nationalId: data.nationalId,
        licenseNumber: data.licenseNumber,
        insuranceInfo: data.insuranceInfo,
        bankAccount: data.bankAccount,
        mobileMoney: data.mobileMoney,
        workingHours: data.workingHours,
        status: "PENDING",
        vehicles: {
          create: {
            type: data.vehicleType,
            plate: data.plate,
            capacityKg: data.capacityKg,
          },
        },
      },
      include: { vehicles: true },
    });

    return NextResponse.json({ driver }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
