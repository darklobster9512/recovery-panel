import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Clock } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { AssignmentStatusBadge, ASSIGNMENT_STATUSES, type AssignmentStatus } from "@/components/AssignmentStatusBadge";

const FIELD_LABELS: Record<string, string> = {
  identcode: "Identcode",
  identlink: "Identlink",
  email: "Email",
  username: "Anmeldename",
  password: "Passwort",
  phone: "Telefonnummer",
};

interface AssignmentRow {
  id: string;
  created_at: string;
  user_id: string;
  verification_id: string;
  field_values: Record<string, string>;
  phone_number_id: string | null;
  created_by: string | null;
  profile: {
    id: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    temp_password: string | null;
  } | null;
  verification: {
    id: string;
    title: string;
    logo_url: string | null;
    required_fields: string[];
  } | null;
}

interface PhoneNumber {
  id: string;
  token: string;
  api_url: string;
}

export default function AdminAssignmentHistory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail dialog
  const [selected, setSelected] = useState<AssignmentRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editedFields, setEditedFields] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Phone management
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [phoneDataMap, setPhoneDataMap] = useState<Record<string, string>>({});
  const [loadingPhones, setLoadingPhones] = useState(false);
  const [selectedPhoneId, setSelectedPhoneId] = useState("");
  const [showNewPhone, setShowNewPhone] = useState(false);
  const [newPhoneLink, setNewPhoneLink] = useState("");

  // Delete
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    const { data: assignmentData, error } = await supabase
      .from("verification_assignments")
      .select("id, created_at, user_id, verification_id, field_values, phone_number_id, created_by")
      .order("created_at", { ascending: false });

    if (error || !assignmentData) {
      setLoading(false);
      return;
    }

    const userIds = [...new Set(assignmentData.map((a) => a.user_id))];
    const verificationIds = [...new Set(assignmentData.map((a) => a.verification_id))];

    const [profilesRes, verificationsRes] = await Promise.all([
      userIds.length > 0
        ? supabase.from("profiles").select("id, email, first_name, last_name, phone, temp_password").in("id", userIds)
        : { data: [] },
      verificationIds.length > 0
        ? supabase.from("verifications").select("id, title, logo_url, required_fields").in("id", verificationIds)
        : { data: [] },
    ]);

    const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p]));
    const verificationMap = new Map((verificationsRes.data || []).map((v: any) => [v.id, v]));

    setAssignments(
      assignmentData.map((d) => ({
        ...d,
        field_values: (d.field_values as Record<string, string>) || {},
        profile: profileMap.get(d.user_id) || null,
        verification: verificationMap.get(d.verification_id) || null,
      }))
    );
    setLoading(false);
  };

  const openDetail = (a: AssignmentRow) => {
    setSelected(a);
    setEditedFields({ ...(a.field_values || {}) });
    setSelectedPhoneId(a.phone_number_id || "");
    setShowNewPhone(false);
    setNewPhoneLink("");
    setDialogOpen(true);

    if (a.verification?.required_fields.includes("phone")) {
      fetchPhoneNumbers();
    }
  };

  const fetchPhoneNumbers = async () => {
    setLoadingPhones(true);
    const { data } = await supabase.from("phone_numbers").select("id, token, api_url");
    const phones = (data as PhoneNumber[]) || [];
    setPhoneNumbers(phones);

    const map: Record<string, string> = {};
    await Promise.all(
      phones.map(async (p) => {
        try {
          const { data: proxyData } = await supabase.functions.invoke("anosim-proxy", {
            body: { token: p.token },
          });
          if (proxyData?.number) map[p.id] = proxyData.number;
        } catch {}
      })
    );
    setPhoneDataMap(map);
    setLoadingPhones(false);
  };

  const extractToken = (url: string): string | null => {
    try {
      return new URL(url).searchParams.get("token");
    } catch {
      return null;
    }
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);

    let phoneNumberId: string | null = selected.phone_number_id;

    if (selected.verification?.required_fields.includes("phone")) {
      if (showNewPhone && newPhoneLink.trim()) {
        const token = extractToken(newPhoneLink.trim());
        if (!token) {
          toast({ title: "Ungültiger Anosim-Link", variant: "destructive" });
          setSaving(false);
          return;
        }
        const { data: inserted, error } = await supabase
          .from("phone_numbers")
          .insert({ token, api_url: newPhoneLink.trim(), created_by: user?.id })
          .select("id")
          .single();
        if (error || !inserted) {
          toast({ title: "Fehler beim Speichern der Telefonnummer", description: error?.message, variant: "destructive" });
          setSaving(false);
          return;
        }
        phoneNumberId = inserted.id;
      } else if (selectedPhoneId) {
        phoneNumberId = selectedPhoneId;
      }
    }

    const { error } = await supabase
      .from("verification_assignments")
      .update({ field_values: editedFields, phone_number_id: phoneNumberId })
      .eq("id", selected.id);

    if (error) {
      toast({ title: "Fehler beim Speichern", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Zuweisung aktualisiert" });
      setDialogOpen(false);
      fetchAssignments();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selected) return;
    const { error } = await supabase
      .from("verification_assignments")
      .delete()
      .eq("id", selected.id);
    if (error) {
      toast({ title: "Fehler beim Löschen", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Zuweisung gelöscht" });
    }
    setDeleteDialogOpen(false);
    setDialogOpen(false);
    fetchAssignments();
  };

  const formatDateTime = (iso: string) => {
    try {
      return format(new Date(iso), "dd.MM.yyyy, HH:mm", { locale: de });
    } catch {
      return iso;
    }
  };

  return (
    <>
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            Zuweisungsverlauf
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Noch keine Zuweisungen vorhanden.
            </p>
          ) : (
            <div className="overflow-auto rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum & Uhrzeit</TableHead>
                    <TableHead>Nutzer</TableHead>
                    <TableHead>Auftrag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((a) => (
                    <TableRow
                      key={a.id}
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => openDetail(a)}
                    >
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatDateTime(a.created_at)}
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="font-medium text-foreground">
                          {a.profile?.first_name || ""} {a.profile?.last_name || ""}
                        </span>
                        {a.profile?.email && (
                          <span className="text-muted-foreground ml-2 text-xs">
                            {a.profile.email}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-2">
                          {a.verification?.logo_url && (
                            <img
                              src={a.verification.logo_url}
                              alt={a.verification.title}
                              className="w-6 h-6 rounded object-contain"
                            />
                          )}
                          <span className="font-medium">{a.verification?.title || "–"}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail / Edit Dialog */}
      {selected && (
        <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) setDialogOpen(false); }}>
          <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selected.verification?.logo_url && (
                  <img src={selected.verification.logo_url} alt="" className="w-6 h-6 rounded object-contain" />
                )}
                {selected.verification?.title || "Zuweisung"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5 py-2">
              {/* User info (read-only) */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Benutzerinformationen</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>{" "}
                    <span className="font-medium text-foreground">
                      {selected.profile?.first_name || ""} {selected.profile?.last_name || ""}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>{" "}
                    <span className="font-medium text-foreground">{selected.profile?.email || "–"}</span>
                  </div>
                  {selected.profile?.phone && (
                    <div>
                      <span className="text-muted-foreground">Telefon:</span>{" "}
                      <span className="font-medium text-foreground">{selected.profile.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Editable field values */}
              {selected.verification?.required_fields && selected.verification.required_fields.filter(f => f !== "phone").length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Zugewiesene Daten</p>
                  {selected.verification.required_fields
                    .filter((f) => f !== "phone")
                    .map((field) => (
                      <div key={field}>
                        <Label>{FIELD_LABELS[field] || field}</Label>
                        <Input
                          className="mt-1"
                          value={editedFields[field] || ""}
                          onChange={(e) =>
                            setEditedFields((prev) => ({ ...prev, [field]: e.target.value }))
                          }
                        />
                      </div>
                    ))}
                </div>
              )}

              {/* Phone number */}
              {selected.verification?.required_fields.includes("phone") && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Telefonnummer</p>
                  {!showNewPhone ? (
                    <div className="space-y-2">
                      <Select value={selectedPhoneId} onValueChange={setSelectedPhoneId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Telefonnummer auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingPhones ? (
                            <SelectItem value="_loading" disabled>Laden...</SelectItem>
                          ) : phoneNumbers.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {phoneDataMap[p.id] || p.token}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowNewPhone(true)}>
                        <Plus className="w-4 h-4 mr-1" /> Neuen Anosim-Link
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        placeholder="https://anosim.net/share?token=..."
                        value={newPhoneLink}
                        onChange={(e) => setNewPhoneLink(e.target.value)}
                      />
                      <Button type="button" variant="ghost" size="sm" onClick={() => { setShowNewPhone(false); setNewPhoneLink(""); }}>
                        Bestehende auswählen
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="flex-row justify-between sm:justify-between">
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={saving}
              >
                <Trash2 className="w-4 h-4 mr-1" /> Löschen
              </Button>
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                  Abbrechen
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Speichert..." : "Speichern"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Zuweisung löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Löschen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
