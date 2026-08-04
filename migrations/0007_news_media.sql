-- Phase 5: allow news posts to use an uploaded photo instead of a gradient placeholder.
ALTER TABLE news_posts ADD COLUMN media_id INTEGER REFERENCES media_files(id);
