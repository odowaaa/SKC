export interface Category {
  id: string;
  name: string;
  nameSo: string;
  slug: string;
  commissionPct: number;
}

export interface SupplierSummary {
  id: string;
  businessName: string;
  city: string;
  ratingAvg: number;
  ratingCount?: number;
  distanceKm?: number | null;
  logoUrl?: string | null;
  gpsLat?: number | null;
  gpsLng?: number | null;
  whatsapp?: string | null;
  description?: string | null;
}

export interface Product {
  id: string;
  name: string;
  nameSo?: string | null;
  description?: string | null;
  price: number;
  discountPct: number;
  stock: number;
  imageUrl?: string | null;
  condition: string;
  brand?: string | null;
  supplier: SupplierSummary;
  category: { name: string; nameSo: string; slug: string };
}
