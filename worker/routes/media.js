import { all, first, run } from '../db.js';
import { json, error } from '../http.js';
import { can } from '../rbac.js';
import { logAudit } from '../audit.js';

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']);

function sanitizeFilename(name) {
  return String(name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100);
}

async function storeUpload(env, file, purpose, uploaderType, uploaderId) {
  if (!file || typeof file.arrayBuffer !== 'function') return { fail: 'No file provided.' };
  if (file.size > MAX_UPLOAD_BYTES) return { fail: 'File is too large (max 8MB).' };
  if (!ALLOWED_TYPES.has(file.type)) return { fail: `Unsupported file type: ${file.type || 'unknown'}.` };

  const key = `${purpose}/${crypto.randomUUID()}-${sanitizeFilename(file.name)}`;
  const bytes = await file.arrayBuffer();
  await env.MEDIA.put(key, bytes, { httpMetadata: { contentType: file.type } });

  const result = await run(
    env.DB,
    `INSERT INTO media_files (r2_key, filename, content_type, size, purpose, uploaded_by_type, uploaded_by_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    key, file.name || key, file.type, file.size, purpose, uploaderType, uploaderId
  );
  return { id: result.meta.last_row_id, url: `/api/media/${result.meta.last_row_id}` };
}

// Serving a stored file is public (gallery images, ID photos need to render on public/authed pages alike).
export async function handleMediaServeRoute(request, env, pathname, method) {
  const match = pathname.match(/^\/api\/media\/(\d+)$/);
  if (!match || method !== 'GET') return null;

  const media = await first(env.DB, 'SELECT * FROM media_files WHERE id = ?', match[1]);
  if (!media) return error('File not found.', 404);
  const object = await env.MEDIA.get(media.r2_key);
  if (!object) return error('File not found.', 404);

  return new Response(object.body, {
    headers: {
      'Content-Type': media.content_type,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

// Staff-facing upload/list/delete. Returns a Response, or null if unmatched.
export async function handleAdminMediaRoute(request, env, pathname, method, staffUser) {
  if (pathname === '/api/admin/media' && method === 'GET') {
    if (!can(staffUser, 'media')) return error('Forbidden.', 403);
    const url = new URL(request.url);
    const purpose = url.searchParams.get('purpose');
    const rows = purpose
      ? await all(env.DB, 'SELECT * FROM media_files WHERE purpose = ? ORDER BY created_at DESC', purpose)
      : await all(env.DB, 'SELECT * FROM media_files ORDER BY created_at DESC');
    return json({ items: rows.map((r) => ({ ...r, url: `/api/media/${r.id}` })) });
  }

  if (pathname === '/api/admin/media' && method === 'POST') {
    if (!can(staffUser, 'media')) return error('Forbidden.', 403);
    const form = await request.formData().catch(() => null);
    if (!form) return error('Expected multipart/form-data.');
    const purpose = form.get('purpose') || 'general';
    const result = await storeUpload(env, form.get('file'), purpose, 'staff', staffUser.id);
    if (result.fail) return error(result.fail);
    await logAudit(env.DB, staffUser, 'upload', 'media', result.id, { purpose });
    return json(result, 201);
  }

  const deleteMatch = pathname.match(/^\/api\/admin\/media\/(\d+)$/);
  if (deleteMatch && method === 'DELETE') {
    if (!can(staffUser, 'media')) return error('Forbidden.', 403);
    const media = await first(env.DB, 'SELECT * FROM media_files WHERE id = ?', deleteMatch[1]);
    if (!media) return error('File not found.', 404);
    await env.MEDIA.delete(media.r2_key);
    await run(env.DB, 'DELETE FROM media_files WHERE id = ?', deleteMatch[1]);
    await logAudit(env.DB, staffUser, 'delete', 'media', deleteMatch[1]);
    return json({ message: 'Deleted.' });
  }

  return null;
}

export { storeUpload, MAX_UPLOAD_BYTES, ALLOWED_TYPES };
