-- Create a secure RPC function to increment points
-- This function ensures that points are updated safely without giving direct update access to the profiles table.
-- It can be called by admins or authorized system processes.

CREATE OR REPLACE FUNCTION public.increment_points(user_id uuid, amount integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Run with privileges of the creator (postgres/service_role)
SET search_path = public
AS $$
DECLARE
  new_score integer;
  current_score integer;
BEGIN
  -- Check if the user exists
  SELECT score INTO current_score FROM profiles WHERE id = user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Calculate new score
  new_score := COALESCE(current_score, 0) + amount;

  -- Update the score
  UPDATE profiles
  SET score = new_score,
      updated_at = NOW()
  WHERE id = user_id;

  RETURN json_build_object('success', true, 'new_score', new_score);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
