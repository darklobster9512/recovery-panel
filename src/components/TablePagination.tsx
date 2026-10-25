import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  setPage: (p: number) => void;
}

export default function TablePagination({ page, totalPages, total, pageSize, setPage }: Props) {
  if (total <= pageSize) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
      <span className="text-xs font-semibold text-muted-foreground tabular-nums">
        {from}–{to} von {total}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
          <ChevronLeft className="w-4 h-4" /> Zurück
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums">
          Seite {page} von {totalPages}
        </span>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
          Weiter <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
