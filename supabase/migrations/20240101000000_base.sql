-- Create role enum
create type public.app_role as enum ('client', 'contractor');

-- Create user_roles table
create table public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role app_role not null,
    unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Create contractor profiles table
create table public.contractor_profiles (
  id uuid not null references auth.users on delete cascade primary key,
  email text not null,
  company_name text not null,
  postal_code text not null,
  prefecture text not null,
  address text not null,
  phone text,
  mobile_phone text,
  website_url text,
  avatar_url text,
  representative text,
  capital text,
  founded_year text,
  corporate_number text,
  employee_count text,
  company_description text,
  service_areas text[] not null default '{}',
  certifications text[] default '{}',
  equipment text[] default '{}',
  vehicles text[] default '{}',
  payment_cycle text,
  payment_method text,
  payment_method_other text,
  referral_code text,
  has_legal_entity boolean default false,
  has_construction_permit boolean default false,
  has_invoice_support boolean default false,
  has_social_insurance boolean default false,
  has_safety_documents boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.contractor_profiles enable row level security;

-- Create client profiles table
create table public.client_profiles (
  id uuid not null references auth.users on delete cascade primary key,
  email text not null,
  company_name text not null,
  postal_code text not null,
  prefecture text not null,
  address text not null,
  phone text,
  mobile_phone text,
  website_url text,
  avatar_url text,
  representative text,
  company_description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.client_profiles enable row level security;

-- RLS Policies for user_roles
create policy "Users can view their own roles"
on public.user_roles for select
to authenticated
using (auth.uid() = user_id);

-- RLS Policies for contractor_profiles
create policy "Contractors can view their own profile"
on public.contractor_profiles for select
to authenticated
using (auth.uid() = id);

create policy "Contractors can update their own profile"
on public.contractor_profiles for update
to authenticated
using (auth.uid() = id);

create policy "Anyone can view contractor profiles"
on public.contractor_profiles for select
to authenticated
using (true);

-- RLS Policies for client_profiles
create policy "Clients can view their own profile"
on public.client_profiles for select
to authenticated
using (auth.uid() = id);

create policy "Clients can update their own profile"
on public.client_profiles for update
to authenticated
using (auth.uid() = id);

create policy "Anyone can view client profiles"
on public.client_profiles for select
to authenticated
using (true);

-- Trigger function to create profile based on role
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  user_role app_role;
begin
  -- Get the role from user metadata
  user_role := (new.raw_user_meta_data->>'role')::app_role;
  
  -- Insert into user_roles
  insert into public.user_roles (user_id, role)
  values (new.id, user_role);
  
  -- Create appropriate profile
  if user_role = 'contractor' then
    insert into public.contractor_profiles (
      id, email, company_name, postal_code, prefecture, address
    )
    values (
      new.id,
      new.email,
      new.raw_user_meta_data->>'company_name',
      new.raw_user_meta_data->>'postal_code',
      new.raw_user_meta_data->>'prefecture',
      new.raw_user_meta_data->>'address'
    );
  elsif user_role = 'client' then
    insert into public.client_profiles (
      id, email, company_name, postal_code, prefecture, address
    )
    values (
      new.id,
      new.email,
      new.raw_user_meta_data->>'company_name',
      new.raw_user_meta_data->>'postal_code',
      new.raw_user_meta_data->>'prefecture',
      new.raw_user_meta_data->>'address'
    );
  end if;
  
  return new;
end;
$$;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();-- Create projects table for job postings
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  construction_type TEXT NOT NULL CHECK (construction_type IN ('private', 'public')),
  work_start_date DATE,
  work_end_date DATE,
  work_period_negotiable BOOLEAN DEFAULT false,
  application_deadline DATE NOT NULL,
  budget_amount NUMERIC(12, 0),
  budget_negotiable BOOLEAN DEFAULT false,
  prefecture TEXT NOT NULL,
  city TEXT,
  publication_deadline DATE NOT NULL,
  publication_status TEXT NOT NULL DEFAULT 'published' CHECK (publication_status IN ('published', 'draft')),
  description TEXT,
  payment_cycle TEXT CHECK (payment_cycle IN ('current_month', 'next_month', 'two_months_later', 'other')),
  payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'cash', 'promissory_note', 'other')),
  thumbnail_url TEXT,
  requires_legal_entity BOOLEAN,
  requires_construction_permit BOOLEAN,
  requires_invoice_support BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Policies for projects
CREATE POLICY "Anyone can view published projects"
  ON public.projects
  FOR SELECT
  USING (publication_status = 'published');

CREATE POLICY "Clients can view their own projects"
  ON public.projects
  FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can create projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (auth.uid() = client_id AND public.has_role(auth.uid(), 'client'));

CREATE POLICY "Clients can update their own projects"
  ON public.projects
  FOR UPDATE
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can delete their own projects"
  ON public.projects
  FOR DELETE
  USING (auth.uid() = client_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for project images
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for project images
CREATE POLICY "Anyone can view project images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'project-images');

CREATE POLICY "Authenticated users can upload project images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'project-images' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update their own project images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'project-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own project images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'project-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );-- Fix search_path for update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;-- Update handle_new_user function to support multiple roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_roles_array text[];
  user_role app_role;
BEGIN
  -- Get roles from user metadata (can be array or single value)
  user_roles_array := CASE 
    WHEN jsonb_typeof(new.raw_user_meta_data->'roles') = 'array' 
    THEN ARRAY(SELECT jsonb_array_elements_text(new.raw_user_meta_data->'roles'))
    ELSE ARRAY[new.raw_user_meta_data->>'role']
  END;
  
  -- Insert roles into user_roles table
  FOREACH user_role IN ARRAY user_roles_array::app_role[]
  LOOP
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, user_role);
    
    -- Create appropriate profiles based on roles
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
  END LOOP;
  
  RETURN new;
END;
$$;-- Create favorites table for liked projects
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now()
);

-- Create follows table for following companies
CREATE TABLE public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text,
  type text DEFAULT 'info',
  is_read boolean DEFAULT false,
  link text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create project applications table
CREATE TABLE public.project_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  contractor_id uuid NOT NULL,
  status text DEFAULT 'pending',
  message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(project_id, contractor_id)
);

-- Create contractor listings (受注希望案件) table
CREATE TABLE public.contractor_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  service_areas text[] DEFAULT '{}',
  construction_types text[] DEFAULT '{}',
  available_from date,
  available_to date,
  budget_min numeric,
  budget_max numeric,
  publication_status text DEFAULT 'published',
  view_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add view_count to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;

-- Enable RLS on all new tables
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_listings ENABLE ROW LEVEL SECURITY;

-- RLS policies for favorites
CREATE POLICY "Users can view their own favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create favorites" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own favorites" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for follows
CREATE POLICY "Users can view their follows" ON public.follows FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);
CREATE POLICY "Users can create follows" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can delete their follows" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- RLS policies for messages
CREATE POLICY "Users can view their messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update their received messages" ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);

-- RLS policies for notifications
CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for project_applications
CREATE POLICY "Contractors can view their applications" ON public.project_applications FOR SELECT USING (auth.uid() = contractor_id);
CREATE POLICY "Project owners can view applications" ON public.project_applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND client_id = auth.uid())
);
CREATE POLICY "Contractors can create applications" ON public.project_applications FOR INSERT WITH CHECK (auth.uid() = contractor_id AND has_role(auth.uid(), 'contractor'));
CREATE POLICY "Contractors can update their applications" ON public.project_applications FOR UPDATE USING (auth.uid() = contractor_id);
CREATE POLICY "Project owners can update applications" ON public.project_applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND client_id = auth.uid())
);

-- RLS policies for contractor_listings
CREATE POLICY "Anyone can view published contractor listings" ON public.contractor_listings FOR SELECT USING (publication_status = 'published');
CREATE POLICY "Contractors can view their own listings" ON public.contractor_listings FOR SELECT USING (auth.uid() = contractor_id);
CREATE POLICY "Contractors can create listings" ON public.contractor_listings FOR INSERT WITH CHECK (auth.uid() = contractor_id AND has_role(auth.uid(), 'contractor'));
CREATE POLICY "Contractors can update their listings" ON public.contractor_listings FOR UPDATE USING (auth.uid() = contractor_id);
CREATE POLICY "Contractors can delete their listings" ON public.contractor_listings FOR DELETE USING (auth.uid() = contractor_id);

-- Enable realtime for messages and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;-- Create reviews/ratings table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id UUID NOT NULL,
  target_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(reviewer_id, target_id)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view reviews"
ON public.reviews
FOR SELECT
USING (true);

CREATE POLICY "Users can create reviews"
ON public.reviews
FOR INSERT
WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update their own reviews"
ON public.reviews
FOR UPDATE
USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete their own reviews"
ON public.reviews
FOR DELETE
USING (auth.uid() = reviewer_id);

-- Trigger for updated_at
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add member_id column to favorites table for member favorites
ALTER TABLE public.favorites ADD COLUMN member_id UUID;

-- Update favorites RLS to handle member favorites
DROP POLICY IF EXISTS "Users can create favorites" ON public.favorites;
CREATE POLICY "Users can create favorites"
ON public.favorites
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create work_requests table for job requests
CREATE TABLE public.work_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  target_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.work_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their work requests"
ON public.work_requests
FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = target_id);

CREATE POLICY "Users can create work requests"
ON public.work_requests
FOR INSERT
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Target users can update work requests"
ON public.work_requests
FOR UPDATE
USING (auth.uid() = target_id OR auth.uid() = requester_id);

-- Trigger for updated_at
CREATE TRIGGER update_work_requests_updated_at
BEFORE UPDATE ON public.work_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();-- Drop existing INSERT policy for reviews
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;

-- Create new INSERT policy that only allows users who completed work to review
CREATE POLICY "Only clients who completed work can create reviews" 
ON public.reviews 
FOR INSERT 
WITH CHECK (
  auth.uid() = reviewer_id
  AND EXISTS (
    SELECT 1 FROM public.work_requests
    WHERE requester_id = auth.uid()
      AND target_id = reviews.target_id
      AND status = 'completed'
  )
);-- Add 'admin' to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'admin';-- Create announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create partner_banners table
CREATE TABLE public.partner_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  gradient_from TEXT NOT NULL DEFAULT '#3b82f6',
  gradient_to TEXT NOT NULL DEFAULT '#2563eb',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create faqs table
CREATE TABLE public.faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Announcements policies
CREATE POLICY "Anyone can view published announcements" 
ON public.announcements 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Admins can do everything on announcements" 
ON public.announcements 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Partner banners policies
CREATE POLICY "Anyone can view active partner banners" 
ON public.partner_banners 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can do everything on partner banners" 
ON public.partner_banners 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- FAQs policies
CREATE POLICY "Anyone can view published faqs" 
ON public.faqs 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Admins can do everything on faqs" 
ON public.faqs 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add triggers for updated_at
CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partner_banners_updated_at
BEFORE UPDATE ON public.partner_banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at
BEFORE UPDATE ON public.faqs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();-- Add image_url column to partner_banners
ALTER TABLE partner_banners ADD COLUMN image_url text;

-- Create storage bucket for partner banner images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('partner-banners', 'partner-banners', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view partner banner images"
ON storage.objects FOR SELECT
USING (bucket_id = 'partner-banners');

CREATE POLICY "Admins can upload partner banner images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'partner-banners' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update partner banner images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'partner-banners' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete partner banner images"
ON storage.objects FOR DELETE
USING (bucket_id = 'partner-banners' AND has_role(auth.uid(), 'admin'::app_role));-- Create contact_messages table
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  email text NOT NULL,
  category text DEFAULT 'general',
  subject text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Users can create contact messages
CREATE POLICY "Anyone can create contact messages"
ON public.contact_messages
FOR INSERT
WITH CHECK (true);

-- Users can view their own messages
CREATE POLICY "Users can view their own contact messages"
ON public.contact_messages
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can do everything
CREATE POLICY "Admins can do everything on contact messages"
ON public.contact_messages
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));-- Create partner_services table
CREATE TABLE public.partner_services (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  icon_name text NOT NULL DEFAULT 'Building',
  url text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_services ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can do everything on partner services"
ON public.partner_services
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active partner services"
ON public.partner_services
FOR SELECT
USING (is_active = true);-- LINE accounts table to store user-LINE connections
CREATE TABLE public.line_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  line_user_id TEXT NOT NULL UNIQUE,
  display_name TEXT,
  picture_url TEXT,
  status_message TEXT,
  is_notification_enabled BOOLEAN DEFAULT true,
  linked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- LINE notification settings per user
CREATE TABLE public.line_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  new_message BOOLEAN DEFAULT true,
  new_application BOOLEAN DEFAULT true,
  project_update BOOLEAN DEFAULT true,
  announcement BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.line_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.line_notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for line_accounts
CREATE POLICY "Users can view their own LINE account"
ON public.line_accounts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own LINE account"
ON public.line_accounts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own LINE account"
ON public.line_accounts FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Service can insert LINE accounts"
ON public.line_accounts FOR INSERT
WITH CHECK (true);

-- RLS policies for line_notification_settings
CREATE POLICY "Users can view their own notification settings"
ON public.line_notification_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings"
ON public.line_notification_settings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings"
ON public.line_notification_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_line_accounts_updated_at
BEFORE UPDATE ON public.line_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_line_notification_settings_updated_at
BEFORE UPDATE ON public.line_notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();-- Allow admins to manage user roles
CREATE POLICY "Admins can manage user roles"
ON public.user_roles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));-- Allow admins to view all messages
CREATE POLICY "Admins can view all messages"
ON public.messages
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete messages
CREATE POLICY "Admins can delete messages"
ON public.messages
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));-- Create site_settings table for managing service name and logo
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view site settings
CREATE POLICY "Anyone can view site settings"
ON public.site_settings
FOR SELECT
USING (true);

-- Admins can manage site settings
CREATE POLICY "Admins can manage site settings"
ON public.site_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default values
INSERT INTO public.site_settings (key, value) VALUES
  ('service_name', 'アシバッチ'),
  ('logo_url', NULL);

-- Add trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();-- Add new notification type columns to line_notification_settings
ALTER TABLE public.line_notification_settings
ADD COLUMN IF NOT EXISTS work_request boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS application_result boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS new_follower boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS new_review boolean DEFAULT true;-- Create table for temporary link codes
CREATE TABLE public.line_link_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id text NOT NULL,
  display_name text,
  picture_url text,
  code text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.line_link_codes ENABLE ROW LEVEL SECURITY;

-- Policy for service to insert codes (from webhook)
CREATE POLICY "Service can insert link codes"
ON public.line_link_codes
FOR INSERT
WITH CHECK (true);

-- Policy for service to update codes (mark as used)
CREATE POLICY "Service can update link codes"
ON public.line_link_codes
FOR UPDATE
USING (true);

-- Policy for reading codes (for verification)
CREATE POLICY "Anyone can read valid codes"
ON public.line_link_codes
FOR SELECT
USING (used_at IS NULL AND expires_at > now());

-- Index for faster lookup
CREATE INDEX idx_line_link_codes_code ON public.line_link_codes(code);
CREATE INDEX idx_line_link_codes_expires ON public.line_link_codes(expires_at);-- Create table for AI chat conversations
CREATE TABLE public.ai_chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  escalated_at TIMESTAMP WITH TIME ZONE,
  escalation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_chat_conversations ENABLE ROW LEVEL SECURITY;

-- Users can create conversations
CREATE POLICY "Anyone can create conversations"
ON public.ai_chat_conversations
FOR INSERT
WITH CHECK (true);

-- Users can update their own conversations
CREATE POLICY "Users can update their conversations"
ON public.ai_chat_conversations
FOR UPDATE
USING (user_id = auth.uid() OR user_id IS NULL);

-- Users can view their own conversations
CREATE POLICY "Users can view their own conversations"
ON public.ai_chat_conversations
FOR SELECT
USING (user_id = auth.uid() OR user_id IS NULL);

-- Admins can do everything
CREATE POLICY "Admins can manage all conversations"
ON public.ai_chat_conversations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_ai_chat_conversations_updated_at
BEFORE UPDATE ON public.ai_chat_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();-- Create withdrawal_logs table to store withdrawal reasons
CREATE TABLE public.withdrawal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT,
  reason TEXT,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.withdrawal_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view withdrawal logs
CREATE POLICY "Admins can view withdrawal logs"
ON public.withdrawal_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service can insert withdrawal logs (via edge function with service role)
CREATE POLICY "Service can insert withdrawal logs"
ON public.withdrawal_logs
FOR INSERT
WITH CHECK (true);-- Add RLS policy for admins to view all LINE accounts
CREATE POLICY "Admins can view all LINE accounts"
ON public.line_accounts
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));-- Create feature_badges table for managing New badges
CREATE TABLE public.feature_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL UNIQUE,
  feature_name TEXT NOT NULL,
  is_new BOOLEAN DEFAULT false,
  badge_text TEXT DEFAULT 'New',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert initial data for all menu items
INSERT INTO feature_badges (feature_key, feature_name, display_order) VALUES
('dashboard', 'ダッシュボード', 1),
('messages', 'メッセージ', 2),
('favorites', 'お気に入り', 3),
('follows', 'フォロー', 4),
('members', '会員一覧', 5),
('create-project', '案件を登録', 6),
('my-projects', '自分の案件', 7),
('contractors', '受注者を探す', 8),
('create-listing', '募集を登録', 9),
('my-listings', '自分の募集', 10),
('projects', '案件を探す', 11),
('my-applications', '応募履歴', 12);

-- Enable RLS
ALTER TABLE public.feature_badges ENABLE ROW LEVEL SECURITY;

-- Anyone can view feature badges
CREATE POLICY "Anyone can view feature badges" ON public.feature_badges
  FOR SELECT USING (true);

-- Admins can manage feature badges
CREATE POLICY "Admins can manage feature badges" ON public.feature_badges
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_feature_badges_updated_at
  BEFORE UPDATE ON public.feature_badges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();-- Add RLS policies for admins to update client and contractor profiles

CREATE POLICY "Admins can update client profiles"
ON public.client_profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update contractor profiles"
ON public.contractor_profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));-- Add service_areas column to projects table for multiple area selection
ALTER TABLE projects ADD COLUMN IF NOT EXISTS service_areas text[] DEFAULT '{}'::text[];

-- Migrate existing data from prefecture/city to service_areas format
UPDATE projects 
SET service_areas = ARRAY[
  CASE 
    WHEN city IS NOT NULL AND city != '' 
    THEN prefecture || ':' || city
    ELSE prefecture
  END
]
WHERE prefecture IS NOT NULL AND (service_areas IS NULL OR service_areas = '{}');-- Add new_project_in_area column to line_notification_settings
ALTER TABLE line_notification_settings 
ADD COLUMN new_project_in_area boolean DEFAULT true;-- Add is_individual column to profiles
ALTER TABLE contractor_profiles 
  ADD COLUMN IF NOT EXISTS is_individual boolean DEFAULT false;

ALTER TABLE client_profiles 
  ADD COLUMN IF NOT EXISTS is_individual boolean DEFAULT false;

-- Make address-related fields nullable (for simplified registration)
ALTER TABLE contractor_profiles 
  ALTER COLUMN postal_code DROP NOT NULL,
  ALTER COLUMN prefecture DROP NOT NULL,
  ALTER COLUMN address DROP NOT NULL;

ALTER TABLE contractor_profiles 
  ALTER COLUMN postal_code SET DEFAULT '',
  ALTER COLUMN prefecture SET DEFAULT '',
  ALTER COLUMN address SET DEFAULT '';

ALTER TABLE client_profiles 
  ALTER COLUMN postal_code DROP NOT NULL,
  ALTER COLUMN prefecture DROP NOT NULL,
  ALTER COLUMN address DROP NOT NULL;

ALTER TABLE client_profiles 
  ALTER COLUMN postal_code SET DEFAULT '',
  ALTER COLUMN prefecture SET DEFAULT '',
  ALTER COLUMN address SET DEFAULT '';-- Create legacy_members table for migrating existing users
CREATE TABLE public.legacy_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mid TEXT UNIQUE NOT NULL,
  email TEXT,
  company_type TEXT,
  company_name TEXT,
  representative TEXT,
  phone TEXT,
  postal_code TEXT,
  prefecture TEXT,
  address TEXT,
  website_url TEXT,
  founded_year TEXT,
  capital TEXT,
  employee_count TEXT,
  service_areas TEXT[] DEFAULT '{}',
  payment_cycle TEXT,
  payment_method TEXT,
  certifications TEXT[] DEFAULT '{}',
  vehicles TEXT[] DEFAULT '{}',
  equipment TEXT[] DEFAULT '{}',
  has_invoice_support BOOLEAN DEFAULT false,
  has_construction_permit BOOLEAN DEFAULT false,
  has_social_insurance BOOLEAN DEFAULT false,
  has_safety_documents BOOLEAN DEFAULT false,
  company_description TEXT,
  migrated_at TIMESTAMPTZ,
  migrated_user_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.legacy_members ENABLE ROW LEVEL SECURITY;

-- Admins can manage legacy members
CREATE POLICY "Admins can manage legacy members"
  ON public.legacy_members FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Service can read legacy members (for edge functions during registration)
CREATE POLICY "Service can read legacy members"
  ON public.legacy_members FOR SELECT
  USING (true);

-- Service can update legacy members (to mark as migrated)
CREATE POLICY "Service can update legacy members"
  ON public.legacy_members FOR UPDATE
  USING (true);-- Create ashibakai_memberships table
CREATE TABLE public.ashibakai_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  applied_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ashibakai_memberships ENABLE ROW LEVEL SECURITY;

-- Users can view their own membership
CREATE POLICY "Users can view their own membership"
ON public.ashibakai_memberships
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own membership application
CREATE POLICY "Users can apply for membership"
ON public.ashibakai_memberships
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Anyone can view approved memberships (for badge display)
CREATE POLICY "Anyone can view approved memberships"
ON public.ashibakai_memberships
FOR SELECT
USING (status = 'approved');

-- Admins can manage all memberships
CREATE POLICY "Admins can manage all memberships"
ON public.ashibakai_memberships
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_ashibakai_memberships_updated_at
BEFORE UPDATE ON public.ashibakai_memberships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default badge URL setting
INSERT INTO public.site_settings (key, value)
VALUES ('ashibakai_badge_url', NULL)
ON CONFLICT (key) DO NOTHING;-- クイック返信テンプレートテーブル
CREATE TABLE public.quick_reply_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- インデックス
CREATE INDEX idx_quick_reply_templates_user_id ON public.quick_reply_templates(user_id);

-- RLS有効化
ALTER TABLE public.quick_reply_templates ENABLE ROW LEVEL SECURITY;

-- RLSポリシー
CREATE POLICY "Users can view their own templates"
  ON public.quick_reply_templates
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
  ON public.quick_reply_templates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON public.quick_reply_templates
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON public.quick_reply_templates
  FOR DELETE
  USING (auth.uid() = user_id);

-- 更新時のタイムスタンプ更新トリガー
CREATE TRIGGER update_quick_reply_templates_updated_at
  BEFORE UPDATE ON public.quick_reply_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();-- 案件テンプレートテーブル
CREATE TABLE public.project_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'general', -- 'private', 'public', 'general'
  template_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- インデックス
CREATE INDEX idx_project_templates_user_id ON public.project_templates(user_id);

-- RLS有効化
ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;

-- RLSポリシー
CREATE POLICY "Users can view their own templates"
  ON public.project_templates
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
  ON public.project_templates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON public.project_templates
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON public.project_templates
  FOR DELETE
  USING (auth.uid() = user_id);

-- 更新時のタイムスタンプ更新トリガー
CREATE TRIGGER update_project_templates_updated_at
  BEFORE UPDATE ON public.project_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();-- Create referrals tracking table
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  referral_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(referred_id)
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view referrals they made"
ON public.referrals
FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "Service can insert referrals"
ON public.referrals
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all referrals"
ON public.referrals
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));-- Fix client_profiles RLS: restrict visibility to prevent data harvesting
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view client profiles" ON client_profiles;

-- Add policy for contractors who have applied to the client's projects
CREATE POLICY "Contractors can view clients they applied to"
ON client_profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_applications pa
    JOIN projects p ON p.id = pa.project_id
    WHERE pa.contractor_id = auth.uid()
    AND p.client_id = client_profiles.id
  )
);

-- Add policy for contractors who have work requests with the client
CREATE POLICY "Contractors can view clients with work requests"
ON client_profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM work_requests wr
    WHERE (wr.requester_id = auth.uid() AND wr.target_id = client_profiles.id)
    OR (wr.target_id = auth.uid() AND wr.requester_id = client_profiles.id)
  )
);

-- Add policy for users who have exchanged messages with the client
CREATE POLICY "Users can view clients they messaged"
ON client_profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM messages m
    WHERE (m.sender_id = auth.uid() AND m.receiver_id = client_profiles.id)
    OR (m.receiver_id = auth.uid() AND m.sender_id = client_profiles.id)
  )
);

-- Ensure admins can view all client profiles (may already exist)
DROP POLICY IF EXISTS "Admins can view all client profiles" ON client_profiles;
CREATE POLICY "Admins can view all client profiles"
ON client_profiles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));-- PWAアイコンURL設定を追加
INSERT INTO public.site_settings (key, value)
VALUES ('pwa_icon_url', NULL)
ON CONFLICT (key) DO NOTHING;-- Create ashibakai_member_roster table for official member company names
CREATE TABLE public.ashibakai_member_roster (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL UNIQUE,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ashibakai_member_roster ENABLE ROW LEVEL SECURITY;

-- Only admins can manage roster
CREATE POLICY "Admins can manage roster"
ON public.ashibakai_member_roster
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Service can read roster for verification
CREATE POLICY "Service can read roster"
ON public.ashibakai_member_roster
FOR SELECT
USING (true);

-- Add roster_matched column to ashibakai_memberships
ALTER TABLE public.ashibakai_memberships
ADD COLUMN roster_matched boolean DEFAULT NULL;

-- Add company_name_at_application to store the company name at time of application
ALTER TABLE public.ashibakai_memberships
ADD COLUMN company_name_at_application text;

-- Create trigger for updated_at
CREATE TRIGGER update_ashibakai_member_roster_updated_at
BEFORE UPDATE ON public.ashibakai_member_roster
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();-- Drop existing INSERT policy for reviews
DROP POLICY IF EXISTS "Only clients who completed work can create reviews" ON public.reviews;

-- Create new policy that allows reviews from both work_requests and project_applications
CREATE POLICY "Clients can review after completion"
ON public.reviews FOR INSERT
WITH CHECK (
  auth.uid() = reviewer_id 
  AND (
    -- From work_requests (existing flow)
    EXISTS (
      SELECT 1 FROM public.work_requests
      WHERE requester_id = auth.uid()
        AND target_id = reviews.target_id
        AND status = 'completed'
    )
    -- From project_applications (new flow)
    OR EXISTS (
      SELECT 1 FROM public.project_applications pa
      JOIN public.projects p ON p.id = pa.project_id
      WHERE p.client_id = auth.uid()
        AND pa.contractor_id = reviews.target_id
        AND pa.status = 'completed'
    )
  )
);-- Create user_plans table for tracking user subscription plans
CREATE TABLE public.user_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  plan_type TEXT NOT NULL DEFAULT 'normal',
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  granted_by UUID,
  expires_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create usage_limits table for configurable limits per plan
CREATE TABLE public.usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type TEXT NOT NULL UNIQUE,
  message_limit INTEGER NOT NULL DEFAULT 30,
  project_limit INTEGER NOT NULL DEFAULT 1,
  application_limit INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default limits for normal and monitor plans
INSERT INTO public.usage_limits (plan_type, message_limit, project_limit, application_limit)
VALUES 
  ('normal', 30, 1, 1),
  ('monitor', 100, 5, 5);

-- Enable RLS on user_plans
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

-- Enable RLS on usage_limits
ALTER TABLE public.usage_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_plans
CREATE POLICY "Admins can manage all user plans"
ON public.user_plans
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own plan"
ON public.user_plans
FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policies for usage_limits
CREATE POLICY "Admins can manage usage limits"
ON public.usage_limits
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view usage limits"
ON public.usage_limits
FOR SELECT
USING (true);

-- Trigger for updated_at on user_plans
CREATE TRIGGER update_user_plans_updated_at
BEFORE UPDATE ON public.user_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on usage_limits
CREATE TRIGGER update_usage_limits_updated_at
BEFORE UPDATE ON public.usage_limits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();-- Add price and display_order columns to usage_limits
ALTER TABLE public.usage_limits 
ADD COLUMN IF NOT EXISTS price INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Update existing plans with display order
UPDATE public.usage_limits SET display_order = 1, price = 0, description = '無料会員向けの基本プラン' WHERE plan_type = 'normal';
UPDATE public.usage_limits SET display_order = 2, price = 0, description = 'モニター会員向けの特典付きプラン' WHERE plan_type = 'monitor';
UPDATE public.usage_limits SET display_order = 3, price = 9800, description = '有料会員向けのプレミアムプラン' WHERE plan_type = 'premium';

-- Insert unlimited plan if not exists (use -1 for unlimited)
INSERT INTO public.usage_limits (plan_type, message_limit, project_limit, application_limit, price, display_order, description)
VALUES ('unlimited', -1, -1, -1, 29800, 4, '無制限の最上位プラン')
ON CONFLICT (plan_type) DO NOTHING;-- Add missing columns to legacy_members table for detailed company information
ALTER TABLE public.legacy_members 
ADD COLUMN IF NOT EXISTS logo_image_path TEXT,
ADD COLUMN IF NOT EXISTS mobile_phone TEXT,
ADD COLUMN IF NOT EXISTS registered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS original_updated_at TIMESTAMP WITH TIME ZONE;-- 1. usage_limitsテーブルに action_limit カラムを追加
ALTER TABLE public.usage_limits ADD COLUMN IF NOT EXISTS action_limit integer DEFAULT 1;

-- 既存データを移行（project_limitとapplication_limitの大きい方を使用）
UPDATE public.usage_limits SET action_limit = GREATEST(project_limit, application_limit);

-- 2. オプション商品テーブルの作成
CREATE TABLE public.usage_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  addon_type text NOT NULL, -- 'message' or 'action'
  name text NOT NULL,
  quantity integer NOT NULL,
  price integer NOT NULL,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS設定
ALTER TABLE public.usage_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active addons" 
ON public.usage_addons FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage addons" 
ON public.usage_addons FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. ユーザー購入履歴テーブルの作成
CREATE TABLE public.user_addon_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  addon_id uuid REFERENCES public.usage_addons(id) ON DELETE SET NULL,
  addon_type text NOT NULL,
  quantity integer NOT NULL,
  remaining integer NOT NULL,
  purchased_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- RLS設定
ALTER TABLE public.user_addon_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their purchases" 
ON public.user_addon_purchases FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage purchases" 
ON public.user_addon_purchases FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. デフォルトのオプション商品を追加
INSERT INTO public.usage_addons (addon_type, name, quantity, price, display_order) VALUES
('message', 'メッセージ追加 +50通', 50, 500, 1),
('message', 'メッセージ追加 +100通', 100, 800, 2),
('action', '案件アクション追加 +5回', 5, 300, 3),
('action', '案件アクション追加 +10回', 10, 500, 4);-- reviews テーブルに application_id カラムを追加
ALTER TABLE public.reviews ADD COLUMN application_id uuid REFERENCES project_applications(id);

-- 同じ応募に対して1回だけレビュー可能にするユニークインデックス
CREATE UNIQUE INDEX IF NOT EXISTS reviews_application_unique 
ON public.reviews (reviewer_id, target_id, application_id) 
WHERE application_id IS NOT NULL;

-- 既存のRLSポリシーを削除
DROP POLICY IF EXISTS "Clients can review after completion" ON public.reviews;

-- 新しいRLSポリシーを作成（work_requestsとproject_applications両方に対応）
CREATE POLICY "Users can review after completion"
ON public.reviews FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = reviewer_id) 
  AND (
    -- work_requests ベースのレビュー（application_id がnullの場合）
    (application_id IS NULL AND EXISTS (
      SELECT 1 FROM work_requests
      WHERE requester_id = auth.uid()
        AND target_id = reviews.target_id
        AND status = 'completed'
    ))
    OR
    -- project_applications ベースのレビュー（案件ごと）
    (application_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM project_applications pa
      JOIN projects p ON p.id = pa.project_id
      WHERE pa.id = reviews.application_id
        AND p.client_id = auth.uid()
        AND pa.contractor_id = reviews.target_id
        AND pa.status = 'completed'
    ))
  )
);-- project_applications に納品・検収関連のカラムを追加
ALTER TABLE public.project_applications ADD COLUMN delivered_at timestamptz;
ALTER TABLE public.project_applications ADD COLUMN completed_at timestamptz;
ALTER TABLE public.project_applications ADD COLUMN delivery_message text;

-- コメント追加（ステータスの流れを明確化）
COMMENT ON COLUMN public.project_applications.status IS 'pending -> accepted -> in_progress -> delivered -> completed (or rejected)';
COMMENT ON COLUMN public.project_applications.delivered_at IS '受注者が納品報告した日時';
COMMENT ON COLUMN public.project_applications.completed_at IS '発注者が検収完了した日時';
COMMENT ON COLUMN public.project_applications.delivery_message IS '納品時のメッセージ';-- Change application_deadline and publication_deadline from date to timestamptz
ALTER TABLE projects 
ALTER COLUMN application_deadline TYPE timestamptz 
USING application_deadline::timestamptz;

ALTER TABLE projects
ALTER COLUMN publication_deadline TYPE timestamptz
USING publication_deadline::timestamptz;-- Drop and recreate the review insert policy to allow contractors to review clients after project completion
DROP POLICY IF EXISTS "Users can review after completion" ON public.reviews;

CREATE POLICY "Users can review after completion" 
ON public.reviews 
FOR INSERT
WITH CHECK (
  (auth.uid() = reviewer_id) AND (
    -- Existing: work_requests based reviews (no application_id)
    ((application_id IS NULL) AND (EXISTS ( 
      SELECT 1
      FROM work_requests
      WHERE (work_requests.requester_id = auth.uid()) 
        AND (work_requests.target_id = reviews.target_id) 
        AND (work_requests.status = 'completed'::text)
    )))
    OR
    -- Existing: Client reviewing contractor after project completion
    ((application_id IS NOT NULL) AND (EXISTS ( 
      SELECT 1
      FROM project_applications pa
      JOIN projects p ON (p.id = pa.project_id)
      WHERE (pa.id = reviews.application_id) 
        AND (p.client_id = auth.uid()) 
        AND (pa.contractor_id = reviews.target_id) 
        AND (pa.status = 'completed'::text)
    )))
    OR
    -- NEW: Contractor reviewing client after project completion
    ((application_id IS NOT NULL) AND (EXISTS ( 
      SELECT 1
      FROM project_applications pa
      JOIN projects p ON (p.id = pa.project_id)
      WHERE (pa.id = reviews.application_id) 
        AND (pa.contractor_id = auth.uid()) 
        AND (p.client_id = reviews.target_id) 
        AND (pa.status = 'completed'::text)
    )))
  )
);

-- Add reviewer_type column to reviews table to distinguish review types
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS reviewer_type text DEFAULT NULL;-- Update handle_new_user function to always create both roles and profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- 常に両方のロールを付与（client と contractor）
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'client')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'contractor')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- 常に contractor_profiles を作成
  INSERT INTO public.contractor_profiles (
    id, email, company_name, postal_code, prefecture, address, service_areas
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'company_name', ''),
    COALESCE(new.raw_user_meta_data->>'postal_code', ''),
    COALESCE(new.raw_user_meta_data->>'prefecture', ''),
    COALESCE(new.raw_user_meta_data->>'address', ''),
    COALESCE(ARRAY[new.raw_user_meta_data->>'prefecture'], ARRAY[]::text[])
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- 常に client_profiles を作成
  INSERT INTO public.client_profiles (
    id, email, company_name, postal_code, prefecture, address
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'company_name', ''),
    COALESCE(new.raw_user_meta_data->>'postal_code', ''),
    COALESCE(new.raw_user_meta_data->>'prefecture', ''),
    COALESCE(new.raw_user_meta_data->>'address', '')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$;-- Create project_notes table for job notes feature
CREATE TABLE public.project_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;

-- Users can view their own notes
CREATE POLICY "Users can view their own project notes"
ON public.project_notes
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own notes
CREATE POLICY "Users can create their own project notes"
ON public.project_notes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own notes
CREATE POLICY "Users can update their own project notes"
ON public.project_notes
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notes
CREATE POLICY "Users can delete their own project notes"
ON public.project_notes
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_project_notes_updated_at
BEFORE UPDATE ON public.project_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();-- Create lab_features table for managing lab feature publication status
CREATE TABLE public.lab_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'Sparkles',
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_new BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lab_features ENABLE ROW LEVEL SECURITY;

-- Admins can manage all lab features
CREATE POLICY "Admins can manage lab features"
ON public.lab_features
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Anyone can view published lab features
CREATE POLICY "Anyone can view published lab features"
ON public.lab_features
FOR SELECT
USING (is_published = true);

-- Create trigger for updated_at
CREATE TRIGGER update_lab_features_updated_at
BEFORE UPDATE ON public.lab_features
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default lab features
INSERT INTO public.lab_features (feature_id, name, description, icon, is_published, is_new, display_order) VALUES
('role_tabs', '仕事の切り替えボタン', '「仕事を頼む」と「仕事を受ける」を、画面上のボタンで簡単に切り替えられます。必要な情報だけ表示されてスッキリ！', 'LayoutDashboard', false, true, 2),
('enhanced_animations', 'なめらか表示', 'ボタンを押した時や画面が変わる時の動きがなめらかになります。見た目がキレイに！', 'Zap', false, false, 3),
('notification_summary', 'お知らせまとめ', 'たくさん届いたお知らせを、種類ごとにまとめて見やすく表示します。大事なお知らせを見逃しにくくなります！', 'Bell', false, true, 4),
('quick_shortcuts', 'よく使うボタン', '自分がよく使う機能だけを、ホーム画面の一番上にまとめて表示できます。ワンタップですぐ開ける！', 'Rocket', false, true, 5),
('job_notes', '現場メモ', '案件ごとにメモを残せます。「駐車場は裏手」「資材置き場は2階」など、現場で役立つ情報を記録！', 'StickyNote', false, true, 6),
('auto_dark_mode', '夜モード自動切替', '朝6時から夕方6時は明るい画面、それ以外は目に優しい暗い画面に自動で切り替わります。', 'Moon', false, true, 7);-- Create line_notification_templates table
CREATE TABLE public.line_notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type text UNIQUE NOT NULL,
  name text NOT NULL,
  emoji text DEFAULT '🔔',
  title_template text NOT NULL,
  body_template text NOT NULL,
  is_enabled boolean DEFAULT true,
  include_url_button boolean DEFAULT true,
  button_label text DEFAULT '詳細を見る',
  available_variables text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.line_notification_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage templates" ON public.line_notification_templates
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service can read templates" ON public.line_notification_templates
  FOR SELECT USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_line_notification_templates_updated_at
  BEFORE UPDATE ON public.line_notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial templates
INSERT INTO public.line_notification_templates (notification_type, name, emoji, title_template, body_template, available_variables) VALUES
  ('message', '新着メッセージ', '💬', '{{sender_name}}さんからメッセージ', '{{sender_name}}さんからメッセージが届きました。', ARRAY['sender_name']),
  ('application', '新規応募', '📝', '「{{project_title}}」に応募がありました', '{{applicant_name}}さんが案件に応募しました。', ARRAY['project_title', 'applicant_name']),
  ('application_accepted', '応募承認', '✅', '応募が採用されました！', '「{{project_title}}」への応募が採用されました！おめでとうございます！', ARRAY['project_title']),
  ('application_rejected', '応募不採用', '😔', '応募結果のお知らせ', '「{{project_title}}」への応募は今回は見送りとなりました。{{message}}', ARRAY['project_title', 'message']),
  ('project_update', '案件更新', '🔄', '案件が更新されました', '「{{project_title}}」が更新されました。', ARRAY['project_title']),
  ('work_request', '仕事依頼', '📋', '{{requester_name}}さんから仕事依頼', '{{requester_name}}さんから仕事の依頼が届きました。', ARRAY['requester_name']),
  ('follower', '新規フォロワー', '👥', '新しいフォロワー', '{{follower_name}}さんがあなたをフォローしました。', ARRAY['follower_name']),
  ('review', '新規レビュー', '⭐', '新しいレビューが投稿されました', '{{reviewer_name}}さんからレビューが投稿されました。', ARRAY['reviewer_name']),
  ('new_project_in_area', 'エリア内新規案件', '📍', 'エリア内に新しい案件', 'ご登録のエリアに新しい案件「{{project_title}}」が投稿されました。', ARRAY['project_title']),
  ('announcement', 'お知らせ', '📢', '{{title}}', '{{content}}', ARRAY['title', 'content']),
  ('ashibakai_approval', '足場会承認', '🎉', '(一社)日本足場会 会員認証完了', 'おめでとうございます！
日本足場会の会員として承認されました。
プロフィールに認証バッジが表示されます。', ARRAY[]::text[]),
  ('ashibakai_rejection', '足場会却下', '📋', '(一社)日本足場会 会員認証について', 'ご登録いただいた会社名「{{company_name}}」が日本足場会の会員名簿との照合ができませんでした。

以下をご確認ください：
・正式な会社名（法人格を含む）で登録されていますか？
・名簿に登録されている会社名と一致していますか？

会社名に誤りがある場合は、プロフィールから修正の上、再度お申し込みください。', ARRAY['company_name']);-- 1. Drop existing overly permissive policy for contractor_profiles
DROP POLICY IF EXISTS "Anyone can view contractor profiles" ON public.contractor_profiles;

-- 2. Create more restrictive policies for contractor_profiles
-- Authenticated users can view contractor profiles (basic info for matching)
CREATE POLICY "Authenticated users can view contractor profiles"
ON public.contractor_profiles
FOR SELECT
TO authenticated
USING (true);

-- 3. Fix contact_messages - protect messages with null user_id
DROP POLICY IF EXISTS "Users can view their own contact messages" ON public.contact_messages;

-- Users can only view their own messages (not null ones)
CREATE POLICY "Users can view their own contact messages"
ON public.contact_messages
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Admins can view all messages including those with null user_id
-- (This is already covered by "Admins can do everything on contact messages" policy)-- Drop the overly permissive RLS policy
DROP POLICY IF EXISTS "Authenticated users can view contractor profiles" ON public.contractor_profiles;

-- Create more restrictive policies for contractor_profiles

-- 1. Contractors can always view their own profile
-- (Already exists: "Contractors can view their own profile")

-- 2. Admins can view all contractor profiles
CREATE POLICY "Admins can view all contractor profiles"
ON public.contractor_profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Clients can view contractors who applied to their projects
CREATE POLICY "Clients can view contractors who applied to their projects"
ON public.contractor_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM project_applications pa
    JOIN projects p ON p.id = pa.project_id
    WHERE pa.contractor_id = contractor_profiles.id
    AND p.client_id = auth.uid()
  )
);

-- 4. Users can view contractors they have messaged with
CREATE POLICY "Users can view contractors they messaged"
ON public.contractor_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM messages m
    WHERE (m.sender_id = auth.uid() AND m.receiver_id = contractor_profiles.id)
       OR (m.receiver_id = auth.uid() AND m.sender_id = contractor_profiles.id)
  )
);

-- 5. Users can view contractors they have work requests with
CREATE POLICY "Users can view contractors with work requests"
ON public.contractor_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM work_requests wr
    WHERE (wr.requester_id = auth.uid() AND wr.target_id = contractor_profiles.id)
       OR (wr.target_id = auth.uid() AND wr.requester_id = contractor_profiles.id)
  )
);

-- 6. Users can view contractors they follow
CREATE POLICY "Users can view contractors they follow"
ON public.contractor_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM follows f
    WHERE f.follower_id = auth.uid()
    AND f.following_id = contractor_profiles.id
  )
);

-- 7. Users can view contractors who published listings (public listings)
CREATE POLICY "Users can view contractors with published listings"
ON public.contractor_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM contractor_listings cl
    WHERE cl.contractor_id = contractor_profiles.id
    AND cl.publication_status = 'published'
  )
);-- アフィリエイター管理テーブル
CREATE TABLE public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  affiliate_code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, suspended
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00, -- 報酬率（%）
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- アフィリエイト紹介追跡テーブル
CREATE TABLE public.affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL UNIQUE, -- 1ユーザーは1アフィリエイトのみ
  source_type TEXT NOT NULL DEFAULT 'registration', -- registration, project_share, listing_share
  source_id UUID, -- project_id or listing_id (nullable for registration)
  status TEXT NOT NULL DEFAULT 'registered', -- registered, converted, paid
  registered_at TIMESTAMPTZ DEFAULT now(),
  converted_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  commission_amount INTEGER, -- 確定した報酬額（円）
  plan_amount INTEGER, -- 有料プラン金額（円）
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 報酬支払い履歴テーブル
CREATE TABLE public.affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_conversions INTEGER NOT NULL DEFAULT 0,
  total_amount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, paid
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- インデックス作成
CREATE INDEX idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX idx_affiliates_code ON public.affiliates(affiliate_code);
CREATE INDEX idx_affiliates_status ON public.affiliates(status);
CREATE INDEX idx_affiliate_referrals_affiliate_id ON public.affiliate_referrals(affiliate_id);
CREATE INDEX idx_affiliate_referrals_referred_user_id ON public.affiliate_referrals(referred_user_id);
CREATE INDEX idx_affiliate_referrals_status ON public.affiliate_referrals(status);
CREATE INDEX idx_affiliate_payouts_affiliate_id ON public.affiliate_payouts(affiliate_id);
CREATE INDEX idx_affiliate_payouts_status ON public.affiliate_payouts(status);

-- RLS有効化
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;

-- affiliates RLSポリシー
CREATE POLICY "Users can view their own affiliate record"
ON public.affiliates FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can apply as affiliate"
ON public.affiliates FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all affiliates"
ON public.affiliates FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- affiliate_referrals RLSポリシー
CREATE POLICY "Affiliates can view their own referrals"
ON public.affiliate_referrals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.affiliates a
    WHERE a.id = affiliate_referrals.affiliate_id
    AND a.user_id = auth.uid()
  )
);

CREATE POLICY "Service can insert referrals"
ON public.affiliate_referrals FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service can update referrals"
ON public.affiliate_referrals FOR UPDATE
USING (true);

CREATE POLICY "Admins can manage all referrals"
ON public.affiliate_referrals FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- affiliate_payouts RLSポリシー
CREATE POLICY "Affiliates can view their own payouts"
ON public.affiliate_payouts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.affiliates a
    WHERE a.id = affiliate_payouts.affiliate_id
    AND a.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all payouts"
ON public.affiliate_payouts FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- updated_at トリガー
CREATE TRIGGER update_affiliates_updated_at
BEFORE UPDATE ON public.affiliates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- アフィリエイトポイント残高テーブル
CREATE TABLE public.affiliate_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_used INTEGER NOT NULL DEFAULT 0,
  total_withdrawn INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(affiliate_id)
);

-- ポイント取引履歴テーブル
CREATE TABLE public.affiliate_point_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  transaction_type TEXT NOT NULL, -- 'earned', 'coupon_exchange', 'withdrawal', 'adjustment', 'expired'
  description TEXT,
  reference_id UUID, -- 参照先ID（referral_id, coupon_claim_id, withdrawal_request_id等）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- パートナークーポンテーブル
CREATE TABLE public.partner_coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_service_id UUID REFERENCES public.partner_services(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage', 'fixed'
  discount_value INTEGER NOT NULL, -- 割引率(%)または固定額
  points_required INTEGER NOT NULL, -- 必要ポイント数
  is_active BOOLEAN NOT NULL DEFAULT true,
  valid_days INTEGER DEFAULT 30, -- クーポン有効日数
  max_claims INTEGER, -- 最大取得数（NULLは無制限）
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- クーポン取得履歴テーブル
CREATE TABLE public.affiliate_coupon_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  coupon_id UUID NOT NULL REFERENCES public.partner_coupons(id) ON DELETE CASCADE,
  points_used INTEGER NOT NULL,
  coupon_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'used', 'expired'
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE
);

-- 換金申請テーブル
CREATE TABLE public.affiliate_withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  points_amount INTEGER NOT NULL,
  yen_amount INTEGER NOT NULL, -- 1pt = 1円
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'completed'
  bank_name TEXT,
  branch_name TEXT,
  account_type TEXT, -- 'ordinary', 'checking'
  account_number TEXT,
  account_holder TEXT,
  admin_notes TEXT,
  processed_by UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLSを有効化
ALTER TABLE public.affiliate_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_coupon_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- affiliate_points のRLSポリシー
CREATE POLICY "Affiliates can view their own points"
  ON public.affiliate_points FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.affiliates a
    WHERE a.id = affiliate_points.affiliate_id AND a.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all points"
  ON public.affiliate_points FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service can manage points"
  ON public.affiliate_points FOR ALL
  USING (true)
  WITH CHECK (true);

-- affiliate_point_transactions のRLSポリシー
CREATE POLICY "Affiliates can view their own transactions"
  ON public.affiliate_point_transactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.affiliates a
    WHERE a.id = affiliate_point_transactions.affiliate_id AND a.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all transactions"
  ON public.affiliate_point_transactions FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service can insert transactions"
  ON public.affiliate_point_transactions FOR INSERT
  WITH CHECK (true);

-- partner_coupons のRLSポリシー
CREATE POLICY "Anyone can view active coupons"
  ON public.partner_coupons FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage all coupons"
  ON public.partner_coupons FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- affiliate_coupon_claims のRLSポリシー
CREATE POLICY "Affiliates can view their own claims"
  ON public.affiliate_coupon_claims FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.affiliates a
    WHERE a.id = affiliate_coupon_claims.affiliate_id AND a.user_id = auth.uid()
  ));

CREATE POLICY "Affiliates can create claims"
  ON public.affiliate_coupon_claims FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.affiliates a
    WHERE a.id = affiliate_coupon_claims.affiliate_id AND a.user_id = auth.uid()
  ));

CREATE POLICY "Affiliates can update their own claims"
  ON public.affiliate_coupon_claims FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.affiliates a
    WHERE a.id = affiliate_coupon_claims.affiliate_id AND a.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all claims"
  ON public.affiliate_coupon_claims FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- affiliate_withdrawal_requests のRLSポリシー
CREATE POLICY "Affiliates can view their own withdrawal requests"
  ON public.affiliate_withdrawal_requests FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.affiliates a
    WHERE a.id = affiliate_withdrawal_requests.affiliate_id AND a.user_id = auth.uid()
  ));

CREATE POLICY "Affiliates can create withdrawal requests"
  ON public.affiliate_withdrawal_requests FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.affiliates a
    WHERE a.id = affiliate_withdrawal_requests.affiliate_id AND a.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all withdrawal requests"
  ON public.affiliate_withdrawal_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- updated_at トリガー
CREATE TRIGGER update_affiliate_points_updated_at
  BEFORE UPDATE ON public.affiliate_points
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partner_coupons_updated_at
  BEFORE UPDATE ON public.partner_coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_affiliate_withdrawal_requests_updated_at
  BEFORE UPDATE ON public.affiliate_withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Create blacklist_companies table
CREATE TABLE public.blacklist_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  risk_type TEXT NOT NULL,
  description TEXT NOT NULL,
  prefecture TEXT,
  address TEXT,
  phone TEXT,
  representative TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  reported_by UUID,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create blacklist_reports table
CREATE TABLE public.blacklist_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blacklist_id UUID REFERENCES public.blacklist_companies(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  risk_type TEXT NOT NULL,
  description TEXT NOT NULL,
  reporter_id UUID NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  processed_by UUID,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blacklist_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blacklist_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for blacklist_companies
-- Admins can manage all
CREATE POLICY "Admins can manage blacklist companies"
ON public.blacklist_companies
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Approved ashibakai members can view active blacklist
CREATE POLICY "Ashibakai members can view blacklist"
ON public.blacklist_companies
FOR SELECT
USING (
  status = 'active' AND
  EXISTS (
    SELECT 1 FROM public.ashibakai_memberships
    WHERE user_id = auth.uid() AND status = 'approved'
  )
);

-- RLS policies for blacklist_reports
-- Admins can manage all reports
CREATE POLICY "Admins can manage blacklist reports"
ON public.blacklist_reports
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Ashibakai members can create reports
CREATE POLICY "Ashibakai members can create reports"
ON public.blacklist_reports
FOR INSERT
WITH CHECK (
  auth.uid() = reporter_id AND
  EXISTS (
    SELECT 1 FROM public.ashibakai_memberships
    WHERE user_id = auth.uid() AND status = 'approved'
  )
);

-- Ashibakai members can view their own reports
CREATE POLICY "Ashibakai members can view own reports"
ON public.blacklist_reports
FOR SELECT
USING (
  reporter_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.ashibakai_memberships
    WHERE user_id = auth.uid() AND status = 'approved'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_blacklist_companies_updated_at
BEFORE UPDATE ON public.blacklist_companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create user_points table for tracking user point balances
CREATE TABLE public.user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_point_transactions table for tracking point history
CREATE TABLE public.user_point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  transaction_type TEXT NOT NULL, -- 'earned', 'used', 'admin_grant', 'bonus', 'referral'
  description TEXT,
  reference_id UUID, -- Reference to related entity (project, application, etc.)
  granted_by UUID, -- Admin who granted the points (if applicable)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_point_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_points
CREATE POLICY "Users can view their own points"
  ON public.user_points FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user points"
  ON public.user_points FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all user points"
  ON public.user_points FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service can insert user points"
  ON public.user_points FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service can update user points"
  ON public.user_points FOR UPDATE
  USING (true);

-- RLS policies for user_point_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.user_point_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON public.user_point_transactions FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all transactions"
  ON public.user_point_transactions FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service can insert transactions"
  ON public.user_point_transactions FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_user_points_user_id ON public.user_points(user_id);
CREATE INDEX idx_user_point_transactions_user_id ON public.user_point_transactions(user_id);
CREATE INDEX idx_user_point_transactions_created_at ON public.user_point_transactions(created_at DESC);
-- Add expiration columns to user_point_transactions
ALTER TABLE public.user_point_transactions 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS remaining_amount INTEGER DEFAULT 0;

-- Update existing positive transactions to have remaining_amount = amount
UPDATE public.user_point_transactions 
SET remaining_amount = amount 
WHERE amount > 0 AND remaining_amount = 0;

-- Create point expiry settings table
CREATE TABLE IF NOT EXISTS public.point_expiry_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expiry_months INTEGER NOT NULL DEFAULT 12,
  notify_days_before INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.point_expiry_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for point_expiry_settings
CREATE POLICY "Admins can manage expiry settings"
ON public.point_expiry_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view expiry settings"
ON public.point_expiry_settings
FOR SELECT
USING (true);

-- Insert default settings
INSERT INTO public.point_expiry_settings (expiry_months, notify_days_before)
VALUES (12, 30)
ON CONFLICT DO NOTHING;

-- Create index for faster expiration queries
CREATE INDEX IF NOT EXISTS idx_user_point_transactions_expires_at 
ON public.user_point_transactions (user_id, expires_at) 
WHERE remaining_amount > 0 AND expired_at IS NULL;-- 紹介コード管理テーブル
CREATE TABLE public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  points_amount INTEGER NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  description TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 紹介コード使用履歴テーブル
CREATE TABLE public.referral_code_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  points_granted INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- インデックス
CREATE INDEX idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX idx_referral_code_uses_user ON public.referral_code_uses(user_id);
CREATE INDEX idx_referral_code_uses_code ON public.referral_code_uses(referral_code_id);

-- RLS有効化
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_code_uses ENABLE ROW LEVEL SECURITY;

-- referral_codes RLSポリシー
CREATE POLICY "Admins can manage referral codes"
ON public.referral_codes FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active referral codes"
ON public.referral_codes FOR SELECT
USING (is_active = true);

-- referral_code_uses RLSポリシー
CREATE POLICY "Admins can manage referral code uses"
ON public.referral_code_uses FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service can insert referral code uses"
ON public.referral_code_uses FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view their own referral code uses"
ON public.referral_code_uses FOR SELECT
USING (auth.uid() = user_id);

-- updated_atトリガー
CREATE TRIGGER update_referral_codes_updated_at
  BEFORE UPDATE ON public.referral_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();-- Create action point settings table
CREATE TABLE public.action_point_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_key TEXT NOT NULL UNIQUE,
  action_name TEXT NOT NULL,
  points_amount INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_one_time BOOLEAN DEFAULT true,
  description TEXT,
  category TEXT DEFAULT 'general',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create action point history table
CREATE TABLE public.action_point_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_key TEXT NOT NULL,
  points_granted INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.action_point_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_point_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for action_point_settings
CREATE POLICY "Anyone can view action point settings"
ON public.action_point_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can manage action point settings"
ON public.action_point_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for action_point_history
CREATE POLICY "Users can view their own action history"
ON public.action_point_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service can insert action history"
ON public.action_point_history FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all action history"
ON public.action_point_history FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes
CREATE INDEX idx_action_point_history_user_id ON public.action_point_history(user_id);
CREATE INDEX idx_action_point_history_action_key ON public.action_point_history(action_key);
CREATE INDEX idx_action_point_settings_action_key ON public.action_point_settings(action_key);

-- Insert initial action settings
INSERT INTO public.action_point_settings (action_key, action_name, points_amount, category, is_one_time, description, display_order) VALUES
  ('registration', '新規会員登録', 100, 'registration', true, '新規登録時に付与', 1),
  ('profile_complete', 'プロフィール完成', 50, 'registration', true, 'プロフィールを完全に入力した時に付与', 2),
  ('line_connect', 'LINE連携', 50, 'registration', true, 'LINEアカウント連携時に付与', 3),
  ('first_project_create', '初めての案件登録', 100, 'project', true, '初めて案件を登録した時に付与', 4),
  ('first_project_apply', '初めての案件応募', 100, 'project', true, '初めて案件に応募した時に付与', 5),
  ('first_listing_create', '初めての募集投稿', 100, 'listing', true, '初めて空き情報を投稿した時に付与', 6),
  ('first_message_sent', '初めてのメッセージ送信', 30, 'social', true, '初めてメッセージを送信した時に付与', 7),
  ('first_review_given', '初めてのレビュー投稿', 50, 'social', true, '初めてレビューを投稿した時に付与', 8),
  ('project_complete', '案件完了', 50, 'project', false, '案件を完了するたびに付与', 9),
  ('referral_signup', '紹介した友人の登録', 200, 'referral', false, '紹介した友人が登録した時に付与', 10);

-- Create trigger for updated_at
CREATE TRIGGER update_action_point_settings_updated_at
BEFORE UPDATE ON public.action_point_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();-- Add total_withdrawn column to user_points
ALTER TABLE user_points 
ADD COLUMN IF NOT EXISTS total_withdrawn INTEGER NOT NULL DEFAULT 0;

-- Create user_withdrawal_requests table
CREATE TABLE IF NOT EXISTS user_withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  points_amount INTEGER NOT NULL,
  yen_amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  bank_name TEXT,
  branch_name TEXT,
  account_type TEXT,
  account_number TEXT,
  account_holder TEXT,
  admin_notes TEXT,
  processed_by UUID,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own withdrawal requests
CREATE POLICY "Users can view their own withdrawal requests"
ON user_withdrawal_requests FOR SELECT
USING (auth.uid() = user_id);

-- Users can create withdrawal requests
CREATE POLICY "Users can create withdrawal requests"
ON user_withdrawal_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can manage all withdrawal requests
CREATE POLICY "Admins can manage all withdrawal requests"
ON user_withdrawal_requests FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_withdrawal_requests_user_id ON user_withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_withdrawal_requests_status ON user_withdrawal_requests(status);-- Create user_coupon_claims table for tracking coupon exchanges
CREATE TABLE public.user_coupon_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  coupon_id UUID NOT NULL REFERENCES public.partner_coupons(id) ON DELETE CASCADE,
  points_used INTEGER NOT NULL,
  coupon_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  claimed_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_coupon_claims ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own coupon claims"
ON public.user_coupon_claims
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create coupon claims"
ON public.user_coupon_claims
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own coupon claims"
ON public.user_coupon_claims
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all coupon claims"
ON public.user_coupon_claims
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_user_coupon_claims_updated_at
BEFORE UPDATE ON public.user_coupon_claims
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();-- Add partner_banner_id column to partner_coupons table
ALTER TABLE public.partner_coupons
ADD COLUMN partner_banner_id uuid REFERENCES public.partner_banners(id) ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX idx_partner_coupons_banner_id ON public.partner_coupons(partner_banner_id);

-- Add constraint to ensure at least one of partner_service_id or partner_banner_id is set
ALTER TABLE public.partner_coupons
ADD CONSTRAINT chk_partner_coupons_has_parent 
CHECK (partner_service_id IS NOT NULL OR partner_banner_id IS NOT NULL);-- Add quiet hours settings to line_notification_settings
ALTER TABLE public.line_notification_settings
ADD COLUMN IF NOT EXISTS quiet_hours_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS quiet_hours_start TEXT DEFAULT '23:00',
ADD COLUMN IF NOT EXISTS quiet_hours_end TEXT DEFAULT '07:00';
