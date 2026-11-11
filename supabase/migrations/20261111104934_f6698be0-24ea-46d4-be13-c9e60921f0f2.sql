CREATE OR REPLACE FUNCTION public.profiles_manager_rules()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE m uuid;
BEGIN
  IF public.has_role(auth.uid(),'manager') AND NOT public.has_role(auth.uid(),'admin') AND NEW.id <> auth.uid() THEN
    NEW.assigned_manager_id := OLD.assigned_manager_id;
    NEW.branding_id := OLD.branding_id;
    NEW.email := OLD.email;
    NEW.balance := OLD.balance;
    NEW.source_lead_id := OLD.source_lead_id;
    IF NEW.assigned_caller_id IS DISTINCT FROM OLD.assigned_caller_id
       AND NEW.assigned_caller_id IS NOT NULL
       AND NOT public.is_manager_of_caller(auth.uid(), NEW.assigned_caller_id) THEN
      RAISE EXCEPTION 'caller not managed by you';
    END IF;
  END IF;
  IF NEW.assigned_caller_id IS DISTINCT FROM OLD.assigned_caller_id AND NEW.assigned_caller_id IS NOT NULL THEN
    SELECT manager_id INTO m FROM public.manager_callers WHERE caller_id = NEW.assigned_caller_id;
    NEW.assigned_manager_id := m;
  END IF;
  RETURN NEW;
END; $function$;

UPDATE public.profiles p
SET assigned_manager_id = (SELECT mc.manager_id FROM public.manager_callers mc WHERE mc.caller_id = p.assigned_caller_id)
WHERE p.assigned_caller_id IS NOT NULL
  AND p.assigned_manager_id IS DISTINCT FROM (SELECT mc.manager_id FROM public.manager_callers mc WHERE mc.caller_id = p.assigned_caller_id);