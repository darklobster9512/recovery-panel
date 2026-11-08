GRANT EXECUTE ON FUNCTION public.manager_can_see_vic(uuid,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_manager_of_caller(uuid,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.my_manager_brandings() TO service_role;