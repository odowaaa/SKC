import { all, first, run } from '../db.js';
import { json, error, readJson, requireFields } from '../http.js';
import { can } from '../rbac.js';
import { logAudit } from '../audit.js';

// Students, courses, enrollments, attendance, and grades (registrar-facing SIS).
// Returns a Response, or null if no route in this module matched.
export async function handleSisRoute(request, env, pathname, method, staffUser) {
  const url = new URL(request.url);

  // ---------- Students ----------
  if (pathname === '/api/admin/students' && method === 'GET') {
    if (!can(staffUser, 'students')) return error('Forbidden.', 403);
    const q = url.searchParams.get('q');
    const rows = q
      ? await all(
          env.DB,
          `SELECT id, full_name, email, student_number, school, schedule, created_at FROM students
           WHERE full_name LIKE ? OR email LIKE ? OR student_number LIKE ? ORDER BY created_at DESC`,
          `%${q}%`, `%${q}%`, `%${q}%`
        )
      : await all(env.DB, `SELECT id, full_name, email, student_number, school, schedule, created_at FROM students ORDER BY created_at DESC`);
    return json({ items: rows });
  }

  const studentMatch = pathname.match(/^\/api\/admin\/students\/(\d+)$/);
  if (studentMatch && method === 'GET') {
    if (!can(staffUser, 'students')) return error('Forbidden.', 403);
    const studentId = studentMatch[1];
    const student = await first(
      env.DB, 'SELECT id, full_name, email, student_number, phone, dob, school, schedule, education, created_at FROM students WHERE id = ?', studentId
    );
    if (!student) return error('Student not found.', 404);
    const enrollments = await all(
      env.DB,
      `SELECT e.id, e.status, e.enrolled_at, e.completed_at, p.id AS program_id, p.title AS program_title, p.school
       FROM enrollments e JOIN programs p ON p.id = e.program_id WHERE e.student_id = ? ORDER BY e.enrolled_at DESC`,
      studentId
    );
    const attendanceSummary = await all(
      env.DB,
      `SELECT course_id, status, count(*) c FROM attendance WHERE student_id = ? GROUP BY course_id, status`,
      studentId
    );
    const grades = await all(
      env.DB,
      `SELECT g.course_id, c.code, c.title, g.score, g.grade, g.remarks FROM grades g JOIN courses c ON c.id = g.course_id WHERE g.student_id = ?`,
      studentId
    );
    return json({ student, enrollments, attendanceSummary, grades });
  }

  // ---------- Courses ----------
  if (pathname === '/api/admin/courses' && method === 'GET') {
    if (!can(staffUser, 'courses')) return error('Forbidden.', 403);
    const programId = url.searchParams.get('program_id');
    const rows = programId
      ? await all(env.DB, 'SELECT * FROM courses WHERE program_id = ? ORDER BY term, code', programId)
      : await all(env.DB, 'SELECT * FROM courses ORDER BY program_id, term, code');
    return json({ items: rows });
  }
  if (pathname === '/api/admin/courses' && method === 'POST') {
    if (!can(staffUser, 'courses')) return error('Forbidden.', 403);
    const body = await readJson(request);
    const missing = requireFields(body, ['program_id', 'code', 'title']);
    if (missing) return error(missing);
    const result = await run(
      env.DB, `INSERT INTO courses (program_id, code, title, credit_hours, term) VALUES (?, ?, ?, ?, ?)`,
      body.program_id, body.code, body.title, body.credit_hours || 0, body.term || null
    );
    await logAudit(env.DB, staffUser, 'create', 'course', result.meta.last_row_id, { code: body.code });
    return json({ id: result.meta.last_row_id }, 201);
  }
  const courseMatch = pathname.match(/^\/api\/admin\/courses\/(\d+)$/);
  if (courseMatch && method === 'PUT') {
    if (!can(staffUser, 'courses')) return error('Forbidden.', 403);
    const body = await readJson(request);
    const missing = requireFields(body, ['program_id', 'code', 'title']);
    if (missing) return error(missing);
    await run(
      env.DB, `UPDATE courses SET program_id = ?, code = ?, title = ?, credit_hours = ?, term = ? WHERE id = ?`,
      body.program_id, body.code, body.title, body.credit_hours || 0, body.term || null, courseMatch[1]
    );
    await logAudit(env.DB, staffUser, 'update', 'course', courseMatch[1], { code: body.code });
    return json({ message: 'Updated.' });
  }
  if (courseMatch && method === 'DELETE') {
    if (!can(staffUser, 'courses')) return error('Forbidden.', 403);
    await run(env.DB, 'DELETE FROM courses WHERE id = ?', courseMatch[1]);
    await logAudit(env.DB, staffUser, 'delete', 'course', courseMatch[1]);
    return json({ message: 'Deleted.' });
  }

  // ---------- Enrollments ----------
  if (pathname === '/api/admin/enrollments' && method === 'GET') {
    if (!can(staffUser, 'enrollments')) return error('Forbidden.', 403);
    const studentId = url.searchParams.get('student_id');
    const rows = studentId
      ? await all(
          env.DB,
          `SELECT e.*, p.title AS program_title, p.school FROM enrollments e JOIN programs p ON p.id = e.program_id
           WHERE e.student_id = ? ORDER BY e.enrolled_at DESC`,
          studentId
        )
      : await all(
          env.DB,
          `SELECT e.*, p.title AS program_title, s.full_name AS student_name FROM enrollments e
           JOIN programs p ON p.id = e.program_id JOIN students s ON s.id = e.student_id ORDER BY e.enrolled_at DESC`
        );
    return json({ items: rows });
  }
  if (pathname === '/api/admin/enrollments' && method === 'POST') {
    if (!can(staffUser, 'enrollments')) return error('Forbidden.', 403);
    const body = await readJson(request);
    const missing = requireFields(body, ['student_id', 'program_id']);
    if (missing) return error(missing);
    const existing = await first(
      env.DB, `SELECT id FROM enrollments WHERE student_id = ? AND program_id = ? AND status = 'active'`,
      body.student_id, body.program_id
    );
    if (existing) return error('This student is already actively enrolled in that program.', 409);
    const result = await run(
      env.DB, `INSERT INTO enrollments (student_id, program_id) VALUES (?, ?)`, body.student_id, body.program_id
    );
    await logAudit(env.DB, staffUser, 'create', 'enrollment', result.meta.last_row_id, { student_id: body.student_id, program_id: body.program_id });
    return json({ id: result.meta.last_row_id }, 201);
  }
  const enrollMatch = pathname.match(/^\/api\/admin\/enrollments\/(\d+)$/);
  if (enrollMatch && method === 'PATCH') {
    if (!can(staffUser, 'enrollments')) return error('Forbidden.', 403);
    const body = await readJson(request);
    if (!body?.status) return error('Missing status.');
    const completedAt = body.status === 'completed' || body.status === 'withdrawn' ? new Date().toISOString() : null;
    await run(env.DB, `UPDATE enrollments SET status = ?, completed_at = ? WHERE id = ?`, body.status, completedAt, enrollMatch[1]);
    await logAudit(env.DB, staffUser, 'status_change', 'enrollment', enrollMatch[1], { status: body.status });
    return json({ message: 'Updated.' });
  }

  // ---------- Attendance ----------
  if (pathname === '/api/admin/attendance' && method === 'GET') {
    if (!can(staffUser, 'attendance')) return error('Forbidden.', 403);
    const courseId = url.searchParams.get('course_id');
    const date = url.searchParams.get('date');
    if (!courseId || !date) return error('course_id and date query params are required.');
    const course = await first(env.DB, 'SELECT program_id FROM courses WHERE id = ?', courseId);
    if (!course) return error('Course not found.', 404);
    const rows = await all(
      env.DB,
      `SELECT e.student_id, s.full_name, a.status FROM enrollments e
       JOIN students s ON s.id = e.student_id
       LEFT JOIN attendance a ON a.student_id = e.student_id AND a.course_id = ? AND a.date = ?
       WHERE e.program_id = ? AND e.status = 'active' ORDER BY s.full_name`,
      courseId, date, course.program_id
    );
    return json({ items: rows });
  }
  if (pathname === '/api/admin/attendance' && method === 'POST') {
    if (!can(staffUser, 'attendance')) return error('Forbidden.', 403);
    const body = await readJson(request);
    const missing = requireFields(body, ['course_id', 'date']);
    if (missing) return error(missing);
    if (!Array.isArray(body.records)) return error('records must be an array.');
    for (const record of body.records) {
      await run(
        env.DB,
        `INSERT INTO attendance (student_id, course_id, date, status, recorded_by) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(student_id, course_id, date) DO UPDATE SET status = excluded.status, recorded_by = excluded.recorded_by`,
        record.student_id, body.course_id, body.date, record.status, staffUser.id
      );
    }
    await logAudit(env.DB, staffUser, 'record', 'attendance', body.course_id, { date: body.date, count: body.records.length });
    return json({ message: 'Attendance recorded.' });
  }

  // ---------- Grades ----------
  if (pathname === '/api/admin/grades' && method === 'GET') {
    if (!can(staffUser, 'grades')) return error('Forbidden.', 403);
    const courseId = url.searchParams.get('course_id');
    if (!courseId) return error('course_id query param is required.');
    const course = await first(env.DB, 'SELECT program_id FROM courses WHERE id = ?', courseId);
    if (!course) return error('Course not found.', 404);
    const rows = await all(
      env.DB,
      `SELECT e.student_id, s.full_name, g.score, g.grade, g.remarks FROM enrollments e
       JOIN students s ON s.id = e.student_id
       LEFT JOIN grades g ON g.student_id = e.student_id AND g.course_id = ?
       WHERE e.program_id = ? AND e.status = 'active' ORDER BY s.full_name`,
      courseId, course.program_id
    );
    return json({ items: rows });
  }
  if (pathname === '/api/admin/grades' && method === 'POST') {
    if (!can(staffUser, 'grades')) return error('Forbidden.', 403);
    const body = await readJson(request);
    const missing = requireFields(body, ['student_id', 'course_id']);
    if (missing) return error(missing);
    await run(
      env.DB,
      `INSERT INTO grades (student_id, course_id, score, grade, remarks, recorded_by) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(student_id, course_id) DO UPDATE SET score = excluded.score, grade = excluded.grade, remarks = excluded.remarks, recorded_by = excluded.recorded_by, created_at = datetime('now')`,
      body.student_id, body.course_id, body.score ?? null, body.grade || null, body.remarks || null, staffUser.id
    );
    await logAudit(env.DB, staffUser, 'record', 'grade', body.course_id, { student_id: body.student_id, grade: body.grade });
    return json({ message: 'Grade saved.' });
  }

  return null;
}
