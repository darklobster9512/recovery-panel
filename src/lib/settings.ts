import { supabase } from "@/integrations/supabase/client";

export interface AppSettings {
  company_name: string;
  street: string;
  city: string;
  phone: string;
  email: string;
  lawyer: string;
  vat_id: string;
  website: string;
  panel_subprefix: string;
  resend_api_key: string;
  resend_from_name: string;
  resend_from_email: string;
  sevenio_api_key: string;
  sevenio_from_name: string;
  booking_start_time: string;
  booking_end_time: string;
  booking_interval_minutes: number;
  booking_weekdays: number[];
  booking_lead_hours: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  company_name: "Korte & Partner",
  street: "Domstraße 15",
  city: "20095 Hamburg",
  phone: "040 573086460",
  email: "info@korte-kanzlei.de",
  lawyer: "Dr. Thomas Korte",
  vat_id: "DE317391938",
  website: "korte-kanzlei.de",
  panel_subprefix: "web",
  resend_api_key: "",
  resend_from_name: "",
  resend_from_email: "",
  sevenio_api_key: "",
  sevenio_from_name: "",
  booking_start_time: "09:00",
  booking_end_time: "17:00",
  booking_interval_minutes: 30,
  booking_weekdays: [1, 2, 3, 4, 5],
  booking_lead_hours: 2,
};


export async function fetchAppSettings(): Promise<AppSettings> {
  const { data, error } = await (supabase as any)
    .from("app_settings")
    .select("*")
    .eq("id", true)
    .maybeSingle();
  if (error) throw error;
  return { ...DEFAULT_SETTINGS, ...(data ?? {}) };
}

export async function saveAppSettings(patch: Partial<AppSettings>): Promise<void> {
  const { error } = await (supabase as any)
    .from("app_settings")
    .update(patch)
    .eq("id", true);
  if (error) throw error;
}

export function buildLoginUrl(s: Pick<AppSettings, "panel_subprefix" | "website">): string {
  const website = (s.website || "").trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  const prefix = (s.panel_subprefix || "").trim().replace(/\.+$/, "");
  const host = prefix ? `${prefix}.${website}` : website;
  return `https://${host}/auth`;
}

export function buildWebsiteUrl(s: Pick<AppSettings, "website">): string {
  const website = (s.website || "").trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  return `https://${website}`;
}

export interface SmsTemplate {
  key: string;
  content: string;
}

export async function fetchSmsTemplate(key: string): Promise<string> {
  const { data, error } = await (supabase as any)
    .from("sms_templates_config")
    .select("content")
    .eq("key", key)
    .maybeSingle();
  if (error) throw error;
  return data?.content ?? "";
}

export async function saveSmsTemplate(key: string, content: string): Promise<void> {
  const { error } = await (supabase as any)
    .from("sms_templates_config")
    .upsert({ key, content });
  if (error) throw error;
}

export function renderSmsTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? "");
}
