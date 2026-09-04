import type { AppSettings } from "./settings";
import { buildWebsiteUrl } from "./settings";

export interface CredentialsEmailData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  loginUrl: string;
  websiteUrl?: string;
}

function escapeHtml(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function footerLines(s: AppSettings): string[] {
  const line1 = [s.company_name, s.street, s.city, s.phone ? `Telefon: ${s.phone}` : ""]
    .filter(Boolean).map(escapeHtml).join(" · ");
  const line2 = [s.email ? `E-Mail: ${s.email}` : "", s.lawyer, s.vat_id]
    .filter(Boolean).map(escapeHtml).join(" · ");
  return [line1, line2].filter(Boolean);
}

export function renderCredentialsEmail(
  data: CredentialsEmailData,
  settings: AppSettings,
): string {
  const firstName = escapeHtml(data.firstName.trim());
  const lastName = escapeHtml(data.lastName.trim());
  const email = escapeHtml(data.email.trim());
  const password = escapeHtml(data.password.trim());
  const loginUrl = escapeHtml(data.loginUrl.trim());
  const websiteUrl = escapeHtml((data.websiteUrl ?? buildWebsiteUrl(settings)).trim());
  const websiteLabel = escapeHtml(websiteUrl.replace(/^https?:\/\//i, ""));
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const company = escapeHtml(settings.company_name || "");
  const contactEmail = escapeHtml(settings.email || "");
  const footer = footerLines(settings);

  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Ihr Fall bei ${company}</title></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6;padding:32px 12px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
<tr><td style="padding:28px 32px;border-bottom:1px solid #e5e7eb;">
<div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:600;color:#0b1f3a;letter-spacing:-0.3px;">${company}</div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6b7280;margin-top:4px;letter-spacing:0.6px;text-transform:uppercase;">Rechtsanwaltskanzlei</div>
</td></tr>
<tr><td style="padding:32px;font-family:Arial,Helvetica,sans-serif;color:#111827;">
<h1 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#0b1f3a;">Ihr Fall wurde bei uns registriert</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#374151;">Guten Tag${fullName ? ` ${fullName}` : ""},</p>
<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#374151;">vielen Dank für Ihre Eintragung auf <a href="${websiteUrl}" style="color:#0b1f3a;font-weight:600;text-decoration:none;">${websiteLabel}</a>. Unsere spezialisierte Blockchain-Forensik hat bereits erste Vermögenswerte identifizieren können, die Ihrem Namen zugeordnet sind.</p>
<p style="margin:0 0 24px;font-size:15px;line-height:24px;color:#374151;">Für die weitere Bearbeitung Ihres Falls wurde für Sie ein persönliches Mandantenkonto in unserem Portal eingerichtet. Bitte melden Sie sich mit den folgenden Zugangsdaten an.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;"><tr><td style="padding:20px 22px;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:4px;">E-Mail</div>
<div style="font-family:'Courier New',Courier,monospace;font-size:16px;color:#0b1f3a;font-weight:700;word-break:break-all;">${email}</div>
<div style="height:16px;line-height:16px;">&nbsp;</div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:4px;">Passwort</div>
<div style="font-family:'Courier New',Courier,monospace;font-size:16px;color:#0b1f3a;font-weight:700;word-break:break-all;">${password}</div>
</td></tr></table>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px;"><tr><td style="background-color:#0b1f3a;border-radius:8px;">
<a href="${loginUrl}" style="display:inline-block;padding:13px 26px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Zum Mandantenportal</a>
</td></tr></table>
<p style="margin:16px 0 0;font-size:13px;line-height:21px;color:#6b7280;">Mehr Informationen zu unserer Kanzlei finden Sie unter <a href="${websiteUrl}" style="color:#0b1f3a;text-decoration:none;">${websiteLabel}</a>.</p>
<p style="margin:16px 0 0;font-size:13px;line-height:21px;color:#6b7280;">Bitte geben Sie diese Zugangsdaten nicht an Dritte weiter. Bei Fragen erreichen Sie uns unter <a href="mailto:${contactEmail}" style="color:#0b1f3a;text-decoration:none;">${contactEmail}</a>.</p>
</td></tr>
<tr><td style="padding:24px 32px 28px;background-color:#f9fafb;border-top:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:19px;color:#6b7280;">
${footer.map((l) => `<div>${l}</div>`).join("\n")}
</td></tr></table></td></tr></table></body></html>`;
}
