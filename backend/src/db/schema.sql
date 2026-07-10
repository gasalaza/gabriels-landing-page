CREATE TABLE IF NOT EXISTS contact_submissions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL,
  project_type  TEXT    NOT NULL DEFAULT 'other',
  message       TEXT    NOT NULL,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  read          INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_submissions_created
  ON contact_submissions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_submissions_read
  ON contact_submissions(read);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id            TEXT    PRIMARY KEY,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  expires_at    TEXT    NOT NULL,
  ip            TEXT,
  user_agent    TEXT
);
