# Angeforderte Verifikationen: Logos statt Texte

- In der Liste der angeforderten Verifikationen (Karten mit „In Bearbeitung“) werden die Text-Abzeichen wie „BBVA-videoident“ durch kleine Bank-Logo-Kacheln ersetzt (wie in Schritt 4). Beim Draufzeigen erscheint der Name, z. B. „BBVA — Video-Ident“. Ohne Logo: die ersten zwei Buchstaben.
- Die Zeile unter dem Namen zeigt „Eigene Bank: Sparkasse“ statt „Bank: Sparkasse“.

## Technisch
- `RequestVerificationsSection.tsx`: Auftrags-Keys über `auftragKey()` den geladenen Verifikationen zuordnen, `VerificationLogo` mit Initialen-Fallback rendern; Label-Text anpassen.
