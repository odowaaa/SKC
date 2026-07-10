import { apiClient } from "@/lib/api-client";
import { serverFetch } from "@/lib/server-fetch";
import type { PaginatedResponse, PropertyDetail, PropertySummary } from "@/lib/types";

export interface PropertySearchParams {
  q?: string;
  city?: string;
  country?: string;
  type?: string;
  listingType?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  sortBy?: string;
  featured?: boolean;
  luxury?: boolean;
  page?: number;
  limit?: number;
}

export function searchProperties(params: PropertySearchParams = {}) {
  return serverFetch<PaginatedResponse<PropertySummary>>("/properties", {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

export function getPropertyBySlug(slug: string) {
  return serverFetch<PropertyDetail>(`/properties/slug/${slug}`, { revalidate: 30 });
}

export function getSimilarProperties(id: string) {
  return serverFetch<PropertySummary[]>(`/properties/${id}/similar`, { revalidate: 60 });
}

export async function toggleFavorite(propertyId: string, isFavorited: boolean) {
  if (isFavorited) {
    await apiClient.delete(`/favorites/${propertyId}`);
  } else {
    await apiClient.post(`/favorites/${propertyId}`);
  }
}

export async function listFavorites() {
  const { data } = await apiClient.get("/favorites");
  return data.data;
}

export async function createBooking(propertyId: string, payload: { scheduledAt: string; note?: string }) {
  const { data } = await apiClient.post(`/properties/${propertyId}/bookings`, payload);
  return data.data;
}

export async function listMyBookings() {
  const { data } = await apiClient.get("/bookings/mine");
  return data.data;
}

export async function listAgentBookings() {
  const { data } = await apiClient.get("/bookings/agent/mine");
  return data.data;
}

export async function listMyProperties() {
  const { data } = await apiClient.get("/properties/mine");
  return data.data as PropertySummary[];
}

export async function getPropertyById(id: string) {
  const { data } = await apiClient.get(`/properties/${id}`);
  return data.data as PropertyDetail;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createProperty(payload: Record<string, any>) {
  const { data } = await apiClient.post("/properties", payload);
  return data.data as PropertyDetail;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateProperty(id: string, payload: Record<string, any>) {
  const { data } = await apiClient.patch(`/properties/${id}`, payload);
  return data.data as PropertyDetail;
}

export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post("/uploads", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data as { url: string };
}
