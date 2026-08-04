import { all, first, run } from '../db.js';
import { json, error, readJson, requireFields, EMAIL_RE } from '../http.js';
import { can, ROLES } from '../rbac.js';
import { logAudit } from '../audit.js';
import { generateSaltHex, hashPassword } from '../auth.js';

const STAFF_FIELDS = 'id, full_name, email, role, active, created_at';

// Staff/user management, departments CRUD, dashboard stats, and audit log viewing.
// Returns a Response, or null if no route in this module matched.
export async function handleAdminStaffRoute(request, env, pathname, method, staffUser) {
  // ---------- Staff / user management (Super Admin only) ----------
  if (pathname === '/api/admin/staff' && method === 'GET') {
    if (!can(staffUser, 'staff_management')) return error('Forbidden.', 403);
    const rows = await all(env.DB, `SELECT ${STAFF_FIELDS} FROM staff ORDER BY created_at DESC`);
    return json({ items: rows });
  }

  if (pathname === '/api/admin/staff' && method === 'POST') {
    if (!can(staffUser, 'staff_management')) return error('Forbidden.', 403);
    const body = await readJson(request);
    const missing = requireFields(body, ['full_name', 'email', 'password', 'role']);
    if (missing) return error(missing);
    if (!EMAIL_RE.test(body.email)) return error('Invalid email address.');
    if (!ROLES.includes(body.role)) return error(`Role must be one of: ${ROLES.join(', ')}`);
    if (String(body.password).length < 8) return error('Password must be at least 8 characters.');

    const existing = await first(env.DB, 'SELECT id FROM staff WHERE email = ?', body.email);
    if (existing) return error('A staff account with that email already exists.', 409);

    const salt = generateSaltHex();
    const hash = await hashPassword(body.password, salt);
    const result = await run(
      env.DB,
      `INSERT INTO staff (full_name, email, password_hash, password_salt, role) VALUES (?, ?, ?, ?, ?)`,
      body.full_name, body.email, hash, salt, body.role
    );
    await logAudit(env.DB, staffUser, 'create', 'staff', result.meta.last_row_id, { email: body.email, role: body.role });
    return json({ id: result.meta.last_row_id }, 201);
  }

  const staffMatch = pathname.match(/^\/api\/admin\/staff\/(\d+)$/);
  if (staffMatch && method === 'PUT') {
    if (!can(staffUser, 'staff_management')) return error('Forbidden.', 403);
    const targetId = Number(staffMatch[1]);
    const body = await readJson(request);
    const missing = requireFields(body, ['full_name', 'email', 'role']);
    if (missing) return error(missing);
    if (!EMAIL_RE.test(body.email)) return error('Invalid email address.');
    if (!ROLES.includes(body.role)) return error(`Role must be one of: ${ROLES.join(', ')}`);

    const active = body.active === false || body.active === 0 ? 0 : 1;
    if (targetId === staffUser.id && active === 0) {
      return error('You cannot deactivate your own account.');
    }
    if (targetId === staffUser.id && body.role !== 'super_admin' && staffUser.role === 'super_admin') {
      const otherAdmins = await first(
        env.DB, `SELECT count(*) c FROM staff WHERE role = 'super_admin' AND id != ? AND active = 1`, targetId
      );
      if (!otherAdmins.c) return error('You cannot remove the last remaining Super Admin.');
    }

    await run(
      env.DB, `UPDATE staff SET full_name = ?, email = ?, role = ?, active = ? WHERE id = ?`,
      body.full_name, body.email, body.role, active, targetId
    );
    await logAudit(env.DB, staffUser, 'update', 'staff', targetId, { email: body.email, role: body.role, active: Boolean(active) });
    return json({ message: 'Updated.' });
  }

  if (staffMatch && method === 'DELETE') {
    if (!can(staffUser, 'staff_management')) return error('Forbidden.', 403);
    const targetId = Number(staffMatch[1]);
    if (targetId === staffUser.id) return error('You cannot delete your own account.');
    const target = await first(env.DB, 'SELECT role FROM staff WHERE id = ?', targetId);
    if (!target) return error('Staff account not found.', 404);
    if (target.role === 'super_admin') {
      const otherAdmins = await first(env.DB, `SELECT count(*) c FROM staff WHERE role = 'super_admin' AND id != ? AND active = 1`, targetId);
      if (!otherAdmins.c) return error('You cannot delete the last remaining Super Admin.');
    }
    await run(env.DB, 'DELETE FROM staff WHERE id = ?', targetId);
    await run(env.DB, `DELETE FROM sessions WHERE user_id = ? AND user_type = 'staff'`, targetId);
    await logAudit(env.DB, staffUser, 'delete', 'staff', targetId);
    return json({ message: 'Deleted.' });
  }

  const staffPasswordMatch = pathname.match(/^\/api\/admin\/staff\/(\d+)\/password$/);
  if (staffPasswordMatch && method === 'PATCH') {
    if (!can(staffUser, 'staff_management')) return error('Forbidden.', 403);
    const body = await readJson(request);
    const missing = requireFields(body, ['new_password']);
    if (missing) return error(missing);
    if (String(body.new_password).length < 8) return error('New password must be at least 8 characters.');
    const salt = generateSaltHex();
    const hash = await hashPassword(body.new_password, salt);
    await run(env.DB, 'UPDATE staff SET password_hash = ?, password_salt = ? WHERE id = ?', hash, salt, staffPasswordMatch[1]);
    await run(env.DB, `DELETE FROM sessions WHERE user_id = ? AND user_type = 'staff'`, staffPasswordMatch[1]);
    await logAudit(env.DB, staffUser, 'reset_password', 'staff', staffPasswordMatch[1]);
    return json({ message: 'Password reset.' });
  }

  // ---------- Departments ----------
  if (pathname === '/api/admin/departments' && method === 'GET') {
    if (!can(staffUser, 'departments')) return error('Forbidden.', 403);
    const rows = await all(env.DB, 'SELECT * FROM departments ORDER BY sort_order');
    return json({ items: rows });
  }
  if (pathname === '/api/admin/departments' && method === 'POST') {
    if (!can(staffUser, 'departments')) return error('Forbidden.', 403);
    const body = await readJson(request);
    const missing = requireFields(body, ['key', 'name']);
    if (missing) return error(missing);
    const existing = await first(env.DB, 'SELECT id FROM departments WHERE key = ?', body.key);
    if (existing) return error('A department with that key already exists.', 409);
    const result = await run(
      env.DB, `INSERT INTO departments (key, name, description, sort_order) VALUES (?, ?, ?, ?)`,
      body.key, body.name, body.description || null, body.sort_order || 0
    );
    await logAudit(env.DB, staffUser, 'create', 'department', result.meta.last_row_id, { key: body.key });
    return json({ id: result.meta.last_row_id }, 201);
  }
  const deptMatch = pathname.match(/^\/api\/admin\/departments\/(\d+)$/);
  if (deptMatch && method === 'PUT') {
    if (!can(staffUser, 'departments')) return error('Forbidden.', 403);
    const body = await readJson(request);
    const missing = requireFields(body, ['key', 'name']);
    if (missing) return error(missing);
    await run(
      env.DB, `UPDATE departments SET key = ?, name = ?, description = ?, sort_order = ? WHERE id = ?`,
      body.key, body.name, body.description || null, body.sort_order || 0, deptMatch[1]
    );
    await logAudit(env.DB, staffUser, 'update', 'department', deptMatch[1], { key: body.key });
    return json({ message: 'Updated.' });
  }
  if (deptMatch && method === 'DELETE') {
    if (!can(staffUser, 'departments')) return error('Forbidden.', 403);
    const dept = await first(env.DB, 'SELECT key FROM departments WHERE id = ?', deptMatch[1]);
    if (!dept) return error('Department not found.', 404);
    const inUse = await first(
      env.DB,
      `SELECT (SELECT count(*) FROM programs WHERE school = ?) + (SELECT count(*) FROM applications WHERE school = ?) c`,
      dept.key, dept.key
    );
    if (inUse.c > 0) return error('Cannot delete a department that still has programs or applications referencing it.');
    await run(env.DB, 'DELETE FROM departments WHERE id = ?', deptMatch[1]);
    await logAudit(env.DB, staffUser, 'delete', 'department', deptMatch[1]);
    return json({ message: 'Deleted.' });
  }

  // ---------- Dashboard stats ----------
  if (pathname === '/api/admin/stats' && method === 'GET') {
    const [applications, students, messages, news, programs, gallery, staffCount] = await Promise.all([
      first(env.DB, `SELECT count(*) c, sum(status = 'new') new_count FROM applications`),
      first(env.DB, `SELECT count(*) c FROM students`),
      first(env.DB, `SELECT count(*) c, sum(status = 'new') new_count FROM contact_messages`),
      first(env.DB, `SELECT count(*) c, sum(status = 'published') published_count FROM news_posts`),
      first(env.DB, `SELECT count(*) c, sum(status = 'published') published_count FROM programs`),
      first(env.DB, `SELECT count(*) c, sum(status = 'published') published_count FROM gallery_items`),
      first(env.DB, `SELECT count(*) c FROM staff WHERE active = 1`),
    ]);
    return json({
      applications: { total: applications.c, new: applications.new_count || 0 },
      students: { total: students.c },
      messages: { total: messages.c, new: messages.new_count || 0 },
      news: { total: news.c, published: news.published_count || 0 },
      programs: { total: programs.c, published: programs.published_count || 0 },
      gallery: { total: gallery.c, published: gallery.published_count || 0 },
      staff: { total: staffCount.c },
    });
  }

  // ---------- Audit logs ----------
  if (pathname === '/api/admin/audit-logs' && method === 'GET') {
    if (!can(staffUser, 'audit_logs')) return error('Forbidden.', 403);
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 200);
    const rows = await all(env.DB, 'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?', limit);
    return json({ items: rows });
  }

  return null;
}
