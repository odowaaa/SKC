import { NextResponse } from "next/server";
import type { Role } from "@/lib/enums";
import { getSession } from "@/lib/auth";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireSession(roles?: Role[]) {
  const session = await getSession();
  if (!session) {
    throw new ApiError(401, "Authentication required.");
  }
  if (roles && !roles.includes(session.role)) {
    throw new ApiError(403, "You do not have permission to perform this action.");
  }
  return session;
}

export function handleApiError(err: unknown) {
  if (err instanceof ApiError) {
    return jsonError(err.status, err.message);
  }
  console.error(err);
  return jsonError(500, "Something went wrong. Please try again.");
}
