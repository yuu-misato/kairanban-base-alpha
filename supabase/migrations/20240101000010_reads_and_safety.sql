-- Kairanban Reads Table
create table if not exists public.kairanban_reads (
    id uuid default gen_random_uuid() primary key,
    kairanban_id uuid references public.kairanbans(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade, -- Logged in user who performed the action
    household_member_id uuid references public.household_members(id) on delete set null, -- The member this read is for
    read_at timestamptz default now(),
    
    -- Constraint: A member can only read a kairanban once
    unique(kairanban_id, household_member_id),
    -- Constraint: If no member ID (legacy user), unique by user_id
    unique(kairanban_id, user_id)
);

alter table public.kairanban_reads enable row level security;

create policy "Users can modify their own reads"
    on public.kairanban_reads for all
    using (auth.uid() = user_id);

create policy "Users can view reads for their community"
    on public.kairanban_reads for select
    using (true); -- Simplified for now, should restrict to community members ideally


-- Safety Reports Table
create table if not exists public.safety_reports (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) not null, -- Who reported
    household_member_id uuid references public.household_members(id), -- Reporting for whom (null = self if no member record, or strictly require member?)
    -- Let's allow null household_member_id for legacy 'self' reporting
    
    status text not null check (status in ('safe', 'injured', 'unknown', 'help_needed')),
    message text,
    latitude double precision,
    longitude double precision,
    reported_at timestamptz default now()
);

alter table public.safety_reports enable row level security;

create policy "Users can manage their own safety reports"
    on public.safety_reports for all
    using (auth.uid() = user_id);

create policy "Community can view safety reports"
    on public.safety_reports for select
    using (true); -- Ideally restrict to same community/area
