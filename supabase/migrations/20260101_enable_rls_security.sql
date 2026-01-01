-- Enable RLS for security
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_participants ENABLE ROW LEVEL SECURITY;

-- Secure functions by setting search_path
-- Assuming uuid arguments based on usage. If error occurs, check argument types.
ALTER FUNCTION public.increment_member_count(uuid) SET search_path = public;
ALTER FUNCTION public.join_mission(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.toggle_like(uuid, uuid) SET search_path = public;
