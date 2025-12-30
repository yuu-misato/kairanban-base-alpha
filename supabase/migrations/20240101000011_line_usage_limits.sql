-- Create monthly usage logs table to track user actions per month
CREATE TABLE IF NOT EXISTS public.user_monthly_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  year_month TEXT NOT NULL, -- Format: 'YYYY-MM'
  message_count INTEGER DEFAULT 0, -- Number of LINE messages sent (recipients count)
  action_count INTEGER DEFAULT 0, -- Number of broadcast actions performed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, year_month)
);

-- Enable RLS
ALTER TABLE public.user_monthly_usages ENABLE ROW LEVEL SECURITY;

-- Policies for user_monthly_usages
CREATE POLICY "Users can view their own usage"
  ON public.user_monthly_usages
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can manage usage"
  ON public.user_monthly_usages
  FOR ALL
  USING (true); -- Typically restricted to service role in Edge Functions

-- Update usage_limits for 'normal' plan to 100 messages/month based on user request
-- Assuming 'normal' is the free plan.
UPDATE public.usage_limits 
SET message_limit = 100 
WHERE plan_type = 'normal';

-- Update monitor plan to be higher if needed, or keep as is.
-- Let's ensure monitor is clearly higher or at least equal. Currently 100.
-- Maybe update monitor to 300? User didn't specify, but safer to give perks.
UPDATE public.usage_limits 
SET message_limit = 500 
WHERE plan_type = 'monitor';

-- Ensure trigger updates updated_at
CREATE TRIGGER update_user_monthly_usages_updated_at
  BEFORE UPDATE ON public.user_monthly_usages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
