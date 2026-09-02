import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MessageSquare } from "lucide-react";
import LeadNotesPanel from "@/components/LeadNotesPanel";
import { DialogShellHeader } from "@/components/admin/DialogShell";

interface Props {
  leadId: string | null;
  leadName: string | null;
  onClose: () => void;
  onSaved?: () => void;
}

export default function LeadNotesDialog({ leadId, leadName, onClose, onSaved }: Props) {
  return (
    <Dialog open={!!leadId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg p-6 gap-0 rounded-xl">
        <DialogHeader className="space-y-0">
          <DialogShellHeader
            icon={<MessageSquare className="w-5 h-5" />}
            eyebrow="Lead-Notizen"
            title={<DialogTitle asChild><span>{leadName ?? "Lead"}</span></DialogTitle>}
            description="Interne Notizen zum Lead. Sichtbar für alle Admins."
          />
        </DialogHeader>
        <div className="pt-6">
          {leadId && <LeadNotesPanel leadId={leadId} onSaved={onSaved} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
