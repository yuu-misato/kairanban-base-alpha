-- Remove unused tables identified during code refactoring
-- These tables are no longer referenced in the application code.

-- Drop dependent tables (Blacklist functionality is unused)
DROP TABLE IF EXISTS blacklist_reports;
DROP TABLE IF EXISTS blacklist_companies;

-- Drop target tables
-- Use CASCADE to ensure any remaining policies or views referencing these tables are also removed.
DROP TABLE IF EXISTS line_link_codes CASCADE;
DROP TABLE IF EXISTS ai_chat_conversations CASCADE;
DROP TABLE IF EXISTS feature_badges CASCADE;
DROP TABLE IF EXISTS ashibakai_memberships CASCADE;
DROP TABLE IF EXISTS ashibakai_member_roster CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;

-- Note: The following tables are still referenced in the code, so they are kept:
-- households (Dashboard.tsx, KairanbanCard.tsx)
-- safety_reports (safetyService.ts)
-- partner_banners (possibly used in dynamic areas)
