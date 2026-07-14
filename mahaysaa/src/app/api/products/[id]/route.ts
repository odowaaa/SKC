import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { productSchema } from "@/lib/validation";
import { handleApiError, jsonError, requireSession } from "@/lib/apiHelpers";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        category: true,
        reviews: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      },
    });
    if (!product) return jsonError(404, "Product not found.");
    return NextResponse.json({ product });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession(["SUPPLIER"]);
    const supplier = await prisma.supplier.findUnique({ where: { userId: session.userId } });
    const product = await prisma.product.findUnique({ where: { id: params.id } });
    if (!product || !supplier || product.supplierId !== supplier.id) {
      return jsonError(404, "Product not found.");
    }
    const body = await req.json();
    const data = productSchema.partial().parse(body);
    const updated = await prisma.product.update({ where: { id: params.id }, data });
    return NextResponse.json({ product: updated });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession(["SUPPLIER"]);
    const supplier = await prisma.supplier.findUnique({ where: { userId: session.userId } });
    const product = await prisma.product.findUnique({ where: { id: params.id } });
    if (!product || !supplier || product.supplierId !== supplier.id) {
      return jsonError(404, "Product not found.");
    }
    await prisma.product.update({ where: { id: params.id }, data: { isActive: false } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
