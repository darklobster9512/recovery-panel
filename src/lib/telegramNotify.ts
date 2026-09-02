import { supabase } from "@/integrations/supabase/client";

export type TelegramDbEvent =
  | "lead_note_added"
  | "vic_note_added"
  | "document_uploaded"
  | "assignment_created"
  | "assignment_completed"
  | "anosim_sms_received"
  | "user_account_created"
  | "tan_forwarded_to_vic";

export type TelegramEvent = TelegramDbEvent | "test";

/**
 * Fire-and-forget Telegram notification via the `telegram-notify` edge function.
 * Errors are logged but never thrown so callers can safely await without disrupting UX.
 */
export async function notifyTelegram(
  event: TelegramEvent,
  payload: Record<string, unknown>,
  opts?: { chatIdOverride?: string }
): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke("telegram-notify", {
      body: {
        event,
        payload,
        chat_id_override: opts?.chatIdOverride,
      },
    });
    if (error) console.warn("telegram-notify failed:", error.message);
  } catch (e) {
    console.warn("telegram-notify exception:", e);
  }
}
