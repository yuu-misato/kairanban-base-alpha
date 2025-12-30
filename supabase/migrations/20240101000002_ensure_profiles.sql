-- Ensure Kairanban columns exist on profiles table (safe update)
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nickname text;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'resident';
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level integer DEFAULT 1;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS score integer DEFAULT 0;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS selected_areas text[] DEFAULT '{}';
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END $$;
