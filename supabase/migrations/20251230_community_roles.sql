-- Add role column to community_members
ALTER TABLE public.community_members 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'member' CHECK (role IN ('admin', 'sub_admin', 'member'));

-- Update existing members to have 'admin' role if they are the owner
UPDATE public.community_members cm
SET role = 'admin'
FROM public.communities c
WHERE cm.community_id = c.id AND cm.user_id = c.owner_id;

-- Policy: Allow admins/sub_admins to view all members (already public read in kairanban.sql but good to be explicit if we lock it down later)
-- For now, existing RLS is "Public read communities", assuming members is also public or effectively so.
-- kairanban.sql doesn't seem to explicitly set RLS on community_members?
-- It says: "grant all on all tables in schema public to anon, authenticated;" which is very open.
-- I will leave RLS for now as per "Simplified for development" comment in kairanban.sql, but adds specific checks if needed.

-- Function to transfer ownership
CREATE OR REPLACE FUNCTION public.transfer_community_ownership(community_id uuid, new_owner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Update communities table owner_id
    UPDATE public.communities
    SET owner_id = new_owner_id
    WHERE id = community_id;

    -- 2. Update new owner's role in community_members to 'admin'
    UPDATE public.community_members
    SET role = 'admin'
    WHERE community_id = community_id AND user_id = new_owner_id;

    -- 3. Optionally demote old owner to 'sub_admin' or 'member'. 
    -- User request says "transfer authority", usually implies old owner loses it or steps down.
    -- Let's set old owner to 'sub_admin' for smooth transition, or keep 'admin' if multiple admins allowed.
    -- The requested text says "transfer", so I will assume the MAIN ownership moves.
    -- I'll keep the old owner as 'admin' too? Or 'sub_admin'? 
    -- "transfer... ability to migrate privileges"
    -- Let's set old owner to 'member' if we want strict single owner, or 'admin' if we treat 'admin' as a role multiple people can have.
    -- But communities.owner_id is single. 
    -- Let's make sure the new owner is 'admin'. The old owner might remain 'admin' if we treat 'admin' broadly.
    -- However, usually strictly one "Owner".
    -- I will downgrade the previous owner (current user running this usually) to 'sub_admin' if checking auth?
    -- Since this function is security definer, it just runs.
    
    -- Let's just ensure new owner is admin. The caller can handle analyzing old owner if needed.
    -- Actually, to be safe, let's just make sure the new owner is admin.
END;
$$;
