-- 1. Redefine handle_new_user to ensure it creates public.profiles for LINE users
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

  -- If role is resident or null (common for LINE login), create a Base profile
  IF raw_role IS NULL OR raw_role = 'resident' THEN
      INSERT INTO public.profiles (id, nickname, avatar_url, role)
      VALUES (
          new.id,
          COALESCE(new.raw_user_meta_data->>'nickname', '住民ユーザー'),
          new.raw_user_meta_data->>'avatar_url',
          'resident'
      )
      ON CONFLICT (id) DO UPDATE SET
          nickname = EXCLUDED.nickname,
          avatar_url = EXCLUDED.avatar_url;
      RETURN new;
  END IF;

  -- Fallback logic for legacy Ashibatch roles (contractor/client)
  -- This part is kept for compatibility but might not be used in Kairanban-only mode
  user_roles_array := CASE 
    WHEN jsonb_typeof(new.raw_user_meta_data->'roles') = 'array' 
    THEN ARRAY(SELECT jsonb_array_elements_text(new.raw_user_meta_data->'roles'))
    ELSE ARRAY[raw_role]
  END;
  
  FOREACH raw_role IN ARRAY user_roles_array
  LOOP
    BEGIN
        -- Cast validation
        user_role := raw_role::app_role;
        
        INSERT INTO public.user_roles (user_id, role)
        VALUES (new.id, user_role)
        ON CONFLICT DO NOTHING;
        
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

-- 2. Backfill missing profiles for existing users who logged in via LINE but have no profile
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT * FROM auth.users LOOP
        -- Check if profile exists
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = r.id) THEN
            -- Insert default profile
            INSERT INTO public.profiles (id, nickname, avatar_url, role)
            VALUES (
                r.id,
                COALESCE(r.raw_user_meta_data->>'nickname', '住民ユーザー'),
                r.raw_user_meta_data->>'avatar_url',
                'resident'
            );
        END IF;
    END LOOP;
END $$;
