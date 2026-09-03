# Favicon und Head-Metadata auf Korte & Partner umstellen

## Ziel
Das hochgeladene Bild als Favicon verwenden, das alte Favicon entfernen und alle Head-Metadaten auf die Kanzlei „Korte & Partner" ausrichten.

## Änderungen

1. **Favicon austauschen**
   - Hochgeladenes `favicon.png` aus `/mnt/user-uploads/` auf 64×64 Pixel skaliert nach `public/favicon.png` kopieren.
   - Altes `public/favicon.svg` löschen.
   - `index.html`: `<link rel="icon" href="/favicon.png" type="image/png">` setzen.

2. **Head-Metadata aktualisieren**
   - `<title>`: „Korte & Partner — Rechtsanwaltskanzlei" oder passender Kanzlei-Titel.
   - `<meta name="description">`: Beschreibung auf Krypto-Rückgewinnung und Rechtsberatung durch Korte & Partner.
   - `<meta name="author">`: „Korte & Partner".
   - `og:title`, `og:description`: An Korte & Partner anpassen.
   - `twitter:card` beibehalten.

## Technische Details
- Betroffene Dateien: `index.html`, `public/favicon.svg`, `public/favicon.png`.
- Keine Backend-Änderungen.
