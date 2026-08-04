import { all, run } from '../db.js';
import { json, error, readJson } from '../http.js';
import { can } from '../rbac.js';
import { logAudit } from '../audit.js';

// Site-wide settings management (Super Admin only). Returns a Response, or null if unmatched.
export async function handleAdminSettingsRoute(request, env, pathname, method, staffUser) {
  if (pathname === '/api/admin/settings' && method === 'GET') {
    if (!can(staffUser, 'settings')) return error('Forbidden.', 403);
    const rows = await all(env.DB, 'SELECT key, value, updated_at FROM site_settings ORDER BY key');
    return json({ items: rows });
  }

  if (pathname === '/api/admin/settings' && method === 'PATCH') {
    if (!can(staffUser, 'settings')) return error('Forbidden.', 403);
    const body = await readJson(request);
    if (!body || typeof body !== 'object') return error('Request body must be a JSON object of key/value pairs.');
    const entries = Object.entries(body);
    if (!entries.length) return error('No settings provided.');
    for (const [key, value] of entries) {
      await run(
        env.DB,
        `INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        key, value == null ? null : String(value)
      );
    }
    await logAudit(env.DB, staffUser, 'update', 'settings', null, { keys: Object.keys(body) });
    return json({ message: 'Settings updated.' });
  }

  return null;
}
