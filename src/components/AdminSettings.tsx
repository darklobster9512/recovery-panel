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
  const [saving, setSaving] = useState(false);
  const [showKeys, setShowKeys] = useState(false);

  useEffect(() => {
    fetchAppSettings().then(setSettings).catch((e) =>
      toast({ title: "Einstellungen konnten nicht geladen werden", description: e.message, variant: "destructive" }),
    );
    fetchSmsTemplate("credentials").then(setSmsTemplate).catch(() => {});
  }, []);

  function update<K extends keyof AppSettings>(k: K, v: AppSettings[K]) {
    setSettings((s) => ({ ...s, [k]: v }));
  }

  async function handleSaveBranding() {
    setSaving(true);
    try {
      const patch: Partial<AppSettings> = {};
      for (const f of BRANDING_FIELDS) patch[f.key] = settings[f.key] as any;
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
      toast({ title: "SMS-Vorlage gespeichert" });
    } catch (e: any) {
      toast({ title: "Fehler beim Speichern", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const keyType = showKeys ? "text" : "password";

  return (
    <Tabs defaultValue="branding" className="space-y-6">
      <TabsList>
        <TabsTrigger value="branding">Branding</TabsTrigger>
        <TabsTrigger value="integrations">Integrationen</TabsTrigger>
        <TabsTrigger value="sms">SMS Vorlagen</TabsTrigger>
      </TabsList>

      <TabsContent value="branding">
        <Card className="border-gray-200 shadow-none bg-white">
          <CardHeader><CardTitle className="text-base">Branding</CardTitle></CardHeader>
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
        <Card className="border-gray-200 shadow-none bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Resend & seven.io</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowKeys((v) => !v)} className="gap-1">
              {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showKeys ? "Verbergen" : "Anzeigen"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Resend</h3>
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

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">seven.io</h3>
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

      <TabsContent value="sms">
        <Card className="border-gray-200 shadow-none bg-white">
          <CardHeader><CardTitle className="text-base">SMS-Vorlage: Zugangsdaten</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nachrichtentext</Label>
              <Textarea rows={6} value={smsTemplate} onChange={(e) => setSmsTemplate(e.target.value)} />
              <p className="text-xs text-gray-500">
                Verfügbare Variablen: <code>{"{{first_name}}"}</code>, <code>{"{{last_name}}"}</code>,{" "}
                <code>{"{{company_name}}"}</code>, <code>{"{{email}}"}</code>
              </p>
            </div>
            <Button onClick={handleSaveSms} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" /> Speichern
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
