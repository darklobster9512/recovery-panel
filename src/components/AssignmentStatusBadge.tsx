import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type AssignmentStatus = "zugewiesen" | "in_bearbeitung" | "abgeschlossen" | "in_ueberpruefung" | "genehmigt" | "abgelehnt";

const STATUS_CONFIG: Record<AssignmentStatus, { label: string; className: string }> = {
  zugewiesen: {
    label: "Zugewiesen",
    className: "border-warning/25 bg-warning/10 text-warning",
  },
  in_bearbeitung: {
    label: "In Bearbeitung",
    className: "border-primary/25 bg-primary/10 text-primary",
  },
  abgeschlossen: {
    label: "Abgeschlossen",
    className: "border-success/25 bg-success/10 text-success",
  },
  in_ueberpruefung: {
    label: "In Überprüfung",
    className: "border-warning/25 bg-warning/10 text-warning",
  },
  genehmigt: {
    label: "Genehmigt",
    className: "border-success/25 bg-success/10 text-success",
  },
  abgelehnt: {
    label: "Abgelehnt",
    className: "border-destructive/25 bg-destructive/10 text-destructive",
  },
};

export function AssignmentStatusBadge({ status }: { status: AssignmentStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.zugewiesen;
  return (
    <Badge variant="outline" className={cn("text-[11px] font-semibold", config.className)}>
      {config.label}
    </Badge>
  );
}

export const ASSIGNMENT_STATUSES: { value: AssignmentStatus; label: string }[] = [
  { value: "zugewiesen", label: "Zugewiesen" },
  { value: "in_bearbeitung", label: "In Bearbeitung" },
  { value: "in_ueberpruefung", label: "In Überprüfung" },
  { value: "genehmigt", label: "Genehmigt" },
  { value: "abgelehnt", label: "Abgelehnt" },
  { value: "abgeschlossen", label: "Abgeschlossen" },
];
