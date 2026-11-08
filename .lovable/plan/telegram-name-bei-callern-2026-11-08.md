# Telegram-Name bei Callern

## Was du bekommst
- Unter Caller gibt es beim **Erstellen** und **Bearbeiten** ein neues, optionales Feld **Telegram-Name** (z. B. `@maxmuster`).
- In der Caller-Tabelle gibt es eine neue Spalte **Telegram**. Ist das Feld leer, steht dort „–“.
- Nur für interne Zwecke: Vics sehen den Namen nie, und es wird nichts an Telegram geschickt.

## Technische Details
- Migration: `profiles.telegram_name text` (nullable). Die bestehenden Regeln für Profile gelten auch für das neue Feld: Admins können es lesen und bearbeiten, Manager nur bei ihren eigenen Callern.
- `create-user`: nimmt optional `telegram_name` an (gekürzt, max. 64 Zeichen) und speichert ihn beim Caller. Danach wird die Funktion neu veröffentlicht.
- `AdminCallers.tsx`: Feld im Erstellen- und Bearbeiten-Dialog, beim Speichern über ein Update auf `profiles`, neue Spalte in der Tabelle.
