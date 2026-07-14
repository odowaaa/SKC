import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, requireSession } from "@/lib/apiHelpers";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const address = await prisma.address.findUnique({ where: { id: params.id } });
    if (!address || address.userId !== session.userId) return jsonError(404, "Address not found.");
    await prisma.address.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
