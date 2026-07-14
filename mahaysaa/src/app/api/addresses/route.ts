import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, requireSession } from "@/lib/apiHelpers";
import { z } from "zod";

export async function GET() {
  try {
    const session = await requireSession();
    const addresses = await prisma.address.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ addresses });
  } catch (err) {
    return handleApiError(err);
  }
}

const schema = z.object({
  label: z.string().min(1),
  line1: z.string().min(1),
  city: z.string().default("Mogadishu"),
  lat: z.number().optional(),
  lng: z.number().optional(),
  isDefault: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const data = schema.parse(await req.json());

    if (data.isDefault) {
      await prisma.address.updateMany({ where: { userId: session.userId }, data: { isDefault: false } });
    }

    const address = await prisma.address.create({ data: { ...data, userId: session.userId } });
    return NextResponse.json({ address }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
