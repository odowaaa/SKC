import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().email().optional().or(z.literal("")),
  password: z.string().min(6),
  role: z.enum(["CUSTOMER", "SUPPLIER", "DRIVER"]).default("CUSTOMER"),
});

export const loginSchema = z.object({
  phone: z.string().min(6),
  password: z.string().min(1),
});

export const supplierRegisterSchema = z.object({
  businessName: z.string().min(2),
  ownerName: z.string().min(2),
  whatsapp: z.string().optional(),
  gpsLat: z.number().optional(),
  gpsLng: z.number().optional(),
  city: z.string().default("Mogadishu"),
  businessLicense: z.string().optional(),
  tin: z.string().optional(),
  description: z.string().optional(),
  workingHours: z.string().optional(),
  deliveryAvailable: z.boolean().default(true),
  paymentMethods: z.array(z.string()).default(["CASH_ON_DELIVERY"]),
  bankAccount: z.string().optional(),
  mobileMoney: z.string().optional(),
  agreementAccepted: z.literal(true),
  signatureName: z.string().min(2),
});

export const driverRegisterSchema = z.object({
  fullName: z.string().min(2),
  nationalId: z.string().optional(),
  licenseNumber: z.string().optional(),
  insuranceInfo: z.string().optional(),
  bankAccount: z.string().optional(),
  mobileMoney: z.string().optional(),
  workingHours: z.string().optional(),
  vehicleType: z.enum([
    "TUK_TUK",
    "MOTORCYCLE",
    "PICKUP",
    "MINI_TRUCK",
    "THREE_WHEELER",
    "SMALL_LORRY",
  ]),
  plate: z.string().min(1),
  capacityKg: z.number().optional(),
});

export const productSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(2),
  nameSo: z.string().optional(),
  description: z.string().optional(),
  price: z.number().positive(),
  discountPct: z.number().min(0).max(100).default(0),
  stock: z.number().int().min(0).default(0),
  sku: z.string().optional(),
  brand: z.string().optional(),
  condition: z.enum(["NEW", "USED"]).default("NEW"),
  imageUrl: z.string().optional(),
});

export const orderCreateSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive().default(1),
  referralCode: z.string().optional(),
  paymentMethod: z
    .enum(["CASH_ON_DELIVERY", "EVC_PLUS", "ZAAD", "SAHAL", "EDAHAB", "BANK_TRANSFER", "CARD"])
    .default("CASH_ON_DELIVERY"),
  deliveryAddress: z.string().optional(),
  deliveryLat: z.number().optional(),
  deliveryLng: z.number().optional(),
  requestDelivery: z.boolean().default(true),
});
