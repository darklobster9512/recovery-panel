# Vic-Bereich (/dashboard) an die Marke des Vics anpassen

Alles, was im Vic-Bereich fest „Korte“ zeigt, kommt künftig aus der Marke des eingeloggten Vics (z. B. Berthold & Partner).

## Was sich ändert

- **Seitenleiste oben + Kopfzeile am Handy:** Firmenname und Untertitel der Marke (statt „Korte & Partner / Rechtsanwaltskanzlei“). Hat die Marke ein Logo, wird es gezeigt.
- **Ansprechpartner ohne Caller:** Anwaltsname und Telefonnummer der Marke statt „Dr. Thomas Korte / 040 573086460“. Das Foto von Dr. Korte erscheint nur noch bei Korte; sonst ein Kreis mit Initialen.
- **Livechat:** Absendername ohne Caller wird „Kanzlei (<Anwalt der Marke>)“, Untertitel „Kanzlei <Firmenname>“.
- **Termin buchen:** Ohne Caller steht der Anwalt der Marke statt Dr. Korte.
- **Rückverfolgung (Anleitung mit Kontaktdaten):** Firmenname, E-Mail, Website, Adresse und Anwalt aus der Marke.
- Die Seite wartet kurz, bis die Markendaten da sind, damit nicht erst Korte aufblitzt.

Unverändert bleiben die Logos von Europol/IOSCO/Postident und die Bank-Logos.

## Technische Details

- `my_branding()` um `street, city, phone, email, lawyer, website` erweitern (nur eigene Marke, keine Zugangsdaten).
- Neuer Hook `useMyBranding()` (gecacht) mit Fallback auf die bisherigen Korte-Werte aus `src/lib/settings.ts`.
- Anpassen: `Dashboard.tsx` (Logo-Block, Mobile-Header, Ansprechpartner, Chat-Props), `ChatWidget.tsx`, `BookingPanel.tsx`, `RecoveryGuide.tsx`.
- Foto `/thomas-korte.png` nur zeigen, wenn der Anwalt „Dr. Thomas Korte“ ist.
