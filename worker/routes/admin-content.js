import { all, run } from '../db.js';
import { json, error, readJson, requireFields } from '../http.js';
import { can } from '../rbac.js';
import { logAudit } from '../audit.js';

// Applications, contact messages, and the News/Programs/Gallery CMS.
// Returns a Response, or null if no route in this module matched.
export async function handleAdminContentRoute(request, env, pathname, method, staffUser) {
  if (pathname === '/api/admin/applications' && method === 'GET') {
    if (!can(staffUser, 'applications')) return error('Forbidden.', 403);
    const rows = await all(env.DB, 'SELECT * FROM applications ORDER BY created_at DESC');
    return json({ items: rows });
  }
  const appMatch = pathname.match(/^\/api\/admin\/applications\/(\d+)$/);
  if (appMatch && method === 'PATCH') {
    if (!can(staffUser, 'applications')) return error('Forbidden.', 403);
    const body = await readJson(request);
    if (!body?.status) return error('Missing status.');
    await run(env.DB, 'UPDATE applications SET status = ? WHERE id = ?', body.status, appMatch[1]);
    await logAudit(env.DB, staffUser, 'status_change', 'application', appMatch[1], { status: body.status });
    return json({ message: 'Updated.' });
  }

  if (pathname === '/api/admin/messages' && method === 'GET') {
    if (!can(staffUser, 'messages')) return error('Forbidden.', 403);
    const rows = await all(env.DB, 'SELECT * FROM contact_messages ORDER BY created_at DESC');
    return json({ items: rows });
  }
  const msgMatch = pathname.match(/^\/api\/admin\/messages\/(\d+)$/);
  if (msgMatch && method === 'PATCH') {
    if (!can(staffUser, 'messages')) return error('Forbidden.', 403);
    const body = await readJson(request);
    if (!body?.status) return error('Missing status.');
    await run(env.DB, 'UPDATE contact_messages SET status = ? WHERE id = ?', body.status, msgMatch[1]);
    await logAudit(env.DB, staffUser, 'status_change', 'contact_message', msgMatch[1], { status: body.status });
    return json({ message: 'Updated.' });
  }

  // News CRUD
  if (pathname === '/api/admin/news' && method === 'GET') {
    if (!can(staffUser, 'content')) return error('Forbidden.', 403);
    const rows = await all(env.DB, 'SELECT * FROM news_posts ORDER BY created_at DESC');
    return json({ items: rows });
  }
  if (pathname === '/api/admin/news' && method === 'POST') {
    if (!can(staffUser, 'content')) return error('Forbidden.', 403);
    const body = await readJson(request);
    const missing = requireFields(body, ['title', 'category']);
    if (missing) return error(missing);
    const publishedAt = body.status === 'published' ? new Date().toISOString() : null;
    const result = await run(
      env.DB,
      `INSERT INTO news_posts (title, category, excerpt, body, gradient, status, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      body.title, body.category, body.excerpt || null, body.body || null,
      body.gradient || 'from-primary-700 to-primary-900', body.status || 'draft', publishedAt
    );
    await logAudit(env.DB, staffUser, 'create', 'news_post', result.meta.last_row_id, { title: body.title });
    return json({ id: result.meta.last_row_id }, 201);
  }
  const newsMatch = pathname.match(/^\/api\/admin\/news\/(\d+)$/);
  if (newsMatch && method === 'PUT') {
    if (!can(staffUser, 'content')) return error('Forbidden.', 403);
    const body = await readJson(request);
    const missing = requireFields(body, ['title', 'category']);
    if (missing) return error(missing);
    const publishedAt = body.status === 'published' ? (body.published_at || new Date().toISOString()) : null;
    await run(
      env.DB,
      `UPDATE news_posts SET title = ?, category = ?, excerpt = ?, body = ?, gradient = ?, status = ?, published_at = ? WHERE id = ?`,
      body.title, body.category, body.excerpt || null, body.body || null,
      body.gradient || 'from-primary-700 to-primary-900', body.status || 'draft', publishedAt, newsMatch[1]
    );
    await logAudit(env.DB, staffUser, 'update', 'news_post', newsMatch[1], { title: body.title });
    return json({ message: 'Updated.' });
  }
  if (newsMatch && method === 'DELETE') {
    if (!can(staffUser, 'content')) return error('Forbidden.', 403);
    await run(env.DB, 'DELETE FROM news_posts WHERE id = ?', newsMatch[1]);
    await logAudit(env.DB, staffUser, 'delete', 'news_post', newsMatch[1]);
    return json({ message: 'Deleted.' });
  }

  // Programs CRUD
  if (pathname === '/api/admin/programs' && method === 'GET') {
    if (!can(staffUser, 'content')) return error('Forbidden.', 403);
    const rows = await all(env.DB, 'SELECT * FROM programs ORDER BY school, sort_order');
    return json({ items: rows });
  }
  if (pathname === '/api/admin/programs' && method === 'POST') {
    if (!can(staffUser, 'content')) return error('Forbidden.', 403);
    const body = await readJson(request);
    const missing = requireFields(body, ['school', 'level', 'title']);
    if (missing) return error(missing);
    const result = await run(
      env.DB,
      `INSERT INTO programs (school, level, title, duration, description, sort_order, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      body.school, body.level, body.title, body.duration || null, body.description || null,
      body.sort_order || 0, body.status || 'published'
    );
    await logAudit(env.DB, staffUser, 'create', 'program', result.meta.last_row_id, { title: body.title });
    return json({ id: result.meta.last_row_id }, 201);
  }
  const progMatch = pathname.match(/^\/api\/admin\/programs\/(\d+)$/);
  if (progMatch && method === 'PUT') {
    if (!can(staffUser, 'content')) return error('Forbidden.', 403);
    const body = await readJson(request);
    const missing = requireFields(body, ['school', 'level', 'title']);
    if (missing) return error(missing);
    await run(
      env.DB,
      `UPDATE programs SET school = ?, level = ?, title = ?, duration = ?, description = ?, sort_order = ?, status = ? WHERE id = ?`,
      body.school, body.level, body.title, body.duration || null, body.description || null,
      body.sort_order || 0, body.status || 'published', progMatch[1]
    );
    await logAudit(env.DB, staffUser, 'update', 'program', progMatch[1], { title: body.title });
    return json({ message: 'Updated.' });
  }
  if (progMatch && method === 'DELETE') {
    if (!can(staffUser, 'content')) return error('Forbidden.', 403);
    await run(env.DB, 'DELETE FROM programs WHERE id = ?', progMatch[1]);
    await logAudit(env.DB, staffUser, 'delete', 'program', progMatch[1]);
    return json({ message: 'Deleted.' });
  }

  // Gallery CRUD
  if (pathname === '/api/admin/gallery' && method === 'GET') {
    if (!can(staffUser, 'content')) return error('Forbidden.', 403);
    const rows = await all(env.DB, 'SELECT * FROM gallery_items ORDER BY sort_order');
    return json({ items: rows });
  }
  if (pathname === '/api/admin/gallery' && method === 'POST') {
    if (!can(staffUser, 'content')) return error('Forbidden.', 403);
    const body = await readJson(request);
    const missing = requireFields(body, ['category', 'caption']);
    if (missing) return error(missing);
    const result = await run(
      env.DB,
      `INSERT INTO gallery_items (category, caption, gradient, sort_order, status, media_id) VALUES (?, ?, ?, ?, ?, ?)`,
      body.category, body.caption, body.gradient || 'from-primary-600 to-primary-900',
      body.sort_order || 0, body.status || 'published', body.media_id || null
    );
    await logAudit(env.DB, staffUser, 'create', 'gallery_item', result.meta.last_row_id, { caption: body.caption });
    return json({ id: result.meta.last_row_id }, 201);
  }
  const galMatch = pathname.match(/^\/api\/admin\/gallery\/(\d+)$/);
  if (galMatch && method === 'PUT') {
    if (!can(staffUser, 'content')) return error('Forbidden.', 403);
    const body = await readJson(request);
    const missing = requireFields(body, ['category', 'caption']);
    if (missing) return error(missing);
    await run(
      env.DB,
      `UPDATE gallery_items SET category = ?, caption = ?, gradient = ?, sort_order = ?, status = ?, media_id = ? WHERE id = ?`,
      body.category, body.caption, body.gradient || 'from-primary-600 to-primary-900',
      body.sort_order || 0, body.status || 'published', body.media_id || null, galMatch[1]
    );
    await logAudit(env.DB, staffUser, 'update', 'gallery_item', galMatch[1], { caption: body.caption });
    return json({ message: 'Updated.' });
  }
  if (galMatch && method === 'DELETE') {
    if (!can(staffUser, 'content')) return error('Forbidden.', 403);
    await run(env.DB, 'DELETE FROM gallery_items WHERE id = ?', galMatch[1]);
    await logAudit(env.DB, staffUser, 'delete', 'gallery_item', galMatch[1]);
    return json({ message: 'Deleted.' });
  }

  return null;
}
