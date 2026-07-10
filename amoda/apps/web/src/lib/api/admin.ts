import { apiClient } from "@/lib/api-client";

export async function listUsers(params: { page?: number; limit?: number; role?: string } = {}) {
  const { data } = await apiClient.get("/users", { params });
  return data.data;
}

export async function updateUserRole(id: string, role: string) {
  const { data } = await apiClient.patch(`/users/${id}/role`, { role });
  return data.data;
}

export async function suspendUser(id: string) {
  const { data } = await apiClient.patch(`/users/${id}/suspend`);
  return data.data;
}

export async function unsuspendUser(id: string) {
  const { data } = await apiClient.patch(`/users/${id}/unsuspend`);
  return data.data;
}

export async function listAllProperties(params: { page?: number; limit?: number; status?: string } = {}) {
  const { data } = await apiClient.get("/properties/admin/all", { params });
  return data.data;
}

export async function setPropertyFeatured(id: string, isFeatured: boolean) {
  const { data } = await apiClient.patch(`/properties/${id}/feature`, { isFeatured });
  return data.data;
}

export async function updatePropertyStatus(id: string, status: string) {
  const { data } = await apiClient.patch(`/properties/${id}`, { status });
  return data.data;
}
