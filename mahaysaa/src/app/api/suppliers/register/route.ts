import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { supplierRegisterSchema } from "@/lib/validation";
import { handleApiError, jsonError, requireSession } from "@/lib/apiHelpers";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["SUPPLIER"]);

    const existing = await prisma.supplier.findUnique({ where: { userId: session.userId } });
    if (existing) return jsonError(409, "You have already registered a supplier profile.");

    const body = await req.json();
    const data = supplierRegisterSchema.parse(body);
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";

    const supplier = await prisma.supplier.create({
      data: {
        userId: session.userId,
        businessName: data.businessName,
        ownerName: data.ownerName,
        whatsapp: data.whatsapp,
        gpsLat: data.gpsLat,
        gpsLng: data.gpsLng,
        city: data.city,
        businessLicense: data.businessLicense,
        tin: data.tin,
        description: data.description,
        workingHours: data.workingHours,
        deliveryAvailable: data.deliveryAvailable,
        paymentMethods: JSON.stringify(data.paymentMethods),
        bankAccount: data.bankAccount,
        mobileMoney: data.mobileMoney,
        status: "PENDING",
        agreement: {
          create: {
            signatureName: data.signatureName,
            accepted: data.agreementAccepted,
            ipAddress: ip,
          },
        },
      },
      include: { agreement: true },
    });

    return NextResponse.json({ supplier }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
