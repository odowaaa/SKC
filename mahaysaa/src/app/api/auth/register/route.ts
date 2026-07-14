import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { handleApiError, jsonError } from "@/lib/apiHelpers";
import type { Role } from "@/lib/enums";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (existing) {
      return jsonError(409, "An account with this phone number already exists.");
    }

    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || undefined,
        passwordHash,
        role: data.role,
      },
    });

    const token = await createSessionToken({ userId: user.id, role: user.role as Role, name: user.name });
    await setSessionCookie(token);

    return NextResponse.json({
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
