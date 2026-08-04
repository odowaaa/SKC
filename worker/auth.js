const PBKDF2_ITERATIONS = 100000;
const HASH_BITS = 256;

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

export function generateSaltHex() {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return toHex(salt);
}

export async function hashPassword(password, saltHex) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: fromHex(saltHex),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    HASH_BITS
  );
  return toHex(derivedBits);
}

export async function verifyPassword(password, saltHex, expectedHashHex) {
  const computed = await hashPassword(password, saltHex);
  if (computed.length !== expectedHashHex.length) return false;
  let mismatch = 0;
  for (let i = 0; i < computed.length; i++) {
    mismatch |= computed.charCodeAt(i) ^ expectedHashHex.charCodeAt(i);
  }
  return mismatch === 0;
}

export function generateSessionToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return toHex(bytes);
}

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function createSession(db, userId, userType) {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await db
    .prepare('INSERT INTO sessions (token, user_id, user_type, expires_at) VALUES (?, ?, ?, ?)')
    .bind(token, userId, userType, expiresAt)
    .run();
  return { token, expiresAt };
}

function readCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function getSessionUser(request, env, requiredType) {
  const token = readCookie(request, 'skc_session');
  if (!token) return null;

  const session = await env.DB
    .prepare('SELECT * FROM sessions WHERE token = ?')
    .bind(token)
    .first();
  if (!session) return null;
  if (new Date(session.expires_at).getTime() < Date.now()) {
    await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    return null;
  }
  if (requiredType && session.user_type !== requiredType) return null;

  const table = session.user_type === 'staff' ? 'staff' : 'students';
  const user = await env.DB
    .prepare(`SELECT * FROM ${table} WHERE id = ?`)
    .bind(session.user_id)
    .first();
  if (!user) return null;
  if (session.user_type === 'staff' && !user.active) {
    await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    return null;
  }

  delete user.password_hash;
  delete user.password_salt;
  return { ...user, user_type: session.user_type };
}

export async function deleteSession(request, env) {
  const token = readCookie(request, 'skc_session');
  if (!token) return;
  await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
}

export function sessionCookieHeader(token, maxAgeSeconds = 7 * 24 * 60 * 60) {
  return `skc_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`;
}

export function clearSessionCookieHeader() {
  return 'skc_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0';
}
