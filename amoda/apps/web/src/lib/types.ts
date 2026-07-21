export interface PropertyMedia {
  id: string;
  kind: string;
  url: string;
  caption?: string | null;
}

export interface PropertySummary {
  id: string;
  slug: string;
  referenceCode: string;
  title: string;
  description: string;
  type: string;
  listingType: string;
  status: string;
  price: string;
  currency: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  areaSqm?: string | null;
  city: string;
  district?: string | null;
  country: string;
  isFeatured: boolean;
  isLuxury: boolean;
  publishedAt?: string | null;
  media: PropertyMedia[];
  _count?: { favorites: number; reviews: number };
}

export interface AgentInfo {
  id: string;
  agencyName?: string | null;
  bio?: string | null;
  isVerified: boolean;
  user: { id: string; firstName: string; lastName: string; avatarUrl?: string | null; phone?: string | null; email: string };
}

export interface PropertyDetail extends PropertySummary {
  parkingSpaces?: number | null;
  furnishing?: string | null;
  hasSwimmingPool: boolean;
  hasGarden: boolean;
  petsAllowed: boolean;
  hasAirConditioning: boolean;
  hasGym: boolean;
  hasSecurity: boolean;
  hasWater: boolean;
  hasElectricity: boolean;
  neighborhood?: string | null;
  addressLine?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  viewsCount: number;
  amenities: { amenity: { id: string; name: string; icon?: string | null } }[];
  agent?: AgentInfo | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
