-- Create Action Point Settings table
create table if not exists public.action_point_settings (
    id uuid default gen_random_uuid() primary key,
    action_key text unique not null,
    action_name text not null,
    description text,
    points_amount integer default 0,
    is_active boolean default true,
    max_times_per_day integer default null,
    cooldown_minutes integer default null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create Action Point History table
create table if not exists public.action_point_history (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id),
    action_key text references public.action_point_settings(action_key),
    points_granted integer not null,
    metadata jsonb default '{}'::jsonb,
    created_at timestamp with time zone default now()
);

-- RLS for settings
alter table action_point_settings enable row level security;
create policy "Admin read settings" on action_point_settings for select using (auth.jwt() ->> 'role' = 'admin' or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Admin update settings" on action_point_settings for update using (auth.jwt() ->> 'role' = 'admin' or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
-- Allow everyone to read settings (needed for frontend to know potential points? maybe)
-- For now, restrict to admin. If system needs it, use service role.

-- RLS for history
alter table action_point_history enable row level security;
create policy "User read own history" on action_point_history for select using (auth.uid() = user_id);
-- Inserts happen via server functions usually.

-- Insert default action: kairanban_read
insert into public.action_point_settings (action_key, action_name, description, points_amount, is_active)
values ('kairanban_read', '回覧板閲覧', '回覧板を「確認しました」にした時', 10, true)
on conflict (action_key) do nothing;
