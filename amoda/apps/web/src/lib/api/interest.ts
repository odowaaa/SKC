import { apiClient } from "@/lib/api-client";

export interface RequestInfoPayload {
  fullName: string;
  email?: string;
  phone?: string;
  message?: string;
}

export async function submitRequestInfo(propertyId: string, payload: RequestInfoPayload) {
  const { data } = await apiClient.post(`/properties/${propertyId}/leads`, payload);
  return data.data as { received: boolean; leadId: string };
}

export interface MakeOfferPayload {
  buyerName: string;
  buyerEmail?: string;
  buyerPhone?: string;
  amount: number;
  currency?: string;
  note?: string;
}

export async function submitOffer(propertyId: string, payload: MakeOfferPayload) {
  const { data } = await apiClient.post(`/properties/${propertyId}/offers`, payload);
  return data.data;
}

export async function toggleCompare(propertyId: string, isComparing: boolean) {
  if (isComparing) {
    await apiClient.delete(`/compare/${propertyId}`);
  } else {
    await apiClient.post(`/compare/${propertyId}`);
  }
}

export async function listCompare() {
  const { data } = await apiClient.get("/compare");
  return data.data;
}

export async function clearCompare() {
  await apiClient.delete("/compare");
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  alertsOn: boolean;
  createdAt: string;
}

export async function listSavedSearches() {
  const { data } = await apiClient.get("/saved-searches");
  return data.data as SavedSearch[];
}

export async function createSavedSearch(name: string, filters: Record<string, unknown>) {
  const { data } = await apiClient.post("/saved-searches", { name, filters });
  return data.data as SavedSearch;
}

export async function deleteSavedSearch(id: string) {
  await apiClient.delete(`/saved-searches/${id}`);
}
