# Dark Theme im Admin-Panel

## Umschalter
- Unten in der Seitenleiste neben dem Abmelden-Knopf: Sonne/Mond-Symbol zum Umschalten (bei eingeklappter Leiste als Symbol).
- Die Wahl wird im Browser gemerkt und gilt pro Gerät.
- Gilt nur im Admin-Panel (Admins und Caller). Login-Seite und Vic-Dashboard bleiben hell.

## Dark Theme (blaue Akzente)
- Hintergrund tiefes Nachtblau (fast schwarz), Kästen eine Stufe heller, feine bläuliche Ränder.
- Akzentfarbe leuchtendes Blau (#3B82F6-Ton) für Knöpfe, aktiven Menüpunkt, Links, Zähler; leichter blauer Schimmer bei Schatten.
- Text hellgrau-weiß, Nebentexte gedämpftes Blaugrau.
- Seitenleiste noch etwas dunkler als der Inhalt, aktiver Punkt kräftig blau.
- Grün/Gelb/Rot für Status gedämpft, damit sie auf dunkel gut lesbar sind.
- Stellen mit fest eingestellten hellen Farben (z.B. farbige Status-Abzeichen, ca. 14 Dateien) bekommen passende dunkle Varianten.

## Sonstiges
- Die bisherige Projektregel "nur helles Design" wird angepasst: hell bleibt Standard, dunkel optional im Admin-Panel.

## Technisch
- `index.css`: `.dark`-Block mit allen Tokens (inkl. sidebar-*, shadows).
- Kleiner Theme-Hook (localStorage `admin-theme`), setzt `dark`-Klasse auf `<html>` beim Mount von `AdminPanel`, entfernt sie beim Verlassen.
- Toggle-Button im `SidebarFooter` von `AdminPanel.tsx`.
- Hardcodierte Farbklassen (`bg-blue-100` usw.) um `dark:`-Varianten ergänzen.
- Memory "Design Theme" aktualisieren.
