import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function ChangePasswordCard() {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const close = (o: boolean) => { setOpen(o); if (!o) { setPw(""); setPw2(""); setShow(false); } };

  const save = async () => {
    if (pw.length < 8) return toast({ title: "Passwort zu kurz", description: "Mindestens 8 Zeichen.", variant: "destructive" });
    if (pw !== pw2) return toast({ title: "Passwörter stimmen nicht überein", variant: "destructive" });
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setSaving(false);
    if (error) return toast({ title: "Fehler", description: error.message, variant: "destructive" });
    toast({ title: "Passwort geändert" });
    close(false);
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <KeyRound className="mr-2 h-4 w-4" /> Passwort ändern
      </Button>
      <Dialog open={open} onOpenChange={close}>
        <DialogContent>
          <DialogHeader><DialogTitle>Passwort ändern</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Neues Passwort</Label>
              <div className="relative">
                <Input type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Passwort wiederholen</Label>
              <Input type={show ? "text" : "password"} value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => close(false)}>Abbrechen</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Speichern…" : "Speichern"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
