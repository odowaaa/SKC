import { apiClient } from "@/lib/api-client";

export async function listOffers() {
  const { data } = await apiClient.get("/offers");
  return data.data;
}

export async function updateOfferStatus(id: string, status: string) {
  const { data } = await apiClient.patch(`/offers/${id}/status`, { status });
  return data.data;
}
