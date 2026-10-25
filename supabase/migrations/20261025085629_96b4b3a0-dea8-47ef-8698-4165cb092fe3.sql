REVOKE EXECUTE ON FUNCTION public.profiles_inherit_branding() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.my_branding() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_branding_for_host(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_branding_for_host(text) TO anon, authenticated;