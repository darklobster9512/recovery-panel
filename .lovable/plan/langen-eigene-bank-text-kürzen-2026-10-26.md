# Langen „Eigene Bank“-Text kürzen

Auf /admin/verifikationen wird „Eigene Bank: …“ in den Karten unter „Angeforderte Verifikationen“ und „Bereit zum Start“ nach höchstens ca. 220px mit „…“ abgekürzt. Die Karte wird dadurch nicht mehr breiter. Fährt man mit der Maus über den Text, erscheint ein kleines Fenster mit dem vollständigen Text. Im Detail-Popup bleibt der volle Text stehen.

## Technische Details
- `RequestVerificationsSection.tsx` (Zeile 120) und `PreparedVerificationCards.tsx` (Zeile 151): Bank-Text in `<span className="inline-block max-w-[220px] truncate align-bottom">`, umschlossen von shadcn `Tooltip` mit dem vollen Text (nur wenn eine Bank angegeben ist).
