

# Thumbnail Cards & Download Button

## 1. `src/components/DocumentUpload.tsx` — Thumbnail Cards statt Liste

Die "Hochgeladene Dokumente"-Sektion (Zeilen 387-420) wird von einer einfachen Liste zu einem Grid mit Thumbnail-Cards umgebaut:

- Grid-Layout: `grid grid-cols-2 sm:grid-cols-3 gap-4`
- Jede Card: `rounded-xl border overflow-hidden`
- Oben: `aspect-video` Vorschau — Bilder inline via signed URL, andere Dateitypen mit großem Icon
- Unten: Dateiname (truncated), Dateigröße, Download-Button
- Signed URLs werden nach dem Laden der Dokumente generiert (analog zu AdminDocuments)

## 2. `src/components/AdminDocuments.tsx` — Download-Button neben Eye

In der Detailansicht (Zeilen 208-219) wird neben dem Eye-Button ein separater Download-Button hinzugefügt:

- Eye-Button bleibt für alle Dateitypen (öffnet in neuem Tab)
- Neuer Download-Button daneben mit `<Download>` Icon
- Download nutzt `<a href={url} download={doc.file_name}>` oder programmatischen Download via fetch+blob

### Dateien
- `src/components/DocumentUpload.tsx`
- `src/components/AdminDocuments.tsx`

