-- Bootstrap first admin user
INSERT INTO public.user_roles (user_id, role)
VALUES ('c56ec2c3-de01-42a7-a783-1372d5cc47f9', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Fix profiles table RLS - restrict to own profile or admin
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Fix user_roles table RLS - restrict to own role or admin
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;

CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles  
FOR SELECT
USING (has_role(auth.uid(), 'admin'));