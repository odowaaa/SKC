export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

export function error(message, status = 400) {
  return json({ error: message }, status);
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function requireFields(body, fields) {
  if (!body) return `Request body must be JSON.`;
  for (const field of fields) {
    if (!body[field] || String(body[field]).trim() === '') {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
