-- Purpose: Consistent shared counts and bounded abuse protection for Daysforth.
-- Scope: Unique anonymous reactions, atomic count maintenance, and expiring rate buckets.
-- Does NOT belong: Personal information, raw visitor IDs, or raw network addresses.
CREATE TABLE reactions (
  post_id TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (post_id, visitor_hash)
);
CREATE TABLE reaction_totals (
  post_id TEXT PRIMARY KEY,
  count INTEGER NOT NULL CHECK (count >= 0)
);
CREATE TRIGGER reaction_added AFTER INSERT ON reactions BEGIN
  INSERT INTO reaction_totals (post_id, count) VALUES (NEW.post_id, 1)
  ON CONFLICT(post_id) DO UPDATE SET count = count + 1;
END;
CREATE TABLE reaction_limits (
  bucket TEXT PRIMARY KEY,
  hits INTEGER NOT NULL,
  expires INTEGER NOT NULL
);
CREATE INDEX reaction_limits_expiry ON reaction_limits(expires);
