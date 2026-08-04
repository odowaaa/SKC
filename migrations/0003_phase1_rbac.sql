-- Phase 1: RBAC, departments, audit log, dashboard analytics support

ALTER TABLE staff ADD COLUMN active INTEGER NOT NULL DEFAULT 1;

-- Normalize the seeded admin into the new role model (safe no-op if already set)
UPDATE staff SET role = 'super_admin' WHERE email = 'admin@somalikingcollege.edu.so';

CREATE TABLE departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,          -- stable slug used by programs.school / applications.school
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO departments (key, name, description, sort_order) VALUES
  ('english', 'School of English & Communication', 'English proficiency, communication, and language skills programs.', 1),
  ('it', 'School of Information Technology', 'Computing, networking, and applied IT programs.', 2),
  ('engineering', 'School of Engineering & Technical Studies', 'Construction, electrical, and technical trades programs.', 3),
  ('social-services', 'School of Social & Human Services', 'Social work, community development, and human services programs.', 4),
  ('health', 'School of Health Skills', 'Community health and allied health skills programs.', 5);

CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id INTEGER NOT NULL,
  staff_name TEXT NOT NULL,
  action TEXT NOT NULL,              -- e.g. 'create', 'update', 'delete', 'status_change'
  entity_type TEXT NOT NULL,         -- e.g. 'application', 'news_post', 'staff'
  entity_id TEXT,
  details TEXT,                      -- free-form JSON string with a short summary of what changed
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_staff_active ON staff(active);
