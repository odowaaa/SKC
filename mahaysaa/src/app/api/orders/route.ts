import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { orderCreateSchema } from "@/lib/validation";
import { handleApiError, jsonError, requireSession } from "@/lib/apiHelpers";
import { calculateSupplierCommission } from "@/lib/commission";
import { distanceKm, estimateDeliveryFee } from "@/lib/geo";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["CUSTOMER"]);
    const data = orderCreateSchema.parse(await req.json());

    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      include: { supplier: true, category: true },
    });
    if (!product || !product.isActive) return jsonError(404, "Product not found.");
    if (product.stock < data.quantity) return jsonError(400, "Not enough stock available.");

    let referralRecord = null;
    if (data.referralCode) {
      referralRecord = await prisma.referralCode.findUnique({ where: { code: data.referralCode } });
      if (
        !referralRecord ||
        referralRecord.customerId !== session.userId ||
        referralRecord.supplierId !== product.supplierId
      ) {
        return jsonError(400, "Invalid referral code for this order.");
      }
      if (referralRecord.redeemed) {
        return jsonError(400, "This referral code has already been used.");
      }
    }

    const subtotal = Math.round(product.price * data.quantity * 100) / 100;
    const discountAmount = Math.round(((subtotal * product.discountPct) / 100) * 100) / 100;
    const total = Math.round((subtotal - discountAmount) * 100) / 100;

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          customerId: session.userId,
          supplierId: product.supplierId,
          referralCodeId: referralRecord?.id,
          subtotal,
          discountAmount,
          total,
          paymentMethod: data.paymentMethod,
          deliveryAddress: data.deliveryAddress,
          status: "CONFIRMED",
          items: {
            create: [{ productId: product.id, quantity: data.quantity, unitPrice: product.price, lineTotal: subtotal }],
          },
        },
        include: { items: true },
      });

      await tx.product.update({
        where: { id: product.id },
        data: { stock: { decrement: data.quantity } },
      });

      if (referralRecord) {
        await tx.referralCode.update({
          where: { id: referralRecord.id },
          data: { redeemed: true, redeemedAt: new Date() },
        });
      }

      const { commissionPct, commissionAmount, supplierPayout } = calculateSupplierCommission(
        total,
        product.category.commissionPct
      );
      await tx.commission.create({
        data: {
          orderId: order.id,
          supplierId: product.supplierId,
          saleAmount: total,
          commissionPct,
          commissionAmount,
          supplierPayout,
        },
      });

      if (data.requestDelivery && product.supplier.deliveryAvailable) {
        let km: number | null = null;
        if (
          product.supplier.gpsLat != null &&
          product.supplier.gpsLng != null &&
          data.deliveryLat != null &&
          data.deliveryLng != null
        ) {
          km = distanceKm(product.supplier.gpsLat, product.supplier.gpsLng, data.deliveryLat, data.deliveryLng);
        }
        const fee = km != null ? estimateDeliveryFee(km) : 2.5;
        await tx.delivery.create({
          data: {
            orderId: order.id,
            pickupLat: product.supplier.gpsLat,
            pickupLng: product.supplier.gpsLng,
            dropoffLat: data.deliveryLat,
            dropoffLng: data.deliveryLng,
            distanceKm: km,
            fee,
            status: "UNASSIGNED",
          },
        });
      }

      await tx.notification.create({
        data: {
          userId: session.userId,
          title: "Order placed",
          body: `Your order for ${product.name} has been placed.`,
          type: "ORDER",
        },
      });

      return order;
    });

    return NextResponse.json({ order: result }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET() {
  try {
    const session = await requireSession();
    const where =
      session.role === "SUPPLIER"
        ? { supplier: { userId: session.userId } }
        : { customerId: session.userId };

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: { include: { product: true } },
        supplier: { select: { businessName: true } },
        delivery: true,
        commission: true,
        review: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (err) {
    return handleApiError(err);
  }
}
