ALTER TABLE public.verification_assignments 
  ADD COLUMN sms_monitoring_active boolean NOT NULL DEFAULT true,
  ADD COLUMN hidden_sms jsonb NOT NULL DEFAULT '[]'::jsonb;