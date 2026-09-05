# Caller-Zugriff auf Admin-Bereiche freischalten

Caller sehen aktuell in mehreren Admin-Bereichen nichts, obwohl die Seiten für sie erreichbar sind. Ursache sind fehlende bzw. zu enge RLS-Regeln in der Datenbank. Die Routen selbst sind bereits für Caller freigegeben, die Frontend-Komponenten sind rollenbewusst — es fehlen nur die Leseregeln.

## Ziel

Ein Caller sieht und bearbeitet in den Admin-Bereichen ausschließlich Daten seiner zugewiesenen Vics — mit Ausnahme der Telefonnummern, dort sieht er alle.

## Änderungen (nach Bereich)

- Verifikationen (`/admin/verifikationen`): Caller sieht alle Auftragsvorlagen und darf Vorlagen seinen zugewiesenen Vics zuweisen (neue Zuweisungen anlegen). Bearbeiten/Löschen der Vorlagen bleibt Admin.
- In Überprüfung / Zuweisungen (`/admin/ueberpruefung`): Caller sieht alle Zuweisungen seiner zugewiesenen Vics und darf deren Status ändern (z. B. genehmigen/ablehnen, SMS-Monitoring, TAN-Weiterleitung, WebID-Redirect).
- Dokumente (`/admin/dokumente`): Leseregel für Caller existiert bereits; zusätzlich darf Caller Dokumente für seine zugewiesenen Vics hochladen (Insert), damit Uploads aus dem Zuweisen-Dialog funktionieren.
- Termine (`/admin/termine`): bereits vorhanden — hier wird nichts geändert.
- Livechat (`/admin/livechat`): bereits vorhanden — hier wird nichts geändert.
- To-Dos (`/admin/todos`): bereits vorhanden — hier wird nichts geändert.
- Telefonnummern (`/admin/telefonnummern`): Caller sieht alle Telefonnummern (Lesezugriff auf die gesamte Tabelle). Anlegen/Ändern/Löschen bleibt Admin.

## Technische Umsetzung

Eine Migration mit folgenden neuen/erweiterten RLS-Policies:

```sql
-- verifications: Caller darf alle Vorlagen lesen
CREATE POLICY "Callers can read verifications"
  ON public.verifications FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'caller'));

-- verification_assignments: Caller darf Zuweisungen für zugewiesene Vics anlegen und ändern
CREATE POLICY "Callers insert assignments for assigned vics"
  ON public.verification_assignments FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'caller')
    AND EXISTS (SELECT 1 FROM public.profiles p
                WHERE p.id = verification_assignments.user_id
                  AND p.assigned_caller_id = auth.uid())
  );

CREATE POLICY "Callers update assignments for assigned vics"
  ON public.verification_assignments FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'caller')
    AND EXISTS (SELECT 1 FROM public.profiles p
                WHERE p.id = verification_assignments.user_id
                  AND p.assigned_caller_id = auth.uid())
  );

-- user_documents: Caller darf Dokumente für zugewiesene Vics hochladen
CREATE POLICY "Callers insert documents for assigned vics"
  ON public.user_documents FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'caller')
    AND EXISTS (SELECT 1 FROM public.profiles p
                WHERE p.id = user_documents.user_id
                  AND p.assigned_caller_id = auth.uid())
  );

-- phone_numbers: Caller darf alle Nummern lesen
CREATE POLICY "Callers can read all phone numbers"
  ON public.phone_numbers FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'caller'));
```

Keine Code-Änderungen im Frontend nötig; die Komponenten filtern bereits nach Rolle und laden die passenden Daten, sobald RLS sie durchlässt.
