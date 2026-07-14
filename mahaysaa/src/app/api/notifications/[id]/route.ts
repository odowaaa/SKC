import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, requireSession } from "@/lib/apiHelpers";

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const notification = await prisma.notification.findUnique({ where: { id: params.id } });
    if (!notification || notification.userId !== session.userId) {
      return jsonError(404, "Notification not found.");
    }
    const updated = await prisma.notification.update({ where: { id: params.id }, data: { read: true } });
    return NextResponse.json({ notification: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
