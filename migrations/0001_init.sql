CREATE TABLE IF NOT EXISTS docs (
  device  TEXT NOT NULL,
  col     TEXT NOT NULL,
  id      TEXT NOT NULL,
  data    TEXT NOT NULL,
  updated TEXT NOT NULL,
  PRIMARY KEY (device, col, id)
);
CREATE INDEX IF NOT EXISTS docs_by_col ON docs (device, col, updated);
