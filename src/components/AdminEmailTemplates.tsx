import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { renderCredentialsEmail } from "@/lib/emailTemplates";
import { AppSettings, DEFAULT_SETTINGS, buildLoginUrl, buildWebsiteUrl, fetchAppSettings } from "@/lib/settings";

const TEMPLATES = [
  { id: "credentials", label: "Kontoerstellung – Blockchain-Forensik" },
] as const;

export default function AdminEmailTemplates() {
  const [templateId, setTemplateId] = useState<typeof TEMPLATES[number]["id"]>("credentials");
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [form, setForm] = useState({
    firstName: "Max",
    lastName: "Mustermann",
    email: "max.mustermann@example.com",
    password: "a1b2c3d4",
  });

  useEffect(() => {
    fetchAppSettings().then(setSettings).catch(() => {});
  }, []);

  const loginUrl = useMemo(() => buildLoginUrl(settings), [settings]);
  const websiteUrl = useMemo(() => buildWebsiteUrl(settings), [settings]);
  const subject = useMemo(() => `Ihr Fall bei ${settings.company_name || "unserer Kanzlei"}`, [settings]);
  const html = useMemo(
    () => renderCredentialsEmail({ ...form, loginUrl, websiteUrl }, settings),
    [form, settings, loginUrl, websiteUrl],
  );

  async function copyHtml() {
    try {
      await navigator.clipboard.writeText(html);
      toast({ title: "HTML kopiert" });
    } catch {
      toast({ title: "Kopieren fehlgeschlagen", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-6">
        <p className="mb-2 text-xs font-bold uppercase text-primary" style={{ letterSpacing: "0.08em" }}>Kommunikationsvorlagen</p>
        <h2 className="font-display text-2xl font-semibold">E-Mail-Vorlagen</h2>
        <p className="mt-2 text-sm text-muted-foreground">Zugangskommunikation mit realistischen Beispieldaten prüfen.</p>
      </div>
      <Card>
        <CardHeader className="border-b border-border px-5 py-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            Vorlage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplateId(t.id)}
                className={`px-3 py-2 rounded-md text-sm font-semibold border transition-colors ${
                  templateId === t.id
                    ? "border-primary bg-accent text-primary"
                    : "border-border/60 text-muted-foreground hover:bg-muted/60"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="preview_first_name">Vorname</Label>
              <Input id="preview_first_name" value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="preview_last_name">Nachname</Label>
              <Input id="preview_last_name" value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="preview_email">E-Mail</Label>
              <Input id="preview_email" value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="preview_password">Passwort</Label>
              <Input id="preview_password" value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Portal-Login-Link</Label>
              <Input value={loginUrl} readOnly className="bg-muted/60" />
            </div>
            <div className="space-y-1.5">
              <Label>Website-Link</Label>
              <Input value={websiteUrl} readOnly className="bg-muted/60" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Betreff</Label>
              <Input value={subject} readOnly className="bg-muted/60" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={copyHtml} className="gap-2">
              <Copy className="w-4 h-4" /> HTML kopieren
            </Button>
            <p className="text-xs text-muted-foreground">Nur Vorschau – es wird keine E-Mail versendet.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border px-5 py-4">
          <CardTitle className="text-base">Vorschau</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border overflow-hidden bg-muted/40">
            <iframe title="E-Mail Vorschau" srcDoc={html} className="w-full h-[820px] border-0 bg-white" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
