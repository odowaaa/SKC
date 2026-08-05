-- Phase 4: Site-wide settings manageable from the staff dashboard

CREATE TABLE site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO site_settings (key, value) VALUES
  ('contact_email', 'info@skc.college'),
  ('contact_phone', '+252 90 405 4460'),
  ('contact_address', 'Airport Road, Garowe, Puntland, Somalia'),
  ('site_tagline', 'Building Skills for a Better Future'),
  ('social_facebook', ''),
  ('social_twitter', ''),
  ('social_instagram', ''),
  ('office_hours', 'Sunday - Thursday, 8:00 AM - 4:00 PM');
