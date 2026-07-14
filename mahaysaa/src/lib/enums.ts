/**
 * SQLite has no native enum type, so Prisma models store these as plain
 * strings (see prisma/schema.prisma). These TS unions + zod schemas
 * (src/lib/validation.ts) are the source of truth for valid values.
 */

export const ROLES = [
  "CUSTOMER",
  "SUPPLIER",
  "DRIVER",
  "ADMIN",
  "REGIONAL_ADMIN",
  "FINANCE_ADMIN",
  "SUPPORT_ADMIN",
] as const;
export type Role = (typeof ROLES)[number];

export const APPROVAL_STATUSES = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY_FOR_DELIVERY",
  "DELIVERING",
  "DELIVERED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const DELIVERY_STATUSES = [
  "UNASSIGNED",
  "ASSIGNED",
  "PICKED_UP",
  "EN_ROUTE",
  "DELIVERED",
  "CANCELLED",
] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export const PAYMENT_METHODS = [
  "CASH_ON_DELIVERY",
  "EVC_PLUS",
  "ZAAD",
  "SAHAL",
  "EDAHAB",
  "BANK_TRANSFER",
  "CARD",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["UNPAID", "PAID", "REFUNDED", "FAILED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
