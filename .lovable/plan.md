# Neuer Reiter „Anleitung“ im Dashboard

Ein neuer Reiter im `/dashboard` zeigt die Kanzlei-Anleitung „Rückführung verlorener Kryptowährungen“ als eigene Seite an, inklusive Buttons zum Herunterladen der Trust Wallet App.

## Was gebaut wird

- Neuer Button/Reiter im Header (Desktop + Mobile-Menü) neben „Dokumente hochladen“, z.B. mit Label „Anleitung“ (Icon: BookOpen).
- Klick öffnet eine neue Ansicht im Dashboard (analog zu `showDocUpload`), keine neue Route nötig — via State `showGuide`.
- Die Ansicht rendert das hochgeladene Dokument als HTML-Seite (nicht als Bild), passend zum Kanzlei-Look:
  - Kopfbereich in Navy mit Wordmark „Korte & Partner“ und goldener Trennlinie.
  - Zwei-Spalten-Layout: links Titel „Anleitung zu Rückführungen verlorener Kryptowährungen“ und die 3 nummerierten Schritte (Trust Wallet erstellen, Empfangsadresse übermitteln, Übertragung), rechts Kontaktblock (Telefon, E-Mail, Internet, Adresse).
  - Blau hinterlegter Sicherheitshinweis-Kasten (Seed Phrase niemals weitergeben).
  - Footer in Navy mit Geschäftsführung Dr. Thomas Korte, Registereintrag Amtsgericht Hamburg PR 317, USt-IdNr. DE317391938, Partnerschaften (IOSCO, CYSEC).
- Direkt unter Schritt 1 (bzw. am Ende der Schritte) die zwei Badge-Buttons App Store und Google Play mit den offiziellen Trust-Wallet-Links:
  - App Store: `https://apps.apple.com/app/trust-crypto-bitcoin-wallet/id1288339409`
  - Google Play: `https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp`
- Verwendet die vorhandenen Badges `src/assets/app-store.svg` und `src/assets/google-play.svg`.
- Zurück-Button oben links (wie in Detail-/Upload-Ansicht).

## Technische Details

- Datei: `src/pages/Dashboard.tsx`.
- Neuer State `showGuide` + Toggle-Buttons in Desktop-Header und Mobile-Sheet.
- Beim Öffnen von Guide: `setSelectedId(null); setShowDocUpload(false); setShowGuide(true);` (analog umgekehrt in den anderen Togglern).
- Neue Komponente inline oder `src/components/RecoveryGuide.tsx` mit reinem JSX/Tailwind — keine Backend-/DB-Änderung.
- Kein Bild-Embed des hochgeladenen JPEG; das Dokument wird nachgebaut, damit Text scharf und responsive ist.
