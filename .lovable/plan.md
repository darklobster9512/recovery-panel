# Schritt 4: Angefragte Verifikationen nur als Logos

- Unter „Angefragte Verifikationen (n)“ stehen statt der Text-Abzeichen („BBVA-videoident“ usw.) nur noch die Bank-Logos: kleine quadratische Kacheln (ca. 48 px, Rahmen, abgerundet), nebeneinander mit Umbruch.
- Beim Draufzeigen erscheint der Name der Verifikation (z. B. „BBVA — Video-Ident“), damit man Video-Ident und Postident derselben Bank unterscheiden kann.
- Ohne hochgeladenes Logo erscheinen die ersten zwei Buchstaben der Bank.

## Technisch
- In `RequestVerificationsSection.tsx` die `Badge`-Liste durch `VerificationLogo` mit Initialen-Fallback ersetzen, `title={v.title}` am Container.
