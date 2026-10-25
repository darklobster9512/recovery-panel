export interface VerificationLite { id: string; title: string; type: string }

export function splitVerificationTitle(title: string) {
  const m = title.split(/\s+[—–-]\s+/);
  return { bank: m[0].trim(), sub: m.slice(1).join(" ").trim() };
}

/** "Deutsche Bank — Video-Ident" -> "DeutscheBank-videoident" */
export function auftragKey(v: VerificationLite): string {
  const { bank, sub } = splitVerificationTitle(v.title);
  const kind = sub ? sub.toLowerCase().replace(/[\s-]+/g, "") : v.type === "postident" ? "postident" : "videoident";
  return `${bank.replace(/\s+/g, "")}-${kind}`;
}

export const DEFAULT_AUFTRAEGE = [
  "Commerzbank-videoident",
  "DeutscheBank-videoident",
  "BBVA-videoident",
  "Consorsbank-postident",
  "Santander-postident",
];

export function isValidBirthDate(s: string): boolean {
  if (!s) return true;
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s);
  if (!m) return false;
  const [d, mo, y] = [+m[1], +m[2], +m[3]];
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d && y > 1900 && dt <= new Date();
}

const normBank = (s: string) =>
  s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]/g, "");

/** Keys of verifications whose bank already appears in the Vic's "Aktuelle Bank" input. */
export function blockedBanks(bankInput: string, verifs: VerificationLite[]): Set<string> {
  const input = normBank(bankInput ?? "");
  const out = new Set<string>();
  if (!input) return out;
  for (const v of verifs) {
    const b = normBank(splitVerificationTitle(v.title).bank);
    if (b && input.includes(b)) out.add(auftragKey(v));
  }
  return out;
}
