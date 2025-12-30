-- Add unique constraint to line_accounts for Upsert compatibility
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.line_accounts
        ADD CONSTRAINT line_accounts_user_id_line_user_id_key UNIQUE (user_id, line_user_id);
    EXCEPTION
        WHEN duplicate_table THEN NULL; -- constraint already exists
        WHEN others THEN NULL; -- other errors
    END;
END $$;
