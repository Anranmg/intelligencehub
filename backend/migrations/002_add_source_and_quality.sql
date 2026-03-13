ALTER TABLE intelligence ADD COLUMN source_url TEXT;
ALTER TABLE intelligence ADD COLUMN quality_score REAL NOT NULL DEFAULT 0;

CREATE INDEX idx_intelligence_quality_score ON intelligence(quality_score DESC);
