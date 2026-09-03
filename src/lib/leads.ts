export type LeadStatus =
  | "neu"
  | "in_bearbeitung"
  | "mailbox"
  | "fehlgeschlagen"
  | "erfolgreich";

export const LEAD_STATUSES: { value: LeadStatus; label: string; className: string }[] = [
  { value: "neu", label: "Neu", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
  { value: "in_bearbeitung", label: "In Bearbeitung", className: "bg-amber-100 text-amber-700 hover:bg-amber-100" },
  { value: "mailbox", label: "Mailbox", className: "bg-purple-100 text-purple-700 hover:bg-purple-100" },
  { value: "fehlgeschlagen", label: "Fehlgeschlagen", className: "bg-red-100 text-red-700 hover:bg-red-100" },
  { value: "erfolgreich", label: "Erfolgreich", className: "bg-green-100 text-green-700 hover:bg-green-100" },
];

export function statusMeta(status: string) {
  return LEAD_STATUSES.find((s) => s.value === status) ?? LEAD_STATUSES[0];
}

export type LeadCampaign = "europol" | "kanzlei";

export const CAMPAIGN_META: Record<LeadCampaign, { label: string; className: string }> = {
  europol: { label: "Europol", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
  kanzlei: { label: "Kanzlei", className: "bg-amber-100 text-amber-800 hover:bg-amber-100" },
};

export interface Lead {
  id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  schadenshoehe: number | null;
  vorfall: string | null;
  status: LeadStatus;
  source: string;
  external_id: string | null;
  raw: Record<string, string> | null;
  campaign: LeadCampaign | null;
  imported_by: string | null;
  imported_at: string;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  author_id: string | null;
  content: string;
  created_at: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  actor_id: string | null;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export function formatEur(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function truncate(text: string | null, max = 60): string {
  if (!text) return "—";
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? clean.slice(0, max) + "…" : clean;
}

export function activityLabel(a: LeadActivity): string {
  const d = (a.details ?? {}) as Record<string, string>;
  switch (a.action) {
    case "imported":
      return `Lead importiert${d.source ? ` (${d.source})` : ""}`;
    case "status_changed":
      return `Status geändert: ${statusMeta(d.from ?? "").label} → ${statusMeta(d.to ?? "").label}`;
    case "note_added":
      return `Notiz hinzugefügt${d.preview ? `: „${truncate(d.preview, 60)}"` : ""}`;
    default:
      return a.action;
  }
}

/* ---------------- CSV parsing ---------------- */

function decodeFile(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(bytes.subarray(2));
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(bytes.subarray(2));
  }
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return new TextDecoder("utf-8").decode(bytes.subarray(3));
  }
  return new TextDecoder("utf-8").decode(bytes);
}

function detectDelimiter(headerLine: string): string {
  const candidates = ["\t", ";", ","];
  let best = "\t";
  let bestCount = -1;
  for (const c of candidates) {
    const count = headerLine.split(c).length;
    if (count > bestCount) {
      bestCount = count;
      best = c;
    }
  }
  return best;
}

/** Split delimited text into rows of fields, honouring quoted values. */
function splitRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]/g, "");
}

const FIELD_MATCHERS: Record<string, string[]> = {
  schadenshoehe: ["schadenshohe", "schadenshohecabetragineur", "schaden", "betrag"],
  vorfall: ["wasistvorgefallen", "vorfall", "sachverhalt"],
  full_name: ["fullname", "vollername", "name"],
  email: ["email", "emailadresse", "mail"],
  phone_number: ["phonenumber", "telefonnummer", "telefon", "phone"],
  external_id: ["id", "leadid"],
};

function findColumn(headers: string[], candidates: string[]): number {
  const norm = headers.map(normalizeKey);
  for (const cand of candidates) {
    const exact = norm.indexOf(cand);
    if (exact !== -1) return exact;
  }
  for (const cand of candidates) {
    const partial = norm.findIndex((h) => h.includes(cand));
    if (partial !== -1) return partial;
  }
  return -1;
}

export interface ParsedLead {
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  schadenshoehe: number | null;
  vorfall: string | null;
  external_id: string | null;
  raw: Record<string, string>;
}

export interface ParseResult {
  headers: string[];
  mapping: Record<string, string | null>;
  leads: ParsedLead[];
}

function parseAmount(value: string): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
  const num = Number.parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
}

/** Removes a leading "p:" prefix (as exported by the lead source) and trims whitespace. */
export function normalizePhone(value: string): string {
  return value.replace(/^\s*p\s*:\s*/i, "").trim();
}

export async function parseLeadsFile(file: File): Promise<ParseResult> {
  const text = decodeFile(await file.arrayBuffer());
  const firstLine = text.split("\n")[0] ?? "";
  const delimiter = detectDelimiter(firstLine);
  const rows = splitRows(text, delimiter);
  if (rows.length === 0) return { headers: [], mapping: {}, leads: [] };

  const headers = rows[0].map((h) => h.trim());
  const idx: Record<string, number> = {};
  const mapping: Record<string, string | null> = {};
  for (const [field, candidates] of Object.entries(FIELD_MATCHERS)) {
    const i = findColumn(headers, candidates);
    idx[field] = i;
    mapping[field] = i === -1 ? null : headers[i];
  }

  const leads: ParsedLead[] = rows.slice(1).map((row) => {
    const raw: Record<string, string> = {};
    headers.forEach((h, i) => {
      const v = (row[i] ?? "").trim();
      if (v) raw[h] = v;
    });
    const get = (field: string) => {
      const i = idx[field];
      return i >= 0 ? (row[i] ?? "").trim() : "";
    };
    return {
      full_name: get("full_name") || null,
      email: get("email") || null,
      phone_number: normalizePhone(get("phone_number")) || null,
      schadenshoehe: parseAmount(get("schadenshoehe")),
      vorfall: get("vorfall") || null,
      external_id: get("external_id") || null,
      raw,
    };
  });

  return { headers, mapping, leads };
}
