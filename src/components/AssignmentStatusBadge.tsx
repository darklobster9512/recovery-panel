import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type AssignmentStatus = "zugewiesen" | "in_bearbeitung" | "abgeschlossen" | "in_ueberpruefung" | "genehmigt" | "abgelehnt";

const STATUS_CONFIG: Record<AssignmentStatus, { label: string; className: string }> = {
  zugewiesen: {
    label: "Zugewiesen",
    className: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30 dark:text-yellow-400",
  },
  in_bearbeitung: {
    label: "In Bearbeitung",
    className: "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-400",
  },
  abgeschlossen: {
    label: "Abgeschlossen",
    className: "bg-green-500/15 text-green-700 border-green-500/30 dark:text-green-400",
  },
  in_ueberpruefung: {
    label: "In Überprüfung",
    className: "bg-orange-500/15 text-orange-700 border-orange-500/30 dark:text-orange-400",
  },
  genehmigt: {
    label: "Genehmigt",
    className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
  },
  abgelehnt: {
    label: "Abgelehnt",
    className: "bg-red-500/15 text-red-700 border-red-500/30 dark:text-red-400",
  },
};

export function AssignmentStatusBadge({ status }: { status: AssignmentStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.zugewiesen;
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", config.className)}>
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
