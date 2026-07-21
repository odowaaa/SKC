import { apiClient } from "@/lib/api-client";

export async function listLeads() {
  const { data } = await apiClient.get("/leads");
  return data.data;
}

export async function getLead(id: string) {
  const { data } = await apiClient.get(`/leads/${id}`);
  return data.data;
}

export async function updateLeadStatus(id: string, status: string) {
  const { data } = await apiClient.patch(`/leads/${id}/status`, { status });
  return data.data;
}

export async function assignLead(id: string, assigneeId: string) {
  const { data } = await apiClient.patch(`/leads/${id}/assign`, { assigneeId });
  return data.data;
}

export async function addLeadNote(id: string, body: string) {
  const { data } = await apiClient.post(`/leads/${id}/notes`, { body });
  return data.data;
}

export async function addLeadTask(id: string, title: string, dueAt?: string) {
  const { data } = await apiClient.post(`/leads/${id}/tasks`, { title, dueAt });
  return data.data;
}

export async function completeLeadTask(taskId: string) {
  const { data } = await apiClient.patch(`/leads/tasks/${taskId}/complete`);
  return data.data;
}
