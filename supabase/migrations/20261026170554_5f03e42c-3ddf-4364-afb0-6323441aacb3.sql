INSERT INTO public.telegram_notification_subscriptions (chat_id, event, enabled)
SELECT chat_id, 'verifications_prepared'::public.telegram_event, true
FROM public.telegram_notification_subscriptions
WHERE event = 'assignment_created' AND enabled
ON CONFLICT (chat_id, event) DO NOTHING;