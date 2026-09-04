import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Plus, Pencil, Trash2, Calendar as CalendarIcon, Check, History, X } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { notifyTelegram } from "@/lib/telegramNotify";
import type { Database } from "@/integrations/supabase/types";

type Todo = Database["public"]["Tables"]["todos"]["Row"];
type TodoPriority = Database["public"]["Enums"]["todo_priority"];
type TodoStatus = Database["public"]["Enums"]["todo_status"];

interface CallerOption {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

interface ActivityItem {
  id: string;
  action: string;
  created_at: string;
  actor?: string;
  caller?: string;
}

const PRIORITY_LABELS: Record<TodoPriority, string> = { normal: "Normal", dringend: "Dringend" };
const STATUS_LABELS: Record<TodoStatus, string> = { offen: "Offen", abgeschlossen: "Abgeschlossen" };

function callerName(c: CallerOption | null | undefined) {
  if (!c) return "—";
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email || c.id;
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminTodos() {
  const { role, user } = useAuth();
  const isAdmin = role === "admin";

  const [todos, setTodos] = useState<Todo[]>([]);
  const [callers, setCallers] = useState<CallerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [callerFilter, setCallerFilter] = useState<string>("all");
  const [refresh, setRefresh] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Todo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    assigned_caller_id: "",
    priority: "normal" as TodoPriority,
    due_date: undefined as Date | undefined,
  });

  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  useEffect(() => {
    load();
    if (isAdmin) loadCallers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, user?.id, refresh]);

  useEffect(() => {
    if (isAdmin) loadActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  async function load() {
    setLoading(true);
    let query = supabase.from("todos").select("*").order("created_at", { ascending: false });
    if (!isAdmin) {
      query = query.eq("assigned_caller_id", user?.id ?? "");
    }
    const { data, error } = await query;
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    setTodos((data ?? []) as Todo[]);
    setLoading(false);
  }

  async function loadCallers() {
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "caller");
    const ids = (roles ?? []).map((r) => r.user_id);
    if (ids.length === 0) {
      setCallers([]);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .in("id", ids)
      .order("created_at", { ascending: false });
    setCallers((data ?? []) as CallerOption[]);
  }

  async function loadActivity() {
    setActivityLoading(true);
    const { data, error } = await supabase
      .from("todo_activity")
      .select("id, action, created_at, actor_id, details")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      setActivityLoading(false);
      return;
    }
    const actorIds = Array.from(new Set((data ?? []).map((a) => a.actor_id).filter(Boolean) as string[]));
    const callerIds = Array.from(new Set((data ?? []).map((a: any) => a.details?.assigned_caller_id).filter(Boolean) as string[]));
    const allProfileIds = Array.from(new Set([...actorIds, ...callerIds]));
    let nameMap: Record<string, string> = {};
    if (allProfileIds.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("id, first_name, last_name, email").in("id", allProfileIds);
      (profs ?? []).forEach((p: any) => {
        nameMap[p.id] = [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || p.id;
      });
    }
    const items = (data ?? []).map((a: any) => ({
      id: a.id,
      action: a.action,
      created_at: a.created_at,
      actor: a.actor_id ? nameMap[a.actor_id] : "System",
      caller: a.details?.assigned_caller_id ? nameMap[a.details.assigned_caller_id] : undefined,
    })) as ActivityItem[];
    setActivity(items);
    setActivityLoading(false);
  }

  function resetForm() {
    setForm({ title: "", description: "", assigned_caller_id: "", priority: "normal", due_date: undefined });
    setEditing(null);
  }

  function openCreate() {
    resetForm();
    setDialogOpen(true);
  }

  function openEdit(todo: Todo) {
    setEditing(todo);
    setForm({
      title: todo.title,
      description: todo.description ?? "",
      assigned_caller_id: todo.assigned_caller_id ?? "",
      priority: todo.priority,
      due_date: todo.due_date ? new Date(todo.due_date + "T00:00:00") : undefined,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!user?.id || !form.title.trim()) return;
    setSubmitting(true);
    try {
      const assignedId = form.assigned_caller_id || null;
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        assigned_caller_id: assignedId,
        priority: form.priority,
        due_date: form.due_date ? format(form.due_date, "yyyy-MM-dd") : null,
        created_by: user.id,
      };
      let result;
      if (editing) {
        result = await supabase.from("todos").update(payload).eq("id", editing.id).select().single();
      } else {
        result = await supabase.from("todos").insert(payload).select().single();
      }
      if (result.error) throw result.error;
      if (!editing) {
        notifyTelegram("todo_created", {
          title: payload.title,
          description: payload.description,
          priority: payload.priority,
          caller_name: callerName(callers.find((c) => c.id === assignedId)),
          due_date: payload.due_date,
        });
      }
      toast({ title: editing ? "To Do aktualisiert" : "To Do erstellt" });
      setDialogOpen(false);
      resetForm();
      setRefresh((k) => k + 1);
    } catch (e: any) {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "To Do gelöscht" });
    setRefresh((k) => k + 1);
  }

  async function toggleStatus(todo: Todo) {
    const next: TodoStatus = todo.status === "abgeschlossen" ? "offen" : "abgeschlossen";
    const update: any = { status: next };
    if (next === "abgeschlossen") {
      update.completed_at = new Date().toISOString();
      update.completed_by = user?.id ?? null;
    } else {
      update.completed_at = null;
      update.completed_by = null;
    }
    const { error } = await supabase.from("todos").update(update).eq("id", todo.id);
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
      return;
    }
    if (next === "abgeschlossen") {
      notifyTelegram("todo_completed", {
        title: todo.title,
        caller_name: callerName(callers.find((c) => c.id === todo.assigned_caller_id)),
        priority: todo.priority,
      });
    }
    toast({ title: next === "abgeschlossen" ? "To Do abgeschlossen" : "To Do wieder geöffnet" });
    setRefresh((k) => k + 1);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return todos.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (callerFilter !== "all" && t.assigned_caller_id !== callerFilter) return false;
      if (!q) return true;
      const caller = callers.find((c) => c.id === t.assigned_caller_id);
      const text = [t.title, t.description, callerName(caller)].join(" ").toLowerCase();
      return text.includes(q);
    });
  }, [todos, statusFilter, priorityFilter, callerFilter, search, callers]);

  const assignedCallers = useMemo(() => {
    const ids = Array.from(new Set(todos.map((t) => t.assigned_caller_id).filter(Boolean) as string[]));
    return callers.filter((c) => ids.includes(c.id));
  }, [todos, callers]);

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-6">
        <p className="mb-2 text-xs font-bold uppercase text-primary" style={{ letterSpacing: "0.08em" }}>Vertrieb</p>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold">To Dos</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isAdmin ? "Aufgaben erstellen, zuweisen und Fortschritt verfolgen." : "Ihre offenen und abgeschlossenen Aufgaben."}
            </p>
          </div>
          {isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={openCreate}>
                  <Plus className="w-4 h-4" /> To Do erstellen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editing ? "To Do bearbeiten" : "To Do erstellen"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-5 py-4">
                  <div className="space-y-1.5">
                    <Label>Titel *</Label>
                    <Input
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="z. B. Rückruf vereinbaren"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Beschreibung</Label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Optional: Details zur Aufgabe"
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Caller zuweisen</Label>
                    <Select value={form.assigned_caller_id || "__none__"} onValueChange={(v) => setForm((f) => ({ ...f, assigned_caller_id: v === "__none__" ? "" : v }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Caller auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Nicht zugewiesen</SelectItem>
                        {callers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{callerName(c)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Priorität</Label>
                      <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v as TodoPriority }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="dringend">Dringend</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Fällig am</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal h-10">
                            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                            {form.due_date ? format(form.due_date, "dd.MM.yyyy", { locale: de }) : <span className="text-muted-foreground">Datum wählen</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={form.due_date}
                            onSelect={(d) => setForm((f) => ({ ...f, due_date: d }) as typeof f)}
                            locale={de}
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} disabled={submitting}>
                    <X className="w-4 h-4 mr-2" /> Abbrechen
                  </Button>
                  <Button onClick={handleSave} disabled={submitting || !form.title.trim()} className="gap-2">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Speichern
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-border px-5 py-4">
          <CardTitle className="text-base">Aufgaben</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="Titel oder Beschreibung suchen"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="offen">Offen</SelectItem>
                <SelectItem value="abgeschlossen">Abgeschlossen</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Prioritäten</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="dringend">Dringend</SelectItem>
              </SelectContent>
            </Select>
            {isAdmin && (
              <Select value={callerFilter} onValueChange={setCallerFilter}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Caller</SelectItem>
                  {assignedCallers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{callerName(c)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Keine To Dos gefunden.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-muted-foreground border-b border-border">
                    <th className="py-2 pr-4 w-10"></th>
                    <th className="py-2 pr-4">Titel</th>
                    {isAdmin && <th className="py-2 pr-4">Caller</th>}
                    <th className="py-2 pr-4">Priorität</th>
                    <th className="py-2 pr-4">Fällig</th>
                    <th className="py-2 pr-4">Status</th>
                    {isAdmin && <th className="py-2 pr-4"></th>}
                  </tr>

                </thead>
                <tbody>
                  {filtered.map((t) => {
                    const caller = callers.find((c) => c.id === t.assigned_caller_id);
                    return (
                      <tr key={t.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-3 pr-4">
                          <Checkbox
                            checked={t.status === "abgeschlossen"}
                            onCheckedChange={() => toggleStatus(t)}
                            aria-label="Status umschalten"
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <div className="font-medium">{t.title}</div>
                          {t.description && <div className="text-xs text-muted-foreground max-w-xs truncate" title={t.description}>{t.description}</div>}
                        </td>
                        {isAdmin && <td className="py-3 pr-4">{callerName(caller)}</td>}
                        <td className="py-3 pr-4">

                          <span className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                            t.priority === "dringend"
                              ? "bg-red-100 text-red-700 border border-red-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          )}>
                            {PRIORITY_LABELS[t.priority]}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">{t.due_date ? new Date(t.due_date + "T00:00:00").toLocaleDateString("de-DE") : "—"}</td>
                        <td className="py-3 pr-4">
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                            t.status === "abgeschlossen"
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : "bg-amber-100 text-amber-700 border border-amber-200"
                          )}>
                            {STATUS_LABELS[t.status]}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(t.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader className="border-b border-border px-5 py-4">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              Aktivitätsprotokoll
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {activityLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Lädt…</div>
            ) : activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Aktivität.</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {activity.map((a) => (
                  <li key={a.id} className="text-sm flex flex-wrap gap-x-2 border-b border-border/60 pb-2 last:border-0">
                    <span className="text-muted-foreground tabular-nums">{formatDateTime(a.created_at)}</span>
                    {a.action === "assigned" && (
                      <span className="text-foreground/80">
                        Zugewiesen an <span className="font-medium text-foreground">{a.caller ?? "—"}</span>
                      </span>
                    )}
                    {a.action === "completed" && (
                      <span className="text-foreground/80">Abgeschlossen</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
