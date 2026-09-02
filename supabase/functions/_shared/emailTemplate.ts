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
}

export interface CredentialsEmailData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  loginUrl: string;
}

function escapeHtml(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function buildLoginUrl(s: Pick<AppSettings, "panel_subprefix" | "website">): string {
  const website = (s.website || "").trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  const prefix = (s.panel_subprefix || "").trim().replace(/\.+$/, "");
  const host = prefix ? `${prefix}.${website}` : website;
  return `https://${host}/auth`;
}

export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? "");
}

export function renderCredentialsEmail(data: CredentialsEmailData, s: AppSettings): string {
  const firstName = escapeHtml(data.firstName.trim());
  const lastName = escapeHtml(data.lastName.trim());
  const email = escapeHtml(data.email.trim());
  const password = escapeHtml(data.password.trim());
  const loginUrl = escapeHtml(data.loginUrl.trim());
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const company = escapeHtml(s.company_name || "");
  const contactEmail = escapeHtml(s.email || "");
  const line1 = [s.company_name, s.street, s.city, s.phone ? `Telefon: ${s.phone}` : ""]
    .filter(Boolean).map(escapeHtml).join(" · ");
  const line2 = [s.email ? `E-Mail: ${s.email}` : "", s.lawyer, s.vat_id]
    .filter(Boolean).map(escapeHtml).join(" · ");
  const footer = [line1, line2].filter(Boolean);

  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Ihre Zugangsdaten</title></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6;padding:32px 12px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
<tr><td style="padding:28px 32px;border-bottom:1px solid #e5e7eb;">
<div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:600;color:#111827;letter-spacing:-0.3px;">${company}</div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6b7280;margin-top:4px;letter-spacing:0.6px;text-transform:uppercase;">Rechtsanwaltskanzlei</div>
</td></tr>
<tr><td style="padding:32px;font-family:Arial,Helvetica,sans-serif;color:#111827;">
<h1 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#111827;">Ihr Zugang wurde eingerichtet</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#374151;">Guten Tag${fullName ? ` ${fullName}` : ""},</p>
<p style="margin:0 0 24px;font-size:15px;line-height:24px;color:#374151;">für Sie wurde ein persönliches Benutzerkonto in unserem Mandantenportal angelegt. Mit den folgenden Zugangsdaten können Sie sich ab sofort anmelden.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;"><tr><td style="padding:20px 22px;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:4px;">E-Mail</div>
<div style="font-family:'Courier New',Courier,monospace;font-size:16px;color:#111827;font-weight:700;word-break:break-all;">${email}</div>
<div style="height:16px;line-height:16px;">&nbsp;</div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:4px;">Passwort</div>
<div style="font-family:'Courier New',Courier,monospace;font-size:16px;color:#111827;font-weight:700;word-break:break-all;">${password}</div>
</td></tr></table>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px;"><tr><td style="background-color:#0061FF;border-radius:8px;">
<a href="${loginUrl}" style="display:inline-block;padding:13px 26px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Jetzt anmelden</a>
</td></tr></table>
<p style="margin:20px 0 0;font-size:13px;line-height:21px;color:#6b7280;">Bitte geben Sie diese Zugangsdaten nicht an Dritte weiter und bewahren Sie sie sicher auf. Sollten Sie diese E-Mail unerwartet erhalten haben, kontaktieren Sie uns bitte unter <a href="mailto:${contactEmail}" style="color:#0061FF;text-decoration:none;">${contactEmail}</a>.</p>
</td></tr>
<tr><td style="padding:24px 32px 28px;background-color:#f9fafb;border-top:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:19px;color:#6b7280;">
${footer.map((l) => `<div>${l}</div>`).join("\n")}
</td></tr></table></td></tr></table></body></html>`;
}
