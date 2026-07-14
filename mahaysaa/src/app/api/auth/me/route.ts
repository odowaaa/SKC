import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      role: true,
      language: true,
      supplier: { select: { id: true, status: true, businessName: true } },
      driver: { select: { id: true, status: true } },
    },
  });
  return NextResponse.json({ user });
}
