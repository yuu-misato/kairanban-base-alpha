-- Enable Admins to see everything in profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Enable Admins to update everything in profiles
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Enable Admins to delete profiles
CREATE POLICY "Admins can delete all profiles"
ON public.profiles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));
