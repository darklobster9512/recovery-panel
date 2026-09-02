import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { renderCredentialsEmail } from "@/lib/emailTemplates";
import { AppSettings, DEFAULT_SETTINGS, buildLoginUrl, fetchAppSettings } from "@/lib/settings";

const TEMPLATES = [
  { id: "credentials", label: "Zugangsdaten – neues Benutzerkonto" },
] as const;

export default function AdminEmailTemplates() {
  const [templateId, setTemplateId] = useState<typeof TEMPLATES[number]["id"]>("credentials");
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [form, setForm] = useState({
    firstName: "Max",
    lastName: "Mustermann",
    email: "max.mustermann@example.com",
    password: "a1b2c3",
  });

  useEffect(() => {
    fetchAppSettings().then(setSettings).catch(() => {});
  }, []);

  const loginUrl = useMemo(() => buildLoginUrl(settings), [settings]);
  const html = useMemo(
    () => renderCredentialsEmail({ ...form, loginUrl }, settings),
    [form, settings, loginUrl],
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
      <Card className="border-border/60 bg-card shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="w-4 h-4 text-[hsl(221,100%,50%)]" />
            Vorlage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplateId(t.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  templateId === t.id
                    ? "border-[hsl(221,100%,50%)] bg-[hsl(221,100%,97%)] text-[hsl(221,100%,50%)]"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
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
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Login-Link (aus Einstellungen)</Label>
              <Input value={loginUrl} readOnly className="bg-gray-50" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={copyHtml} className="gap-2">
              <Copy className="w-4 h-4" /> HTML kopieren
            </Button>
            <p className="text-xs text-gray-500">Nur Vorschau – es wird keine E-Mail versendet.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Vorschau</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-100">
            <iframe title="E-Mail Vorschau" srcDoc={html} className="w-full h-[820px] border-0 bg-white" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
