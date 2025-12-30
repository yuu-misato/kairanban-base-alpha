-- SECURE MIGRATION: RLS Hardening and Integrity Checks

-- 0. CLEANUP GHOST DATA (Fixes integrity violation)
DELETE FROM public.posts WHERE author_id IS NULL;
DELETE FROM public.communities WHERE owner_id IS NULL;
DELETE FROM public.comments WHERE user_id IS NULL OR post_id IS NULL;

-- 1. Disable all RLS first to reset
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE kairanbans DISABLE ROW LEVEL SECURITY;
ALTER TABLE communities DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_missions DISABLE ROW LEVEL SECURITY;
ALTER TABLE mission_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes DISABLE ROW LEVEL SECURITY;

-- 2. Drop existing weak policies
DROP POLICY IF EXISTS "Public read profiles" ON profiles;
DROP POLICY IF EXISTS "User update own profile" ON profiles;
DROP POLICY IF EXISTS "User insert own profile" ON profiles;
DROP POLICY IF EXISTS "Public read posts" ON posts;
DROP POLICY IF EXISTS "Auth create posts" ON posts;
DROP POLICY IF EXISTS "User update own posts" ON posts;
DROP POLICY IF EXISTS "Public read kairanbans" ON kairanbans;
DROP POLICY IF EXISTS "Auth create kairanbans" ON kairanbans;
DROP POLICY IF EXISTS "Public read communities" ON communities;
DROP POLICY IF EXISTS "Auth create communities" ON communities;

-- 3. Re-enable RLS with Strict Policies

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- POSTS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = author_id);

-- COMMENTS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- KAIRANBANS
ALTER TABLE kairanbans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Kairanbans are viewable by everyone" ON kairanbans FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create kairanbans" ON kairanbans FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- COMMUNITIES
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Communities are viewable by everyone" ON communities FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create communities" ON communities FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Owners can update community" ON communities FOR UPDATE USING (auth.uid() = owner_id);

-- COMMUNITY MEMBERS
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Community members are viewable by everyone" ON community_members FOR SELECT USING (true);
CREATE POLICY "Users can join communities" ON community_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave communities" ON community_members FOR DELETE USING (auth.uid() = user_id);

-- LIKES
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes are viewable by everyone" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- 4. Constraint Hardening (Data Integrity)
ALTER TABLE posts 
  ALTER COLUMN author_id SET NOT NULL,
  ALTER COLUMN content SET NOT NULL;

ALTER TABLE communities
  ALTER COLUMN owner_id SET NOT NULL,
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN invite_code SET NOT NULL;

ALTER TABLE comments
  ALTER COLUMN post_id SET NOT NULL,
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN content SET NOT NULL;

-- 5. Revoke dangerous permissions from Anon
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
