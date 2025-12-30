-- OPERATIONS & SUPPORT MIGRATION

-- 1. Support Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id), -- Nullable for guests
    email text, -- Contact email
    category text, -- bug, violation, question, other
    subject text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'open', -- open, in_progress, resolved, closed
    admin_note text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. Error Logs (Simple in-app monitoring)
CREATE TABLE IF NOT EXISTS public.error_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id),
    error_name text,
    error_message text,
    stack_trace text,
    url text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Reports (Violation Reports)
CREATE TABLE IF NOT EXISTS public.reports (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id uuid REFERENCES public.profiles(id),
    target_type text, -- post, comment, user
    target_id uuid, -- ID of the content or user
    reason text,
    status text DEFAULT 'pending', -- pending, reviewed, dismissed, acted
    created_at timestamp with time zone DEFAULT now()
);


-- RLS POLICIES

-- Support Tickets
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create tickets" ON support_tickets FOR INSERT WITH CHECK (true); -- Guests can also report
CREATE POLICY "Users can view own tickets" ON support_tickets FOR SELECT USING (auth.uid() = user_id);
-- Admins need full access (managed via app logic or separate RLS if admin role is strict DB role)
-- For now, we rely on application-level admin check for broader access, but let's add a policy if user has admin/chokai role in profiles? 
-- (Complex query inside RLS is heavy, sticking to basic owner access + service role for admin dashboard for now)

-- Error Logs
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can log errors" ON error_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "No one can read logs publicly" ON error_logs FOR SELECT USING (false); -- Only CSV export or admin dashboard via service role

-- Reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can report" ON reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "No one can read reports publicly" ON reports FOR SELECT USING (false);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
