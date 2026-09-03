# Postident PDF im Vic-Dashboard anzeigen

Aktuell werden bei Postident-Aufträgen im `/dashboard` keine der hochgeladenen PDFs angezeigt – weder Download noch Preview. Die Datei liegt bereits im Bucket `user-documents` und ist über `user_documents.assignment_id` mit dem Auftrag verknüpft.

## Änderungen

1. **PDF zum Auftrag laden** (`src/pages/Dashboard.tsx`)
   - `verifications`-Select um `type` erweitern und `type` in das `Assignment`-Interface aufnehmen.
   - Beim Öffnen eines Postident-Auftrags per `supabase.from("user_documents").select("file_name, file_path").eq("assignment_id", selected.id)` das zuletzt hochgeladene Dokument holen.
   - Signierte URL via `supabase.storage.from("user-documents").createSignedUrl(path, 3600)` erzeugen, im State cachen.

2. **Dokument-Sektion in der Detailansicht** (nur wenn `verification.type === "postident"` und eine PDF vorhanden ist)
   - Neue Karte „Postident-Dokument“ im gleichen Stil wie die anderen Sektionen (goldene Section-Headline, `slate-50`-Card).
   - Inhalt:
     - QR-Code-Preview: Die PDF wird über `<iframe src={signedUrl + "#toolbar=0&navpanes=0&view=Fit"}>` als seitenfüllende Vorschau eingebettet (typische Postident-PDF ist einseitig, QR-Code sichtbar). Höhe `h-[520px]`, `rounded-lg border border-slate-200 bg-white`.
     - Darunter: Dateiname + „PDF herunterladen“-Button (`<a href={signedUrl} download={file_name}>` als Primary-Button `bg-[#0b1f3a]`).
   - Fallback, wenn die signierte URL fehlt: dezente Fehlermeldung im Card-Stil.

3. **Keine weiteren Änderungen** an Admin-Flow, Upload, Storage-Policies oder Routing.

## Technische Details

- Signierte URL nur clientseitig erzeugen; kein neuer Edge-Function-Aufruf nötig.
- PDF-Rendering bewusst per `<iframe>` (Browser-eigener PDF-Viewer) – kein `pdf.js` o. ä. hinzufügen, hält den Bundle klein und zeigt den QR-Code scharf an.
- State: `const [postidentDoc, setPostidentDoc] = useState<{ url: string; name: string } | null>(null)` + `useEffect` auf `selected?.id`.
