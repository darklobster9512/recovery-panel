

# Suchleiste für Admin Dokumente

## Änderung in `src/components/AdminDocuments.tsx`

- Neuer State `search` (string)
- Import `Search` Icon von lucide-react und `Input` Komponente
- Suchleiste oberhalb der Tabelle (zwischen Empty-Check und Table): Input mit Search-Icon, Placeholder "Name, E-Mail oder Auftrag suchen..."
- Client-seitige Filterung: `groups` werden vor dem Rendern gefiltert nach `search` (case-insensitive Match auf `user_name`, `user_email`, `verification_title`)
- Gleicher Stil wie in `AdminVics.tsx` (bestehende Suchleiste als Vorlage)

### Dateien
- `src/components/AdminDocuments.tsx`

