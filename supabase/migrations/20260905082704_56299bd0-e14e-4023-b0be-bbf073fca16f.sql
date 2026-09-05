CREATE OR REPLACE FUNCTION public.leads_sync_vic_caller()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.assigned_caller_id IS DISTINCT FROM OLD.assigned_caller_id THEN
    UPDATE public.profiles
    SET assigned_caller_id = NEW.assigned_caller_id
    WHERE source_lead_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_leads_sync_vic_caller ON public.leads;
CREATE TRIGGER trg_leads_sync_vic_caller
AFTER UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.leads_sync_vic_caller();