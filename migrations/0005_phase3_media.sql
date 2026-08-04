-- Phase 3: R2-backed file/media management

CREATE TABLE media_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  r2_key TEXT UNIQUE NOT NULL,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'general',  -- gallery | id_photo | general
  uploaded_by_type TEXT NOT NULL,           -- staff | student
  uploaded_by_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_media_purpose ON media_files(purpose);

ALTER TABLE gallery_items ADD COLUMN media_id INTEGER REFERENCES media_files(id);
ALTER TABLE students ADD COLUMN photo_media_id INTEGER REFERENCES media_files(id);
