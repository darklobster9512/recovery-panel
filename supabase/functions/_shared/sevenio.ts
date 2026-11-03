// seven.io helpers: sender sanitizing and response parsing.
// seven.io answers HTTP 200 even on errors; the real result is the return code.

export function sanitizeSender(from: string | null | undefined): string {
  const raw = String(from ?? "").trim();
  if (!raw) return "";
  // numeric senders (phone numbers) may be up to 16 digits
  if (/^\+?\d+$/.test(raw)) return raw.replace(/^\+/, "").slice(0, 16);
  return raw.replace(/[^A-Za-z0-9]/g, "").slice(0, 11);
}

const CODES: Record<string, string> = {
  "100": "gesendet",
  "101": "teilweise fehlgeschlagen",
  "201": "Absender ungültig",
  "202": "Empfängernummer ungültig",
  "300": "API-Schlüssel fehlt",
  "301": "Empfänger fehlt",
  "305": "Text fehlt",
  "401": "Text zu lang",
  "402": "Doppelte SMS (Sperre)",
  "403": "Tageslimit für Nummer erreicht",
  "500": "Zu wenig Guthaben",
  "600": "Versandfehler beim Anbieter",
  "900": "API-Schlüssel ungültig",
  "901": "Signatur ungültig",
  "902": "API-Zugriff deaktiviert",
  "903": "IP nicht erlaubt",
};

export function parseSevenResponse(httpOk: boolean, body: string): { ok: boolean; code: string; error: string | null } {
  let code = "";
  try {
    const j = JSON.parse(body);
    code = String(j?.success ?? j?.code ?? j ?? "");
  } catch {
    code = String(body ?? "").trim().split(/\s/)[0];
  }
  if (!httpOk) return { ok: false, code, error: `HTTP-Fehler ${code ? `(${code})` : ""}`.trim() };
  if (code === "100") return { ok: true, code, error: null };
  return { ok: false, code, error: CODES[code] ?? `Unbekannter Code ${code || "(leer)"}` };
}

export async function sendSevenSms(apiKey: string, to: string, text: string, from?: string) {
  const params = new URLSearchParams({ to, text });
  const sender = sanitizeSender(from);
  if (sender) params.set("from", sender);
  const res = await fetch("https://gateway.seven.io/api/sms", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Api-Key": apiKey, Accept: "application/json" },
    body: params.toString(),
  });
  const body = await res.text();
  return { ...parseSevenResponse(res.ok, body), status: res.status, sender, body };
}
