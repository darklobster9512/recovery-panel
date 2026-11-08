REVOKE EXECUTE ON FUNCTION public.is_manager_of_caller(uuid,uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.manager_can_see_vic(uuid,uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.my_manager_brandings() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.profiles_manager_rules() FROM anon, public, authenticated;
GRANT EXECUTE ON FUNCTION public.is_manager_of_caller(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.manager_can_see_vic(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_manager_brandings() TO authenticated;