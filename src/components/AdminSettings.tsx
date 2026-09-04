import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  AppSettings,
  DEFAULT_SETTINGS,
  fetchAppSettings,
  fetchSmsTemplate,
  saveAppSettings,
  saveSmsTemplate,
} from "@/lib/settings";

const BRANDING_FIELDS: Array<{ key: keyof AppSettings; label: string }> = [
  { key: "company_name", label: "Unternehmensname" },
  { key: "street", label: "Straße & Hausnummer" },
  { key: "city", label: "PLZ & Stadt" },
  { key: "phone", label: "Telefonnummer" },
  { key: "email", label: "E-Mail" },
  { key: "lawyer", label: "Anwalt" },
  { key: "vat_id", label: "UstId" },
  { key: "website", label: "Website" },
  { key: "panel_subprefix", label: "Panel Subprefix" },
];

export default function AdminSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [smsTemplate, setSmsTemplate] = useState("");
  const [newUserSms, setNewUserSms] = useState("");
  const [assignmentSms, setAssignmentSms] = useState("");
  const [saving, setSaving] = useState(false);
  const [showKeys, setShowKeys] = useState(false);

  useEffect(() => {
    fetchAppSettings().then(setSettings).catch((e) =>
      toast({ title: "Einstellungen konnten nicht geladen werden", description: e.message, variant: "destructive" }),
    );
    fetchSmsTemplate("credentials").then(setSmsTemplate).catch(() => {});
    fetchSmsTemplate("new_user_sms").then(setNewUserSms).catch(() => {});
    fetchSmsTemplate("assignment_created_sms").then(setAssignmentSms).catch(() => {});
  }, []);

  function update<K extends keyof AppSettings>(k: K, v: AppSettings[K]) {
    setSettings((s) => ({ ...s, [k]: v }));
  }

  async function handleSaveBranding() {
    setSaving(true);
    try {
      const patch: Partial<AppSettings> = {};
      for (const f of BRANDING_FIELDS) (patch as any)[f.key] = settings[f.key];
      await saveAppSettings(patch);
      toast({ title: "Branding gespeichert" });
    } catch (e: any) {
      toast({ title: "Fehler beim Speichern", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveIntegrations() {
    setSaving(true);
    try {
      await saveAppSettings({
        resend_api_key: settings.resend_api_key,
        resend_from_name: settings.resend_from_name,
        resend_from_email: settings.resend_from_email,
        sevenio_api_key: settings.sevenio_api_key,
        sevenio_from_name: settings.sevenio_from_name,
      });
      toast({ title: "Integrationen gespeichert" });
    } catch (e: any) {
      toast({ title: "Fehler beim Speichern", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSms() {
    setSaving(true);
    try {
      await saveSmsTemplate("credentials", smsTemplate);
      await saveSmsTemplate("new_user_sms", newUserSms);
      await saveSmsTemplate("assignment_created_sms", assignmentSms);
      toast({ title: "SMS-Vorlagen gespeichert" });
    } catch (e: any) {
      toast({ title: "Fehler beim Speichern", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const keyType = showKeys ? "text" : "password";

  return (
    <Tabs defaultValue="branding" className="space-y-6">
      <div className="border-b border-border pb-6">
        <p className="mb-2 text-xs font-bold uppercase text-primary" style={{ letterSpacing: "0.08em" }}>Systemkonfiguration</p>
        <h2 className="font-display text-2xl font-semibold">Einstellungen</h2>
        <p className="mt-2 text-sm text-muted-foreground">Branding, Schnittstellen und Kommunikationsvorlagen konfigurieren.</p>
      </div>
      <TabsList>
        <TabsTrigger value="branding">Branding</TabsTrigger>
        <TabsTrigger value="integrations">Integrationen</TabsTrigger>
        <TabsTrigger value="sms">SMS Vorlagen</TabsTrigger>
        <TabsTrigger value="booking">Terminbuchung</TabsTrigger>
      </TabsList>


      <TabsContent value="branding">
        <Card>
          <CardHeader className="border-b border-border px-5 py-4"><CardTitle className="text-base">Unternehmensprofil</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {BRANDING_FIELDS.map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <Label>{f.label}</Label>
                  <Input
                    value={(settings[f.key] as string) ?? ""}
                    onChange={(e) => update(f.key, e.target.value as any)}
                  />
                </div>
              ))}
            </div>
            <Button onClick={handleSaveBranding} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" /> Speichern
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="integrations">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b border-border px-5 py-4">
            <CardTitle className="text-base">Resend & seven.io</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowKeys((v) => !v)} className="gap-1">
              {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showKeys ? "Verbergen" : "Anzeigen"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 rounded-md border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground">Resend</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>API-Key</Label>
                  <Input type={keyType} value={settings.resend_api_key}
                    onChange={(e) => update("resend_api_key", e.target.value)}
                    placeholder="re_..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Absendername</Label>
                  <Input value={settings.resend_from_name}
                    onChange={(e) => update("resend_from_name", e.target.value)}
                    placeholder="Korte & Partner" />
                </div>
                <div className="space-y-1.5">
                  <Label>Absender-E-Mail</Label>
                  <Input value={settings.resend_from_email}
                    onChange={(e) => update("resend_from_email", e.target.value)}
                    placeholder="noreply@korte-kanzlei.de" />
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-md border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground">seven.io</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>API-Key</Label>
                  <Input type={keyType} value={settings.sevenio_api_key}
                    onChange={(e) => update("sevenio_api_key", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Absendername (max. 11 Zeichen)</Label>
                  <Input value={settings.sevenio_from_name}
                    onChange={(e) => update("sevenio_from_name", e.target.value)}
                    maxLength={11} placeholder="Korte" />
                </div>
              </div>
            </div>

            <Button onClick={handleSaveIntegrations} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" /> Speichern
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="sms" className="space-y-6">
        <Card>
          <CardHeader className="border-b border-border px-5 py-4"><CardTitle className="text-base">SMS-Vorlage: Neuer Vic (Blockchain-Forensik)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nachrichtentext</Label>
              <Textarea rows={5} value={newUserSms} onChange={(e) => setNewUserSms(e.target.value)} />
              <p className="text-xs text-muted-foreground">
                Wird beim automatischen Anlegen eines Vics aus einem Lead versendet. Verfügbare Variablen:{" "}
                <code>{"{{first_name}}"}</code>, <code>{"{{last_name}}"}</code>,{" "}
                <code>{"{{company_name}}"}</code>, <code>{"{{email}}"}</code>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b border-border px-5 py-4"><CardTitle className="text-base">SMS-Vorlage: Auftragszuweisung</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nachrichtentext</Label>
              <Textarea rows={5} value={assignmentSms} onChange={(e) => setAssignmentSms(e.target.value)} />
              <p className="text-xs text-muted-foreground">
                Wird an den Vic gesendet, sobald ihm ein Auftrag zugewiesen wird. Verfügbare Variablen:{" "}
                <code>{"{{first_name}}"}</code>, <code>{"{{last_name}}"}</code>,{" "}
                <code>{"{{verification_title}}"}</code>, <code>{"{{company_name}}"}</code>,{" "}
                <code>{"{{login_url}}"}</code>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b border-border px-5 py-4"><CardTitle className="text-base">SMS-Vorlage: Zugangsdaten (Legacy)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nachrichtentext</Label>
              <Textarea rows={5} value={smsTemplate} onChange={(e) => setSmsTemplate(e.target.value)} />
            </div>
            <Button onClick={handleSaveSms} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" /> Alle speichern
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="booking">
        <Card>
          <CardHeader className="border-b border-border px-5 py-4"><CardTitle className="text-base">Terminbuchung</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Startzeit</Label>
                <Input type="time" value={settings.booking_start_time?.slice(0,5) ?? "09:00"}
                  onChange={(e) => update("booking_start_time", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Endzeit</Label>
                <Input type="time" value={settings.booking_end_time?.slice(0,5) ?? "17:00"}
                  onChange={(e) => update("booking_end_time", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Intervall (Minuten)</Label>
                <Input type="number" min={5} step={5} value={settings.booking_interval_minutes ?? 30}
                  onChange={(e) => update("booking_interval_minutes", Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label>Vorlaufzeit (Stunden)</Label>
                <Input type="number" min={0} value={settings.booking_lead_hours ?? 2}
                  onChange={(e) => update("booking_lead_hours", Number(e.target.value))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Wochentage</Label>
              <div className="flex flex-wrap gap-2">
                {[{v:1,l:"Mo"},{v:2,l:"Di"},{v:3,l:"Mi"},{v:4,l:"Do"},{v:5,l:"Fr"},{v:6,l:"Sa"},{v:7,l:"So"}].map((d) => {
                  const active = (settings.booking_weekdays ?? []).includes(d.v);
                  return (
                    <button key={d.v} type="button"
                      onClick={() => {
                        const cur = new Set(settings.booking_weekdays ?? []);
                        if (cur.has(d.v)) cur.delete(d.v); else cur.add(d.v);
                        update("booking_weekdays", Array.from(cur).sort() as any);
                      }}
                      className={`h-9 min-w-[3rem] rounded-md border px-3 text-sm font-medium transition-colors ${
                        active ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-foreground hover:bg-accent"
                      }`}
                    >{d.l}</button>
                  );
                })}
              </div>
            </div>
            <Button onClick={async () => {
              setSaving(true);
              try {
                await saveAppSettings({
                  booking_start_time: settings.booking_start_time,
                  booking_end_time: settings.booking_end_time,
                  booking_interval_minutes: settings.booking_interval_minutes,
                  booking_weekdays: settings.booking_weekdays,
                  booking_lead_hours: settings.booking_lead_hours,
                });
                toast({ title: "Terminbuchung gespeichert" });
              } catch (e: any) {
                toast({ title: "Fehler beim Speichern", description: e.message, variant: "destructive" });
              } finally { setSaving(false); }
            }} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" /> Speichern
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );

}
