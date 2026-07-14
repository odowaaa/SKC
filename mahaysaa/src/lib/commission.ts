/**
 * Commission calculations. Supplier commission % comes from the product's category
 * (admin-configurable per category). Driver delivery commission defaults to 1.5%
 * per the platform spec but can be overridden per delivery/vehicle tier later.
 */

export const DEFAULT_DRIVER_COMMISSION_PCT = 1.5;

export function calculateSupplierCommission(saleAmount: number, commissionPct: number) {
  const commissionAmount = round2((saleAmount * commissionPct) / 100);
  const supplierPayout = round2(saleAmount - commissionAmount);
  return { commissionPct, commissionAmount, supplierPayout };
}

export function calculateDriverCommission(
  grossFee: number,
  commissionPct: number = DEFAULT_DRIVER_COMMISSION_PCT
) {
  const commissionAmount = round2((grossFee * commissionPct) / 100);
  const netEarning = round2(grossFee - commissionAmount);
  return { commissionPct, commissionAmount, netEarning };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
