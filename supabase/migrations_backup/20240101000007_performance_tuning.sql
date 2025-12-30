-- PERFORMANCE TUNING MIGRATION

-- 1. Enable pg_trgm for text search optimization (if not enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Add Indexes for Frequent Queries

-- Posts: Filter by Area, Order by Created At, Filter by Author
CREATE INDEX IF NOT EXISTS idx_posts_area ON public.posts(area);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
-- Compound index for area + sort
CREATE INDEX IF NOT EXISTS idx_posts_area_created_at ON public.posts(area, created_at DESC);

-- Profiles: Lookup by ID is primary key (automatic), but searching by nickname might happen
CREATE INDEX IF NOT EXISTS idx_profiles_nickname_trgm ON public.profiles USING GIN (nickname gin_trgm_ops);

-- Comments: Filter by Post ID, Order by Created At
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id_created_at ON public.comments(post_id, created_at ASC);

-- Post Likes: Lookups by Post ID and User ID
-- Primary key covers (post_id, user_id), but we often query by user_id to find "likes by me"
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);

-- Communities: Filter by Owner, Invite Code
CREATE INDEX IF NOT EXISTS idx_communities_owner_id ON public.communities(owner_id);
CREATE INDEX IF NOT EXISTS idx_communities_invite_code ON public.communities(invite_code);

-- Community Members: Lookups for "My Communities" and "Community Members"
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON public.community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON public.community_members(community_id);

-- Kairanbans: Filter by Community, Area
CREATE INDEX IF NOT EXISTS idx_kairanbans_community_id ON public.kairanbans(community_id);
CREATE INDEX IF NOT EXISTS idx_kairanbans_area ON public.kairanbans(area);
CREATE INDEX IF NOT EXISTS idx_kairanbans_created_at ON public.kairanbans(created_at DESC);

-- Volunteer Missions: Filter by Area, Date
CREATE INDEX IF NOT EXISTS idx_missions_area ON public.volunteer_missions(area);

-- 3. Optimization for COUNT(*) queries (Estimate for large tables if needed, but strict count for now)

-- 4. Full Text Search support (future proofing)
-- Using simple config which exists in standard postgres distributions to avoid 'text search configuration does not exist' error.
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS fts tsvector GENERATED ALWAYS AS (to_tsvector('simple', title || ' ' || content)) STORED;
CREATE INDEX IF NOT EXISTS idx_posts_fts ON public.posts USING GIN (fts);
