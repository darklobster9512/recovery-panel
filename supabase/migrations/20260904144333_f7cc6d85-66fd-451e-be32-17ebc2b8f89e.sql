INSERT INTO public.sms_templates_config(key, content)
VALUES ('assignment_created_sms', 'Hallo {{first_name}}, in Ihrem Portal wurde ein neuer Auftrag „{{verification_title}}" hinterlegt. Bitte loggen Sie sich ein, um fortzufahren: {{login_url}} — {{company_name}}')
ON CONFLICT (key) DO NOTHING;