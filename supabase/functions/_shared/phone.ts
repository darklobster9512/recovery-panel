/** Normalize German phone numbers for comparison: digits only, +49/0049/0 → "49". */
export function normalizePhone(v: string | null | undefined): string {
  let d = String(v ?? "").replace(/\D/g, "");
  if (d.startsWith("0049")) d = d.slice(4);
  else if (d.startsWith("49")) d = d.slice(2);
  else if (d.startsWith("0")) d = d.slice(1);
  return d ? "49" + d : "";
}
