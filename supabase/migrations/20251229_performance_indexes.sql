-- Performance Optimization for 1M Users Scale

-- 1. Posts Fetching Optimization
-- Query: SELECT * FROM posts WHERE area = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_posts_area_created_at ON posts (area, created_at DESC);

-- 2. Kairanbans Fetching
-- Query: SELECT * FROM kairanbans WHERE community_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_kairanbans_community_date ON kairanbans (community_id, created_at DESC);

-- 3. Read Status Lookup optimization (High Frequency)
-- Query: SELECT * FROM kairanban_reads WHERE user_id = ? AND kairanban_id = ?
CREATE INDEX IF NOT EXISTS idx_kairanban_reads_lookup ON kairanban_reads (user_id, kairanban_id);

-- 4. Foreign Key Indexes (Postgres doesn't create them automatically)
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts (author_id);
-- CREATE INDEX IF NOT EXISTS idx_kairanbans_author_id ON kairanbans (author_id);
-- CREATE INDEX IF NOT EXISTS idx_user_coupons_user_id ON user_coupons (user_id);
CREATE INDEX IF NOT EXISTS idx_mission_participants_user_id ON mission_participants (user_id);

-- 5. Full Text Search (Future proofing for Search features)
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX idx_posts_content_search ON posts USING GIN (title gin_trgm_ops, content gin_trgm_ops);
