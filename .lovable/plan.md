# Fallback-Bild im Livechat-Widget

## Problem
Im Livechat-Widget wird das Bild von Dr. Thomas Korte (Fallback, wenn kein Caller zugewiesen ist) nicht geladen.

## Ursache
In `src/pages/Dashboard.tsx` verweist der Fallback auf `/thomaskorte.png`, die Datei im `public/`-Ordner heißt aber `thomas-korte.png` (mit Bindestrich). Der Request läuft ins Leere.

## Fix
- In `src/pages/Dashboard.tsx` beim ChatWidget-Fallback `avatar_url` von `/thomaskorte.png` auf `/thomas-korte.png` ändern (identisch zur bereits genutzten `thomasKorte`-Konstante — am besten die Konstante wiederverwenden).

Keine weiteren Änderungen nötig.
