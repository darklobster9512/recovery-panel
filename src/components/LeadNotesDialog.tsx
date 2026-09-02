import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LeadNotesPanel from "@/components/LeadNotesPanel";

interface Props {
  leadId: string | null;
  leadName: string | null;
  onClose: () => void;
  onSaved?: () => void;
}

export default function LeadNotesDialog({ leadId, leadName, onClose, onSaved }: Props) {
  return (
    <Dialog open={!!leadId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Notizen</DialogTitle>
          <DialogDescription>{leadName ?? "Lead"}</DialogDescription>
        </DialogHeader>
        {leadId && <LeadNotesPanel leadId={leadId} onSaved={onSaved} />}
      </DialogContent>
    </Dialog>
  );
}
