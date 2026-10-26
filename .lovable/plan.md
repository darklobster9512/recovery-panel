# DKB in die Standard-Auswahl aufnehmen

## Was sich ändert
- Im Popup „Verifikation anfragen“ ist in Schritt 3 jetzt auch „DKB — Video-Ident“ vorausgewählt und trägt das Badge „Standard“. Damit sind es sechs Standard-Verifikationen.
- Der Hinweistext „die fünf üblichen Verifikationen“ wird zu „die üblichen Verifikationen“.

## Technisch
- `src/lib/verificationRequests.ts`: `"DKB-videoident"` zu `DEFAULT_AUFTRAEGE` hinzufügen.
- Text in `RequestVerificationsSection.tsx` anpassen.
