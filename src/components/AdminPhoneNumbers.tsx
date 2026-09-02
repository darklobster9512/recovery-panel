import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import anosimLogo from "@/assets/anosim-logo.svg";

interface SmsMessage {
  messageSender: string;
  messageDate: string;
  messageText: string;
}

interface PhoneData {
  number: string;
  country: string;
  rentalType: string;
  service: string;
  startDate: string;
  endDate: string;
  state: string;
  sms: SmsMessage[];
}

interface PhoneEntry {
  id: string;
  token: string;
  api_url: string;
  data: PhoneData | null;
  loading: boolean;
  error: string | null;
}

export default function AdminPhoneNumbers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<PhoneEntry[]>([]);
  const [linkInput, setLinkInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const extractToken = (url: string): string | null => {
    try {
      const u = new URL(url);
      return u.searchParams.get("token");
    } catch {
      return null;
    }
  };

  const fetchPhoneData = useCallback(async (token: string): Promise<{ data: PhoneData | null; error: string | null }> => {
    try {
      const { data, error } = await supabase.functions.invoke("anosim-proxy", {
        body: { token },
      });
      if (error) return { data: null, error: error.message };
      if (data?.error) return { data: null, error: data.error };
      return { data: data as PhoneData, error: null };
    } catch (e: any) {
      return { data: null, error: e.message };
    }
  }, []);

  const loadEntries = useCallback(async () => {
    const { data: rows, error } = await supabase
      .from("phone_numbers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setLoadingEntries(false);
      return;
    }

    const items: PhoneEntry[] = (rows ?? []).map((r: any) => ({
      id: r.id,
      token: r.token,
      api_url: r.api_url,
      data: null,
      loading: true,
      error: null,
    }));

    setEntries(items);
    setLoadingEntries(false);

    // Fetch data for all
    const updated = await Promise.all(
      items.map(async (item) => {
        const result = await fetchPhoneData(item.token);
        return { ...item, data: result.data, error: result.error, loading: false };
      })
    );
    setEntries(updated);
  }, [fetchPhoneData]);

  const refreshData = useCallback(async () => {
    setEntries((prev) => {
      // trigger refresh without changing structure
      return prev;
    });

    // Get current entries from DB
    const { data: rows } = await supabase
      .from("phone_numbers")
      .select("*")
      .order("created_at", { ascending: false });

    if (!rows) return;

    const updated = await Promise.all(
      rows.map(async (r: any) => {
        const result = await fetchPhoneData(r.token);
        return {
          id: r.id,
          token: r.token,
          api_url: r.api_url,
          data: result.data,
          error: result.error,
          loading: false,
        };
      })
    );
    setEntries(updated);
  }, [fetchPhoneData]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    intervalRef.current = setInterval(refreshData, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshData]);

  const handleAdd = async () => {
    const token = extractToken(linkInput.trim());
    if (!token) {
      toast({ title: "Fehler", description: "Ungültiger Link. Bitte einen gültigen anosim.net Link eingeben.", variant: "destructive" });
      return;
    }

    setAdding(true);
    const { error } = await supabase.from("phone_numbers").insert({
      token,
      api_url: linkInput.trim(),
      created_by: user?.id,
    });

    if (error) {
      toast({ title: "Fehler", description: "Konnte nicht hinzugefügt werden.", variant: "destructive" });
    } else {
      toast({ title: "Hinzugefügt", description: "Telefonnummer wurde hinzugefügt." });
      setLinkInput("");
      await loadEntries();
    }
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("phone_numbers").delete().eq("id", id);
    if (error) {
      toast({ title: "Fehler", description: "Konnte nicht gelöscht werden.", variant: "destructive" });
    } else {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const stateBadge = (state: string) => {
    const s = state?.toLowerCase();
    if (s === "active") return <Badge className="border-success/20 bg-success/10 text-success hover:bg-success/10">Active</Badge>;
    if (s === "ended" || s === "expired") return <Badge className="border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/10">Ended</Badge>;
    if (s === "pending") return <Badge className="border-warning/20 bg-warning/10 text-warning hover:bg-warning/10">Pending</Badge>;
    return <Badge variant="secondary">{state}</Badge>;
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("de-DE", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-6">
        <p className="mb-2 text-xs font-bold uppercase text-primary" style={{ letterSpacing: "0.08em" }}>Kommunikationsinfrastruktur</p>
        <h2 className="font-display text-2xl font-semibold">Telefonnummern</h2>
        <p className="mt-2 text-sm text-muted-foreground">Anosim-Verbindungen, Laufzeiten und eingehende SMS überwachen.</p>
      </div>
      {/* Add phone number */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-border px-5 py-4">
          <CardTitle className="text-base">Verbindung hinzufügen</CardTitle>
          <a href="https://anosim.net" target="_blank" rel="noopener noreferrer">
            <img src={anosimLogo} alt="Anosim" className="h-6 opacity-60 hover:opacity-100 transition-opacity" />
          </a>
        </CardHeader>
        <CardContent className="p-5">
          <div className="flex gap-2">
            <Input
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              placeholder="https://anosim.net/api/v1/orderbookingshare?token=..."
              className="flex-1"
            />
            <Button onClick={handleAdd} disabled={adding || !linkInput.trim()} className="gap-2">
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Hinzufügen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {loadingEntries ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Keine Telefonnummern vorhanden.</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Nummer</TableHead>
                  <TableHead>Land</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>Ende</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <>
                    <TableRow
                      key={entry.id}
                      className="cursor-pointer"
                      onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                    >
                      <TableCell>
                        {expandedId === entry.id ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      {entry.loading ? (
                        <TableCell colSpan={7}>
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        </TableCell>
                      ) : entry.error ? (
                        <TableCell colSpan={7} className="text-red-500 text-sm">{entry.error}</TableCell>
                      ) : entry.data ? (
                        <>
                          <TableCell className="font-mono text-sm">{entry.data.number}</TableCell>
                          <TableCell>{entry.data.country}</TableCell>
                          <TableCell>{entry.data.rentalType}</TableCell>
                          <TableCell>{entry.data.service}</TableCell>
                          <TableCell className="text-sm">{formatDate(entry.data.startDate)}</TableCell>
                          <TableCell className="text-sm">{formatDate(entry.data.endDate)}</TableCell>
                          <TableCell>{stateBadge(entry.data.state)}</TableCell>
                        </>
                      ) : (
                        <TableCell colSpan={7} className="text-muted-foreground text-sm">Keine Daten</TableCell>
                      )}
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedId === entry.id && entry.data?.sms && (
                      <TableRow key={`${entry.id}-sms`}>
                        <TableCell colSpan={9} className="bg-muted/30 p-4">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Letzte SMS</p>
                          {entry.data.sms.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Keine SMS empfangen.</p>
                          ) : (
                            <div className="space-y-2">
                              {entry.data.sms
                                .sort((a, b) => new Date(b.messageDate).getTime() - new Date(a.messageDate).getTime())
                                .slice(0, 10)
                                .map((sms, idx) => (
                                  <div key={idx} className="rounded-md border border-border bg-card p-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-medium">{sms.messageSender}</span>
                                      <span className="text-xs text-muted-foreground">{formatDate(sms.messageDate)}</span>
                                    </div>
                                    <p className="text-sm">{sms.messageText}</p>
                                  </div>
                                ))}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
