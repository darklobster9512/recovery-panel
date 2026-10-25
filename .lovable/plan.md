# Popup „Bereit zum Start“: Telefonnummer und E-Mail kopieren

- Ein Klick auf die Telefonnummer kopiert sie in die Zwischenablage, statt einen Anruf zu starten.
- Ein Klick auf die E-Mail kopiert sie ebenfalls, statt das Mailprogramm zu öffnen.
- Kurze Bestätigung „Telefonnummer kopiert“ bzw. „E-Mail kopiert“; das Symbol wechselt kurz zu einem Haken.

## Technisch
- `PreparedVerificationCards.tsx`: `tel:`/`mailto:`-Links durch Buttons mit `navigator.clipboard.writeText` + `toast.success` ersetzen.
