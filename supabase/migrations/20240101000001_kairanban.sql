-- Enable Extensions
create extension if not exists "uuid-ossp";

-- 1. Profiles (Update existing or Create new)
-- Drop existing profiles if they conflict or alter them. We'll try to be additive.
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    nickname text,
    avatar_url text,
    role text default 'resident', -- resident, chokai_leader, business, admin
    level integer default 1,
    score integer default 0,
    selected_areas text[] default '{}',
    updated_at timestamp with time zone,
    created_at timestamp with time zone default now()
);

-- 2. Posts (Community Feed)
create table if not exists public.posts (
    id uuid default gen_random_uuid() primary key,
    author_id uuid references public.profiles(id),
    title text,
    content text,
    image_url text,
    category text, -- notice, event, crime_prevention, etc
    area text,
    likes integer default 0,
    created_at timestamp with time zone default now()
);

-- 3. Comments
create table if not exists public.comments (
    id uuid default gen_random_uuid() primary key,
    post_id uuid references public.posts(id) on delete cascade,
    user_id uuid references public.profiles(id),
    content text,
    created_at timestamp with time zone default now()
);

-- 4. Kairanbans (Circular Notices)
create table if not exists public.kairanbans (
    id uuid default gen_random_uuid() primary key,
    community_id uuid, -- nullable for public kairanbans
    author text, -- snapshot of author name or ref
    title text,
    content text,
    area text,
    sent_to_line boolean default false,
    points integer default 0,
    read_count integer default 0,
    created_at timestamp with time zone default now()
);

-- 5. Communities
create table if not exists public.communities (
    id uuid default gen_random_uuid() primary key,
    owner_id uuid references public.profiles(id),
    name text,
    description text,
    image_url text,
    invite_code text unique,
    is_secret boolean default false,
    members_count integer default 1,
    created_at timestamp with time zone default now()
);

-- 6. Community Members
create table if not exists public.community_members (
    id uuid default gen_random_uuid() primary key,
    community_id uuid references public.communities(id) on delete cascade,
    user_id uuid references public.profiles(id) on delete cascade,
    joined_at timestamp with time zone default now(),
    unique(community_id, user_id)
);

-- 7. Coupons
create table if not exists public.coupons (
    id uuid default gen_random_uuid() primary key,
    shop_name text,
    title text,
    description text,
    area text,
    image_url text,
    discount_rate text,
    required_score integer default 0,
    is_public boolean default true,
    created_at timestamp with time zone default now()
);

-- 8. Volunteer Missions
create table if not exists public.volunteer_missions (
    id uuid default gen_random_uuid() primary key,
    title text,
    description text,
    area text,
    points integer default 50,
    date text, -- Display date string
    max_participants integer default 10,
    current_participants integer default 0,
    created_at timestamp with time zone default now()
);

-- 9. Mission Participants
create table if not exists public.mission_participants (
    id uuid default gen_random_uuid() primary key,
    mission_id uuid references public.volunteer_missions(id) on delete cascade,
    user_id uuid references public.profiles(id) on delete cascade,
    status text default 'joined',
    created_at timestamp with time zone default now(),
    unique(mission_id, user_id)
);

-- 10. Post Likes (for atomicity)
create table if not exists public.post_likes (
    post_id uuid references public.posts(id) on delete cascade,
    user_id uuid references public.profiles(id) on delete cascade,
    created_at timestamp with time zone default now(),
    primary key (post_id, user_id)
);

-- RPC: Toggle Like
create or replace function toggle_like(p_id uuid, u_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  if exists (select 1 from public.post_likes where post_id = p_id and user_id = u_id) then
    delete from public.post_likes where post_id = p_id and user_id = u_id;
    update public.posts set likes = likes - 1 where id = p_id;
  else
    insert into public.post_likes (post_id, user_id) values (p_id, u_id);
    update public.posts set likes = likes + 1 where id = p_id;
  end if;
end;
$$;

-- RPC: Join Mission
create or replace function join_mission(m_id uuid, u_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  current_p integer;
  max_p integer;
begin
  -- Check existing join
  if exists (select 1 from public.mission_participants where mission_id = m_id and user_id = u_id) then
    return false;
  end if;

  -- Lock row
  select current_participants, max_participants into current_p, max_p
  from public.volunteer_missions where id = m_id for update;

  if current_p >= max_p then
    return false;
  end if;

  -- Join
  insert into public.mission_participants (mission_id, user_id) values (m_id, u_id);
  update public.volunteer_missions set current_participants = current_participants + 1 where id = m_id;
  
  -- Give points (optional logic)
  -- update public.profiles set score = score + (select points from public.volunteer_missions where id = m_id) where id = u_id;

  return true;
end;
$$;

-- RLS Policies (Simplified for development)
alter table profiles enable row level security;
create policy "Public read profiles" on profiles for select using (true);
create policy "User update own profile" on profiles for update using (auth.uid() = id);
create policy "User insert own profile" on profiles for insert with check (auth.uid() = id);

alter table posts enable row level security;
create policy "Public read posts" on posts for select using (true);
create policy "Auth create posts" on posts for insert with check (auth.role() = 'authenticated');
create policy "User update own posts" on posts for update using (auth.uid() = author_id);

alter table kairanbans enable row level security;
create policy "Public read kairanbans" on kairanbans for select using (true);
create policy "Auth create kairanbans" on kairanbans for insert with check (auth.role() = 'authenticated');

alter table communities enable row level security;
create policy "Public read communities" on communities for select using (true);
create policy "Auth create communities" on communities for insert with check (auth.role() = 'authenticated');

alter table coupons enable row level security;
create policy "Public read coupons" on coupons for select using (true);
create policy "Auth create coupons" on coupons for insert with check (auth.role() = 'authenticated');

alter table volunteer_missions enable row level security;
create policy "Public read missions" on volunteer_missions for select using (true);
create policy "Auth create missions" on volunteer_missions for insert with check (auth.role() = 'authenticated');

-- Grant permissions (if needed for anon access in dev)
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;

-- Update handle_new_user to support resident profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_roles_array text[];
  user_role app_role;
  raw_role text;
BEGIN
  -- Get raw role from metadata
  raw_role := new.raw_user_meta_data->>'role';

  -- If role is resident or null, creating a Base profile
  IF raw_role IS NULL OR raw_role = 'resident' THEN
      INSERT INTO public.profiles (id, nickname, avatar_url, role)
      VALUES (
          new.id,
          COALESCE(new.raw_user_meta_data->>'nickname', '住民ユーザー'),
          new.raw_user_meta_data->>'avatar_url',
          'resident'
      )
      ON CONFLICT (id) DO NOTHING;
      RETURN new;
  END IF;

  -- Logic for Ashibatch roles (contractor/client)
  user_roles_array := CASE 
    WHEN jsonb_typeof(new.raw_user_meta_data->'roles') = 'array' 
    THEN ARRAY(SELECT jsonb_array_elements_text(new.raw_user_meta_data->'roles'))
    ELSE ARRAY[raw_role]
  END;
  
  FOREACH raw_role IN ARRAY user_roles_array
  LOOP
    BEGIN
        user_role := raw_role::app_role;
        
        INSERT INTO public.user_roles (user_id, role)
        VALUES (new.id, user_role);
        
        IF user_role = 'contractor' THEN
          INSERT INTO public.contractor_profiles (
            id, email, company_name, postal_code, prefecture, address, service_areas
          )
          VALUES (
            new.id,
            new.email,
            new.raw_user_meta_data->>'company_name',
            new.raw_user_meta_data->>'postal_code',
            new.raw_user_meta_data->>'prefecture',
            new.raw_user_meta_data->>'address',
            COALESCE(ARRAY[new.raw_user_meta_data->>'prefecture'], ARRAY[]::text[])
          )
          ON CONFLICT (id) DO NOTHING;
        ELSIF user_role = 'client' THEN
          INSERT INTO public.client_profiles (
            id, email, company_name, postal_code, prefecture, address
          )
          VALUES (
            new.id,
            new.email,
            new.raw_user_meta_data->>'company_name',
            new.raw_user_meta_data->>'postal_code',
            new.raw_user_meta_data->>'prefecture',
            new.raw_user_meta_data->>'address'
          )
          ON CONFLICT (id) DO NOTHING;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
  END LOOP;
  
  RETURN new;
END;
$$;
