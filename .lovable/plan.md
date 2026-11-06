# Consorsbank & Santander immer als Postident anfragen

## Ist-Zustand (geprüft)
- Es gibt die Verifikationen "Consorsbank — Postident", "Santander — Postident" und zusätzlich "Santander — Video-Ident".
- Aktuelle Video-Ident-Einträge in Anfragen: Consorsbank 3x bereit, 1x gestartet; Santander 1x in Bearbeitung, 1x fehlgeschlagen.

## Änderungen
1. **Anfrage-Fenster:** Für Consorsbank und Santander wird nur noch Postident angeboten; "Santander — Video-Ident" taucht beim Anfragen nicht mehr auf. Ans Panel geht immer `Consorsbank-postident` / `Santander-postident`.
2. **Server-Absicherung:** Die Anfrage-Funktion wandelt Consorsbank/Santander-Video-Ident automatisch in Postident um, bevor ans Panel gesendet wird.
3. **Bestehende Einträge umstellen:** Alle bestehenden Consorsbank-/Santander-Video-Ident-Einträge (bereit, gestartet, in Bearbeitung, fehlgeschlagen) werden auf Postident umgeschrieben und mit der Postident-Verifikation verknüpft. Bereits gestartete Aufträge beim Vic werden ebenfalls auf die Postident-Verifikation umgestellt.
4. **Ergebnisse vom Panel:** Wenn das Panel noch mit "videoident" für diese Banken antwortet, wird das als Postident zugeordnet.

## Hinweis
Der eine Santander-Eintrag "in Bearbeitung" liegt schon beim Panel als Video-Ident – das Panel selbst kann ich nicht umstellen; bei uns wird er als Postident erwartet.

## Technisch
- `src/lib/verificationRequests.ts`: `FORCE_POSTIDENT_BANKS = ["consorsbank","santander"]`, `normalizeAuftragKey()`; Liste in `RequestVerificationsSection.tsx` filtert Video-Ident-Varianten dieser Banken.
- `request-verifications` und `prepare-results` normalisieren Keys gleich; Test in `src/test/verificationRequests.test.ts`.
- Datenänderung: `verification_request_items.auftrag_key/verification_id`, `auftraege`-Arrays in `verification_requests`, betroffene `verification_assignments.verification_id`.
