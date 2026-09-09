import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type VicStatus =
  | "neu"
  | "in_bearbeitung"
  | "erfolgreich"
  | "terminiert"
  | "mailbox"
  | "fehlgeschlagen";

export const VIC_STATUS_OPTIONS: { value: VicStatus; label: string; className: string }[] = [
  { value: "neu", label: "Neu", className: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "in_bearbeitung", label: "In Bearbeitung", className: "bg-amber-100 text-amber-800 border-amber-200" },
  { value: "erfolgreich", label: "Erfolgreich", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { value: "terminiert", label: "Terminiert", className: "bg-violet-100 text-violet-800 border-violet-200" },
  { value: "mailbox", label: "Mailbox", className: "bg-slate-100 text-slate-700 border-slate-200" },
  { value: "fehlgeschlagen", label: "Fehlgeschlagen", className: "bg-red-100 text-red-800 border-red-200" },
];

export function vicStatusMeta(status: string | null | undefined) {
  return VIC_STATUS_OPTIONS.find((o) => o.value === status) ?? VIC_STATUS_OPTIONS[0];
}

interface Props {
  vicId: string;
  value: string | null | undefined;
  onChange?: (value: VicStatus) => void;
  size?: "sm" | "md";
}

export default function VicStatusSelect({ vicId, value, onChange, size = "sm" }: Props) {
  const { toast } = useToast();
  const [current, setCurrent] = useState<VicStatus>((value as VicStatus) ?? "neu");
  const [saving, setSaving] = useState(false);
  const meta = vicStatusMeta(current);

  async function handleChange(next: string) {
    const nextStatus = next as VicStatus;
    const previous = current;
    setCurrent(nextStatus);
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ member_status: nextStatus })
      .eq("id", vicId);
    setSaving(false);
    if (error) {
      setCurrent(previous);
      toast({ title: "Status konnte nicht geändert werden", description: error.message, variant: "destructive" });
      return;
    }
    onChange?.(nextStatus);
  }

  return (
    <Select value={current} onValueChange={handleChange} disabled={saving}>
      <SelectTrigger
        className={cn(
          "border font-medium w-auto gap-1.5 rounded-md",
          size === "sm" ? "h-7 px-2 text-xs" : "h-9 px-3 text-sm",
          meta.className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent onClick={(e) => e.stopPropagation()}>
        {VIC_STATUS_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
