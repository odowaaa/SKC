-- Phase 2: Student Information System (courses, enrollments, attendance, grades, ID cards)

ALTER TABLE students ADD COLUMN student_number TEXT;
UPDATE students SET student_number = 'SKC-' || substr(created_at, 1, 4) || '-' || substr('0000' || id, -4, 4)
  WHERE student_number IS NULL;
CREATE UNIQUE INDEX idx_students_number ON students(student_number);

CREATE TABLE courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  program_id INTEGER NOT NULL REFERENCES programs(id),
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  credit_hours INTEGER NOT NULL DEFAULT 0,
  term TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id),
  program_id INTEGER NOT NULL REFERENCES programs(id),
  status TEXT NOT NULL DEFAULT 'active',  -- active | completed | withdrawn
  enrolled_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE TABLE attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id),
  course_id INTEGER NOT NULL REFERENCES courses(id),
  date TEXT NOT NULL,
  status TEXT NOT NULL,  -- present | absent | late | excused
  recorded_by INTEGER NOT NULL REFERENCES staff(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(student_id, course_id, date)
);

CREATE TABLE grades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id),
  course_id INTEGER NOT NULL REFERENCES courses(id),
  score REAL,
  grade TEXT,
  remarks TEXT,
  recorded_by INTEGER NOT NULL REFERENCES staff(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(student_id, course_id)
);

CREATE INDEX idx_courses_program ON courses(program_id);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_program ON enrollments(program_id);
CREATE INDEX idx_attendance_course_date ON attendance(course_id, date);
CREATE INDEX idx_grades_course ON grades(course_id);
