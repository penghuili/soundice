CREATE TABLE IF NOT EXISTS favorites (
  user_id TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type = 'albums'),
  item_id TEXT NOT NULL,
  item_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS favorites_user_created_idx
  ON favorites (user_id, created_at DESC);
