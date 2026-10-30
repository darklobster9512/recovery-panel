ALTER TYPE public.telegram_event ADD VALUE IF NOT EXISTS 'call_missed';
COMMIT;
INSERT INTO public.telegram_notification_subscriptions (chat_id, event, enabled)
SELECT chat_id, 'call_missed'::public.telegram_event, enabled FROM public.telegram_notification_subscriptions
WHERE event = 'assignment_created'
AND NOT EXISTS (SELECT 1 FROM public.telegram_notification_subscriptions s2 WHERE s2.chat_id = telegram_notification_subscriptions.chat_id AND s2.event = 'call_missed');

CREATE OR REPLACE FUNCTION public.call_logs_notify_missed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
  IF NEW.status = 'missed' AND NEW.direction = 'in' THEN
    BEGIN
      PERFORM net.http_post(
        url := 'https://pcfmaslrlferrnoopgqn.supabase.co/functions/v1/call-missed-notify',
        headers := '{"Content-Type":"application/json"}'::jsonb,
        body := jsonb_build_object('call_log_id', NEW.id, 'token', (SELECT cron_token FROM public.backup_secrets WHERE id))
      );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.call_logs_notify_missed() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_call_logs_notify_missed AFTER INSERT ON public.call_logs
FOR EACH ROW EXECUTE FUNCTION public.call_logs_notify_missed();