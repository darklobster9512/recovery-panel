revoke all on function public.todos_restrict_caller_updates() from public;
revoke all on function public.todos_restrict_caller_updates() from anon;
revoke all on function public.todos_restrict_caller_updates() from authenticated;

revoke all on function public.todos_log_activity() from public;
revoke all on function public.todos_log_activity() from anon;
revoke all on function public.todos_log_activity() from authenticated;
