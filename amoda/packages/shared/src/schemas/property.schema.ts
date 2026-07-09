import { z } from "zod";
import {
  FurnishingStatus,
  ListingType,
  PropertyStatus,
  PropertyType,
} from "../enums";

export const createPropertySchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20),
  type: z.nativeEnum(PropertyType),
  listingType: z.nativeEnum(ListingType),
  price: z.number().positive(),
  currency: z.string().default("USD"),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  areaSqm: z.number().positive().optional(),
  parkingSpaces: z.number().int().min(0).optional(),
  furnishing: z.nativeEnum(FurnishingStatus).optional(),
  country: z.string().min(2),
  city: z.string().min(1),
  district: z.string().optional(),
  neighborhood: z.string().optional(),
  addressLine: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  amenityIds: z.array(z.string().cuid()).optional(),
  categoryIds: z.array(z.string().cuid()).optional(),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;

export const updatePropertySchema = createPropertySchema.partial().extend({
  status: z.nativeEnum(PropertyStatus).optional(),
});

export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;

export const propertySearchSchema = z.object({
  q: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  neighborhood: z.string().optional(),
  type: z.nativeEnum(PropertyType).optional(),
  listingType: z.nativeEnum(ListingType).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  minBedrooms: z.coerce.number().int().nonnegative().optional(),
  minBathrooms: z.coerce.number().int().nonnegative().optional(),
  minArea: z.coerce.number().nonnegative().optional(),
  maxArea: z.coerce.number().positive().optional(),
  furnishing: z.nativeEnum(FurnishingStatus).optional(),
  amenities: z.array(z.string()).optional(),
  parking: z.coerce.boolean().optional(),
  swimmingPool: z.coerce.boolean().optional(),
  garden: z.coerce.boolean().optional(),
  petsAllowed: z.coerce.boolean().optional(),
  airConditioning: z.coerce.boolean().optional(),
  gym: z.coerce.boolean().optional(),
  security: z.coerce.boolean().optional(),
  bounds: z
    .object({
      north: z.number(),
      south: z.number(),
      east: z.number(),
      west: z.number(),
    })
    .optional(),
  sortBy: z
    .enum(["newest", "price_asc", "price_desc", "area_asc", "area_desc"])
    .default("newest"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type PropertySearchInput = z.infer<typeof propertySearchSchema>;
