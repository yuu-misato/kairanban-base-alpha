-- Security Fix: Allow users to insert their own profile during registration
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 1. DROP old policies to avoid conflicts
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- 2. CREATE correct policies

-- Allow SELECT for everyone (authenticated and anon) so users can see each other's nicknames/avatars
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

-- Allow INSERT only for own rows
CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow UPDATE only for own rows
CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);
