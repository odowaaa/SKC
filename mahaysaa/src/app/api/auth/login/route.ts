import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { handleApiError, jsonError } from "@/lib/apiHelpers";
import type { Role } from "@/lib/enums";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = loginSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (!user) {
      return jsonError(401, "Invalid phone number or password.");
    }

    const valid = await verifyPassword(data.password, user.passwordHash);
    if (!valid) {
      return jsonError(401, "Invalid phone number or password.");
    }

    const token = await createSessionToken({ userId: user.id, role: user.role as Role, name: user.name });
    await setSessionCookie(token);

    return NextResponse.json({
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
