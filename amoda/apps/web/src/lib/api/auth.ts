import { apiClient } from "@/lib/api-client";
import type { AuthUser } from "@/store/auth-store";

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export async function registerRequest(payload: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
}) {
  const { data } = await apiClient.post("/auth/register", payload);
  return data.data as { user: AuthUser };
}

export async function loginRequest(payload: { email: string; password: string }) {
  const { data } = await apiClient.post("/auth/login", payload);
  return data.data as AuthSession;
}

export async function verifyOtpRequest(payload: { email: string; code: string }) {
  const { data } = await apiClient.post("/auth/verify-otp", payload);
  return data.data as { verified: boolean };
}

export async function resendOtpRequest(email: string) {
  const { data } = await apiClient.post("/auth/resend-otp", { email });
  return data.data as { sent: boolean };
}

export async function forgotPasswordRequest(email: string) {
  const { data } = await apiClient.post("/auth/forgot-password", { email });
  return data.data as { sent: boolean };
}

export async function resetPasswordRequest(payload: { email: string; token: string; password: string }) {
  const { data } = await apiClient.post("/auth/reset-password", payload);
  return data.data as { reset: boolean };
}
