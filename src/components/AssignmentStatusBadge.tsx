import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type AssignmentStatus = "zugewiesen" | "in_bearbeitung" | "abgeschlossen";

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
  { value: "abgeschlossen", label: "Abgeschlossen" },
];
