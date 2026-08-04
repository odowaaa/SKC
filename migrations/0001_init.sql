CREATE TABLE students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  phone TEXT,
  dob TEXT,
  school TEXT,
  schedule TEXT,
  education TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  user_type TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  dob TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  school TEXT NOT NULL,
  schedule TEXT NOT NULL,
  education TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE news_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  excerpt TEXT,
  body TEXT,
  gradient TEXT NOT NULL DEFAULT 'from-primary-700 to-primary-900',
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE programs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school TEXT NOT NULL,
  level TEXT NOT NULL,
  title TEXT NOT NULL,
  duration TEXT,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE gallery_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  caption TEXT NOT NULL,
  gradient TEXT NOT NULL DEFAULT 'from-primary-600 to-primary-900',
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_sessions_user ON sessions(user_id, user_type);
CREATE INDEX idx_news_status ON news_posts(status, published_at);
CREATE INDEX idx_programs_school ON programs(school, status);
CREATE INDEX idx_gallery_category ON gallery_items(category, status);
