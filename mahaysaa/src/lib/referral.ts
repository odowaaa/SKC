import { prisma } from "@/lib/db";

/** Generates a unique referral code in the MH-XXXXXX format used across the platform. */
export async function generateReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const digits = Math.floor(100000 + Math.random() * 900000);
    const code = `MH-${digits}`;
    const existing = await prisma.referralCode.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new Error("Failed to generate a unique referral code, please retry.");
}
