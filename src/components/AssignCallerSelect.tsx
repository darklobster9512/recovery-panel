import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface CallerOption {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

interface Props {
  target: "lead" | "profile";
  targetId: string;
  value: string | null;
  onChange?: (callerId: string | null) => void;
}

const NONE = "__none__";

export default function AssignCallerSelect({ target, targetId, value, onChange }: Props) {
  const { toast } = useToast();
  const [callers, setCallers] = useState<CallerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "caller");
      const ids = (roles ?? []).map((r) => r.user_id);
      if (ids.length === 0) {
        setCallers([]);
        setLoading(false);
        return;
      }
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", ids);
      setCallers((profs as CallerOption[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const handleChange = async (v: string) => {
    const next = v === NONE ? null : v;
    setSaving(true);
    const table = target === "lead" ? "leads" : "profiles";
    const { error } = await (supabase as any).from(table).update({ assigned_caller_id: next }).eq("id", targetId);
    setSaving(false);
    if (error) {
      toast({ title: "Zuweisung fehlgeschlagen", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: next ? "Caller zugewiesen" : "Zuweisung entfernt" });
    onChange?.(next);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-bold uppercase text-muted-foreground">Zugewiesener Caller</Label>
      <Select value={value ?? NONE} onValueChange={handleChange} disabled={loading || saving}>
        <SelectTrigger className="w-full sm:w-64">
          <SelectValue placeholder={loading ? "Lädt…" : "Nicht zugewiesen"} />
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin ml-1" />}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Nicht zugewiesen</SelectItem>
          {callers.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {[c.first_name, c.last_name].filter(Boolean).join(" ") || c.email || c.id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
