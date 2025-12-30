-- Cleanup ALL tables to ensure clean slate for 2024 schema migration
-- Drop tables from 20240101000001 (Chat/Community/Kairanban features)
DROP TABLE IF EXISTS public.post_likes CASCADE;
DROP TABLE IF EXISTS public.mission_participants CASCADE;
DROP TABLE IF EXISTS public.volunteer_missions CASCADE;
DROP TABLE IF EXISTS public.coupon_usages CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.kairanbans CASCADE;
DROP TABLE IF EXISTS public.community_members CASCADE;
DROP TABLE IF EXISTS public.read_receipts CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.communities CASCADE;

-- Drop tables from 20240101000000 (Base schema) and others
DROP TABLE IF EXISTS public.line_notification_settings CASCADE;
DROP TABLE IF EXISTS public.line_accounts CASCADE;
DROP TABLE IF EXISTS public.partner_services CASCADE;
DROP TABLE IF EXISTS public.contact_messages CASCADE;
DROP TABLE IF EXISTS public.faqs CASCADE;
DROP TABLE IF EXISTS public.partner_banners CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.work_requests CASCADE;
DROP TABLE IF EXISTS public.contractor_listings CASCADE;
DROP TABLE IF EXISTS public.project_applications CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.client_profiles CASCADE;
DROP TABLE IF EXISTS public.contractor_profiles CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.site_settings CASCADE;
DROP TABLE IF EXISTS public.line_link_codes CASCADE;
DROP TABLE IF EXISTS public.ai_chat_conversations CASCADE;
DROP TABLE IF EXISTS public.withdrawal_logs CASCADE;
DROP TABLE IF EXISTS public.feature_badges CASCADE;
DROP TABLE IF EXISTS public.legacy_members CASCADE;
DROP TABLE IF EXISTS public.ashibakai_memberships CASCADE;
DROP TABLE IF EXISTS public.quick_reply_templates CASCADE;
DROP TABLE IF EXISTS public.project_templates CASCADE;
DROP TABLE IF EXISTS public.referrals CASCADE;
DROP TABLE IF EXISTS public.ashibakai_member_roster CASCADE;
DROP TABLE IF EXISTS public.user_plans CASCADE;
DROP TABLE IF EXISTS public.usage_limits CASCADE;
DROP TABLE IF EXISTS public.usage_addons CASCADE;
DROP TABLE IF EXISTS public.user_addon_purchases CASCADE;
DROP TABLE IF EXISTS public.project_notes CASCADE;
DROP TABLE IF EXISTS public.lab_features CASCADE;
DROP TABLE IF EXISTS public.line_notification_templates CASCADE;
DROP TABLE IF EXISTS public.affiliates CASCADE;
DROP TABLE IF EXISTS public.affiliate_referrals CASCADE;
DROP TABLE IF EXISTS public.affiliate_payouts CASCADE;
DROP TABLE IF EXISTS public.affiliate_points CASCADE;
DROP TABLE IF EXISTS public.affiliate_point_transactions CASCADE;
DROP TABLE IF EXISTS public.partner_coupons CASCADE;
DROP TABLE IF EXISTS public.affiliate_coupon_claims CASCADE;
DROP TABLE IF EXISTS public.affiliate_withdrawal_requests CASCADE;
DROP TABLE IF EXISTS public.user_monthly_usages CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;
DROP TABLE IF EXISTS public.error_logs CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.blacklist_companies CASCADE;
DROP TABLE IF EXISTS public.blacklist_reports CASCADE;
DROP TABLE IF EXISTS public.user_points CASCADE;
DROP TABLE IF EXISTS public.user_point_transactions CASCADE;
DROP TABLE IF EXISTS public.point_expiry_settings CASCADE;
DROP TABLE IF EXISTS public.referral_codes CASCADE;
DROP TABLE IF EXISTS public.referral_code_uses CASCADE;
DROP TABLE IF EXISTS public.action_point_settings CASCADE;
DROP TABLE IF EXISTS public.action_point_history CASCADE;
DROP TABLE IF EXISTS public.user_withdrawal_requests CASCADE;
DROP TABLE IF EXISTS public.user_coupon_claims CASCADE;

-- Drop types
DROP TYPE IF EXISTS public.app_role CASCADE;

-- Drop Storage Policies (from 20240101000000)
DROP POLICY IF EXISTS "Anyone can view project images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload project images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own project images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own project images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view partner banner images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload partner banner images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update partner banner images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete partner banner images" ON storage.objects;
