import { apiClient } from "@/lib/api-client";

export interface CreateLeasePayload {
  propertyId: string;
  tenantEmail: string;
  tenantFirstName?: string;
  tenantLastName?: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  currency?: string;
  billingCycle?: string;
  depositAmount?: number;
}

export async function listLeases() {
  const { data } = await apiClient.get("/leases");
  return data.data;
}

export async function getLease(id: string) {
  const { data } = await apiClient.get(`/leases/${id}`);
  return data.data;
}

export async function createLease(payload: CreateLeasePayload) {
  const { data } = await apiClient.post("/leases", payload);
  return data.data;
}

export async function generateInvoice(leaseId: string, dueDate: string) {
  const { data } = await apiClient.post(`/leases/${leaseId}/invoices`, { dueDate });
  return data.data;
}

export async function terminateLease(leaseId: string) {
  const { data } = await apiClient.patch(`/leases/${leaseId}/terminate`);
  return data.data;
}

export async function listMaintenanceRequests(leaseId: string) {
  const { data } = await apiClient.get(`/leases/${leaseId}/maintenance-requests`);
  return data.data;
}

export async function createMaintenanceRequest(leaseId: string, title: string, description: string) {
  const { data } = await apiClient.post(`/leases/${leaseId}/maintenance-requests`, { title, description });
  return data.data;
}

export async function updateMaintenanceStatus(requestId: string, status: string) {
  const { data } = await apiClient.patch(`/maintenance-requests/${requestId}/status`, { status });
  return data.data;
}
