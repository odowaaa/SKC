import { all, first, run } from '../db.js';
import {
  generateSaltHex,
  hashPassword,
  verifyPassword,
  createSession,
  getSessionUser,
  deleteSession,
  sessionCookieHeader,
  clearSessionCookieHeader,
} from '../auth.js';
import { json, error, readJson, requireFields, EMAIL_RE } from '../http.js';
import { storeUpload } from './media.js';

// Handles every route that does not require a signed-in staff session.
// Returns a Response, or null if no route in this module matched.
export async function handlePublicRoute(request, env, pathname, method) {
  if (pathname === '/api/admissions' && method === 'POST') {
    const body = await readJson(request);
    const missing = requireFields(body, ['full-name', 'email', 'phone', 'school', 'schedule']);
    if (missing) return error(missing);
    if (!EMAIL_RE.test(body.email)) return error('Invalid email address.');

    await run(
      env.DB,
      `INSERT INTO applications (full_name, dob, email, phone, school, schedule, education, message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      body['full-name'], body.dob || null, body.email, body.phone,
      body.school, body.schedule, body.education || null, body.message || null
    );
    return json({ message: 'Application received.' }, 201);
  }

  if (pathname === '/api/contact' && method === 'POST') {
    const body = await readJson(request);
    const missing = requireFields(body, ['name', 'email', 'message']);
    if (missing) return error(missing);
    if (!EMAIL_RE.test(body.email)) return error('Invalid email address.');

    await run(
      env.DB,
      `INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)`,
      body.name, body.email, body.subject || null, body.message
    );
    return json({ message: 'Message received.' }, 201);
  }

  if (pathname === '/api/auth/student/register' && method === 'POST') {
    const body = await readJson(request);
    const missing = requireFields(body, ['full-name', 'email', 'password']);
    if (missing) return error(missing);
    if (!EMAIL_RE.test(body.email)) return error('Invalid email address.');
    if (String(body.password).length < 8) return error('Password must be at least 8 characters.');

    const existing = await first(env.DB, 'SELECT id FROM students WHERE email = ?', body.email);
    if (existing) return error('An account with that email already exists.', 409);

    const salt = generateSaltHex();
    const hash = await hashPassword(body.password, salt);
    const result = await run(
      env.DB,
      `INSERT INTO students (full_name, email, password_hash, password_salt, phone, dob, school, schedule, education)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      body['full-name'], body.email, hash, salt,
      body.phone || null, body.dob || null, body.school || null, body.schedule || null, body.education || null
    );
    const studentId = result.meta.last_row_id;
    const studentNumber = `SKC-${new Date().getFullYear()}-${String(studentId).padStart(4, '0')}`;
    await run(env.DB, 'UPDATE students SET student_number = ? WHERE id = ?', studentNumber, studentId);
    const session = await createSession(env.DB, studentId, 'student');
    return json({ message: 'Account created.' }, 201, {
      'Set-Cookie': sessionCookieHeader(session.token),
    });
  }

  if (pathname === '/api/auth/student/login' && method === 'POST') {
    const body = await readJson(request);
    const missing = requireFields(body, ['email', 'password']);
    if (missing) return error(missing);

    const student = await first(env.DB, 'SELECT * FROM students WHERE email = ?', body.email);
    if (!student) return error('Invalid email or password.', 401);
    const valid = await verifyPassword(body.password, student.password_salt, student.password_hash);
    if (!valid) return error('Invalid email or password.', 401);

    const session = await createSession(env.DB, student.id, 'student');
    return json({ message: 'Signed in.' }, 200, {
      'Set-Cookie': sessionCookieHeader(session.token),
    });
  }

  if (pathname === '/api/auth/staff/login' && method === 'POST') {
    const body = await readJson(request);
    const missing = requireFields(body, ['email', 'password']);
    if (missing) return error(missing);

    const staff = await first(env.DB, 'SELECT * FROM staff WHERE email = ?', body.email);
    if (!staff) return error('Invalid email or password.', 401);
    if (!staff.active) return error('This staff account has been deactivated.', 401);
    const valid = await verifyPassword(body.password, staff.password_salt, staff.password_hash);
    if (!valid) return error('Invalid email or password.', 401);

    const session = await createSession(env.DB, staff.id, 'staff');
    return json({ message: 'Signed in.' }, 200, {
      'Set-Cookie': sessionCookieHeader(session.token),
    });
  }

  if (pathname === '/api/auth/logout' && method === 'POST') {
    await deleteSession(request, env);
    return json({ message: 'Signed out.' }, 200, {
      'Set-Cookie': clearSessionCookieHeader(),
    });
  }

  if (pathname === '/api/me' && method === 'GET') {
    const user = await getSessionUser(request, env);
    if (!user) return error('Not signed in.', 401);
    return json({ user });
  }

  if (pathname === '/api/me/applications' && method === 'GET') {
    const user = await getSessionUser(request, env, 'student');
    if (!user) return error('Not signed in as a student.', 401);
    const rows = await all(
      env.DB,
      `SELECT id, school, schedule, status, created_at FROM applications WHERE email = ? ORDER BY created_at DESC`,
      user.email
    );
    return json({ items: rows });
  }

  if (pathname === '/api/me/enrollments' && method === 'GET') {
    const user = await getSessionUser(request, env, 'student');
    if (!user) return error('Not signed in as a student.', 401);
    const rows = await all(
      env.DB,
      `SELECT e.id, e.status, e.enrolled_at, e.completed_at, p.id AS program_id, p.title AS program_title, p.school, p.level
       FROM enrollments e JOIN programs p ON p.id = e.program_id
       WHERE e.student_id = ? ORDER BY e.enrolled_at DESC`,
      user.id
    );
    return json({ items: rows });
  }

  if (pathname === '/api/me/transcript' && method === 'GET') {
    const user = await getSessionUser(request, env, 'student');
    if (!user) return error('Not signed in as a student.', 401);
    const enrollments = await all(
      env.DB,
      `SELECT e.id, e.status, p.id AS program_id, p.title AS program_title, p.school
       FROM enrollments e JOIN programs p ON p.id = e.program_id WHERE e.student_id = ? ORDER BY e.enrolled_at`,
      user.id
    );
    for (const enrollment of enrollments) {
      enrollment.courses = await all(
        env.DB,
        `SELECT c.id, c.code, c.title, c.credit_hours, c.term, g.score, g.grade, g.remarks
         FROM courses c LEFT JOIN grades g ON g.course_id = c.id AND g.student_id = ?
         WHERE c.program_id = ? ORDER BY c.term, c.code`,
        user.id, enrollment.program_id
      );
    }
    return json({ full_name: user.full_name, student_number: user.student_number, enrollments });
  }

  if (pathname === '/api/me/id-card' && method === 'GET') {
    const user = await getSessionUser(request, env, 'student');
    if (!user) return error('Not signed in as a student.', 401);
    const enrollment = await first(
      env.DB,
      `SELECT p.title AS program_title, p.school, e.enrolled_at
       FROM enrollments e JOIN programs p ON p.id = e.program_id
       WHERE e.student_id = ? AND e.status = 'active' ORDER BY e.enrolled_at DESC`,
      user.id
    );
    const issuedAt = enrollment?.enrolled_at || user.created_at;
    const validUntil = new Date(issuedAt);
    validUntil.setFullYear(validUntil.getFullYear() + 1);
    return json({
      student_number: user.student_number,
      full_name: user.full_name,
      program_title: enrollment?.program_title || null,
      school: enrollment?.school || user.school || null,
      issued_at: issuedAt,
      valid_until: validUntil.toISOString(),
      photo_url: user.photo_media_id ? `/api/media/${user.photo_media_id}` : null,
    });
  }

  if (pathname === '/api/me/photo' && method === 'POST') {
    const user = await getSessionUser(request, env, 'student');
    if (!user) return error('Not signed in as a student.', 401);
    const form = await request.formData().catch(() => null);
    if (!form) return error('Expected multipart/form-data.');
    const result = await storeUpload(env, form.get('file'), 'id_photo', 'student', user.id);
    if (result.fail) return error(result.fail);
    await run(env.DB, 'UPDATE students SET photo_media_id = ? WHERE id = ?', result.id, user.id);
    return json({ photo_url: result.url });
  }

  const verifyMatch = pathname.match(/^\/api\/verify\/([A-Za-z0-9-]+)$/);
  if (verifyMatch && method === 'GET') {
    const student = await first(
      env.DB, 'SELECT full_name, school, created_at FROM students WHERE student_number = ?', verifyMatch[1]
    );
    if (!student) return error('No student found with that ID number.', 404);
    const enrollment = await first(
      env.DB,
      `SELECT p.title AS program_title FROM enrollments e JOIN programs p ON p.id = e.program_id
       WHERE e.student_id = (SELECT id FROM students WHERE student_number = ?) AND e.status = 'active'
       ORDER BY e.enrolled_at DESC`,
      verifyMatch[1]
    );
    return json({
      valid: true,
      full_name: student.full_name,
      program_title: enrollment?.program_title || null,
      student_since: student.created_at,
    });
  }

  if (pathname === '/api/me/password' && method === 'PATCH') {
    const user = await getSessionUser(request, env);
    if (!user) return error('Not signed in.', 401);
    const body = await readJson(request);
    const missing = requireFields(body, ['current_password', 'new_password']);
    if (missing) return error(missing);
    if (String(body.new_password).length < 8) return error('New password must be at least 8 characters.');

    const table = user.user_type === 'staff' ? 'staff' : 'students';
    const row = await first(env.DB, `SELECT * FROM ${table} WHERE id = ?`, user.id);
    const valid = await verifyPassword(body.current_password, row.password_salt, row.password_hash);
    if (!valid) return error('Current password is incorrect.', 401);

    const salt = generateSaltHex();
    const hash = await hashPassword(body.new_password, salt);
    await run(env.DB, `UPDATE ${table} SET password_hash = ?, password_salt = ? WHERE id = ?`, hash, salt, user.id);
    return json({ message: 'Password updated.' });
  }

  if (pathname === '/api/news' && method === 'GET') {
    const rows = await all(
      env.DB,
      `SELECT id, title, category, excerpt, body, gradient, published_at
       FROM news_posts WHERE status = 'published' ORDER BY published_at DESC`
    );
    return json({ items: rows });
  }

  if (pathname === '/api/programs' && method === 'GET') {
    const rows = await all(
      env.DB,
      `SELECT id, school, level, title, duration, description
       FROM programs WHERE status = 'published' ORDER BY school, sort_order`
    );
    return json({ items: rows });
  }

  if (pathname === '/api/gallery' && method === 'GET') {
    const rows = await all(
      env.DB,
      `SELECT id, category, caption, gradient, media_id
       FROM gallery_items WHERE status = 'published' ORDER BY sort_order`
    );
    return json({ items: rows.map((r) => ({ ...r, image_url: r.media_id ? `/api/media/${r.media_id}` : null })) });
  }

  if (pathname === '/api/departments' && method === 'GET') {
    const rows = await all(env.DB, 'SELECT id, key, name, description FROM departments ORDER BY sort_order');
    return json({ items: rows });
  }

  if (pathname === '/api/settings' && method === 'GET') {
    const rows = await all(env.DB, 'SELECT key, value FROM site_settings');
    const settings = {};
    for (const row of rows) settings[row.key] = row.value;
    return json({ settings });
  }

  return null;
}
