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

export type LoginResult = AuthSession | { twoFactorRequired: true; email: string };

export async function loginRequest(payload: { email: string; password: string }) {
  const { data } = await apiClient.post("/auth/login", payload);
  return data.data as LoginResult;
}

export async function verifyTwoFactorLoginRequest(payload: { email: string; token: string }) {
  const { data } = await apiClient.post("/auth/2fa/verify-login", payload);
  return data.data as AuthSession;
}

export async function setupTwoFactorRequest() {
  const { data } = await apiClient.post("/auth/2fa/setup");
  return data.data as { secret: string; qrCodeDataUrl: string };
}

export async function enableTwoFactorRequest(token: string) {
  const { data } = await apiClient.post("/auth/2fa/enable", { token });
  return data.data as { enabled: boolean };
}

export async function disableTwoFactorRequest(token: string) {
  const { data } = await apiClient.post("/auth/2fa/disable", { token });
  return data.data as { disabled: boolean };
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
