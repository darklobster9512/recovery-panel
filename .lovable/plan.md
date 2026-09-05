# Guthaben & Scam-Projekt beim Import leer lassen

## Was ich geprüft habe

- Beim CSV-Import wird beim Anlegen des Vic-Kontos das Feld "Scam-Projekt" automatisch mit dem Lead-Text "Was ist vorgefallen?" gefüllt. Das ist der Fehler.
- Das Feld "Guthaben" wird beim Import **nicht** automatisch gefüllt – in der Datenbank ist es bei den Import-Konten leer. Nur bei einzelnen Konten steht ein Betrag, der nicht mit der Schadenshöhe des Leads übereinstimmt (z.B. 124.419 bei 100.000 Schaden), also offenbar manuell gesetzt.
- Beim manuellen Anlegen eines Vic aus einem Lead (Popup unter Vics) werden nur Name, E-Mail und Telefon übernommen – das ist korrekt.

## Was geändert wird

1. Beim automatischen Anlegen der Vic-Konten während des Lead-Imports werden Guthaben und Scam-Projekt nicht mehr mitgeschickt. Beide Felder bleiben leer und müssen manuell gesetzt werden.
2. Bereinigung der bestehenden Konten: bei allen Vic-Konten, deren Scam-Projekt exakt dem Vorfall-Text des zugehörigen Leads entspricht, wird das Feld geleert. Manuell eingetragene Texte bleiben unberührt.
3. Guthaben-Werte bleiben unangetastet, da sie nicht automatisch gesetzt wurden. Wenn du sie trotzdem alle geleert haben willst, sag es – dann nehme ich es dazu.

## Technisch

- `src/components/LeadImportDialog.tsx`: `scam_project` aus dem `create-user`-Aufruf entfernen.
- Datenbereinigung per SQL: `UPDATE profiles p SET scam_project = NULL FROM leads l WHERE l.id = p.source_lead_id AND p.scam_project = l.vorfall;`
