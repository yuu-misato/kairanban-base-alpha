-- Clean up unused tables from legacy Ashibatch project
-- Leaving only Kairanban specific tables:
-- profiles, posts, comments, kairanbans, communities, community_members,
-- coupons, volunteer_missions, mission_participants, post_likes,
-- line_accounts, line_notification_settings

DROP TABLE IF EXISTS public.project_applications CASCADE;
DROP TABLE IF EXISTS public.contractor_listings CASCADE;
DROP TABLE IF EXISTS public.contractor_profiles CASCADE;
DROP TABLE IF EXISTS public.client_profiles CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.work_requests CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.partner_banners CASCADE;
DROP TABLE IF EXISTS public.faqs CASCADE;
DROP TABLE IF EXISTS public.contact_messages CASCADE;
DROP TABLE IF EXISTS public.partner_services CASCADE;

-- Clean up unused types if possible (might fail if used elsewhere, so ignore error)
DROP TYPE IF EXISTS public.app_role CASCADE;

-- Update handle_new_user to be pure Kairanban logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Simple profile creation
  INSERT INTO public.profiles (id, nickname, avatar_url, role)
  VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'nickname', '住民ユーザー'),
      new.raw_user_meta_data->>'avatar_url',
      -- Use 'resident' as default, but allow metadata to override (e.g. for admin creation)
      COALESCE(new.raw_user_meta_data->>'role', 'resident')
  )
  ON CONFLICT (id) DO UPDATE SET
      nickname = EXCLUDED.nickname,
      avatar_url = EXCLUDED.avatar_url;
      
  RETURN new;
END;
$$;
