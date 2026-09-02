# Leads-Ansicht ausbessern

## Problem
Der /admin/leads-Bereich wurde angelegt, aber im Preview sind die Aktionsspalte und die Detailseite nicht sichtbar/nutzbar. Hauptursache: der Admin-Content liegt in `AdminPanel.tsx` in einem `max-w-5xl`-Container, der die Tabelle einschnürt und bei vielen Spalten die Aktionen verdrängt.

## Lösung

1. **Admin-Content auf volle Breite bringen**
   - In `src/pages/AdminPanel.tsx` den `max-w-5xl`-Wrapper entfernen, sodass `<main>` die volle verfügbare Breite nutzt.
   - Padding und innere Abstände beibehalten.

2. **Leads-Tabelle für volle Breite anpassen**
   - In `src/components/AdminLeads.tsx` die Tabelle in einen horizontal scrollbaren Container packen (`overflow-x-auto`), damit alle Spalten inklusive Aktionen erreichbar bleiben.
   - Die Aktionsspalte fix am rechten Rand sichtbar halten (z. B. `sticky right-0 bg-white` oder zumindest `whitespace-nowrap` und ausreichend Breite).
   - Spaltenbreiten optimieren, damit Name, Telefon, Email und Schadenshöhe nicht unnötig Platz wegnehmen.

3. **Detailseite & Aktionen verifizieren**
   - Prüfen, dass `/admin/leads/:id` in `src/App.tsx` weiterhin registriert ist.
   - Prüfen, dass `AdminPanel.tsx` `isLeadDetail` korrekt erkennt und `AdminLeadDetail` rendert.
   - Sicherstellen, dass das Eye-Icon in der Aktionsspalte zu `/admin/leads/:id` navigiert.

4. **Visuelle Kontrolle im Preview**
   - Screenshot von /admin/leads machen und prüfen, dass Import-Button, Status-Dropdown, Aktionen-Icons (Notiz + Auge) und der Link zur Detailseite sichtbar und klickbar sind.

## Dateien, die geändert werden
- `src/pages/AdminPanel.tsx`
- `src/components/AdminLeads.tsx`

## Nicht im Scope
- Keine Änderungen an der Datenbank, den Edge Functions oder anderen Admin-Reitern.
- Keine neuen Features, nur Layout-Fix und Verifikation der bestehenden Leads-Implementierung.
