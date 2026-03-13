CREATE TABLE intelligence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  content TEXT NOT NULL,
  image_data BLOB,
  structured_json TEXT,
  summary TEXT,
  contributor_name TEXT NOT NULL,
  category TEXT,
  rank_score REAL NOT NULL DEFAULT 0
);

CREATE INDEX idx_intelligence_created_at ON intelligence(created_at DESC);
CREATE INDEX idx_intelligence_contributor_name ON intelligence(contributor_name);
CREATE INDEX idx_intelligence_category ON intelligence(category);
CREATE INDEX idx_intelligence_summary ON intelligence(summary);
