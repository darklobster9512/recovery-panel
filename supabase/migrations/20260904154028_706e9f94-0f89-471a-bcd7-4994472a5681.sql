-- Settings
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS booking_start_time time NOT NULL DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS booking_end_time time NOT NULL DEFAULT '17:00',
  ADD COLUMN IF NOT EXISTS booking_interval_minutes integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS booking_weekdays integer[] NOT NULL DEFAULT '{1,2,3,4,5}',
  ADD COLUMN IF NOT EXISTS booking_lead_hours integer NOT NULL DEFAULT 2;

-- Appointments
CREATE TABLE public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vic_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  caller_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  status text NOT NULL DEFAULT 'gebucht',
  is_transferred boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vics manage own appointments select" ON public.appointments
  FOR SELECT TO authenticated USING (vic_id = auth.uid());
CREATE POLICY "Vics insert own appointments" ON public.appointments
  FOR INSERT TO authenticated WITH CHECK (vic_id = auth.uid());
CREATE POLICY "Vics update own appointments" ON public.appointments
  FOR UPDATE TO authenticated USING (vic_id = auth.uid()) WITH CHECK (vic_id = auth.uid());

CREATE POLICY "Callers select assigned appointments" ON public.appointments
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'caller')
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = appointments.vic_id AND p.assigned_caller_id = auth.uid())
  );
CREATE POLICY "Callers update assigned appointments" ON public.appointments
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'caller')
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = appointments.vic_id AND p.assigned_caller_id = auth.uid())
  ) WITH CHECK (
    public.has_role(auth.uid(), 'caller')
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = appointments.vic_id AND p.assigned_caller_id = auth.uid())
  );

CREATE POLICY "Admins manage appointments" ON public.appointments
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- one active slot per contact (admin slots share the NULL bucket)
CREATE UNIQUE INDEX appointments_unique_active_slot
  ON public.appointments (COALESCE(caller_id, '00000000-0000-0000-0000-000000000000'::uuid), appointment_date, appointment_time)
  WHERE status = 'gebucht' AND is_transferred = false;

-- one open appointment per vic
CREATE UNIQUE INDEX appointments_unique_open_per_vic
  ON public.appointments (vic_id) WHERE status = 'gebucht';

CREATE TRIGGER trg_appointments_updated
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.leads_touch_updated_at();

-- booked slots lookup for vics without exposing other data
CREATE OR REPLACE FUNCTION public.booked_slots_for_caller(_caller_id uuid, _from date, _to date)
RETURNS TABLE (appointment_date date, appointment_time time)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.appointment_date, a.appointment_time
  FROM public.appointments a
  WHERE a.status = 'gebucht'
    AND a.appointment_date BETWEEN _from AND _to
    AND (
      (_caller_id IS NULL AND a.caller_id IS NULL)
      OR (_caller_id IS NOT NULL AND a.caller_id = _caller_id)
    )
$$;

GRANT EXECUTE ON FUNCTION public.booked_slots_for_caller(uuid, date, date) TO authenticated;

-- transfer open appointments when a vic gets assigned to another caller
CREATE OR REPLACE FUNCTION public.appointments_follow_caller()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.assigned_caller_id IS DISTINCT FROM OLD.assigned_caller_id THEN
    UPDATE public.appointments
    SET caller_id = NEW.assigned_caller_id,
        is_transferred = true
    WHERE vic_id = NEW.id AND status = 'gebucht';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_profiles_transfer_appointments
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.appointments_follow_caller();

-- telegram event
ALTER TYPE public.telegram_event ADD VALUE IF NOT EXISTS 'appointment_booked';