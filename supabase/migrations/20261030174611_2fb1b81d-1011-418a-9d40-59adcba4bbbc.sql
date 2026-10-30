DROP FUNCTION IF EXISTS public.my_branding();
CREATE FUNCTION public.my_branding()
 RETURNS TABLE(id uuid, company_name text, tagline text, logo_url text, brand_color text, street text, city text, phone text, email text, lawyer text, website text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT b.id, b.company_name, b.tagline, b.logo_url, b.brand_color, b.street, b.city, b.phone, b.email, b.lawyer, b.website
  FROM public.brandings b JOIN public.profiles p ON p.branding_id = b.id
  WHERE p.id = auth.uid()
$$;
REVOKE EXECUTE ON FUNCTION public.my_branding() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_branding() TO authenticated;