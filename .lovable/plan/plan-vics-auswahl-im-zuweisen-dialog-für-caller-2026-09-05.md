# Plan: Vics-Auswahl im Zuweisen-Dialog für Caller

## Problem
Im Caller-Konto ist die Vic-Liste im „Auftrag zuweisen"-Dialog (`/admin/verifikationen`) leer, obwohl dem Caller Vics zugewiesen sind.

## Ursache
`AssignVerificationDialog.fetchVics()` liest zuerst alle `user_roles` mit `role='user'`. Die RLS-Policy auf `user_roles` erlaubt Callern nur den Zugriff auf ihre eigene Zeile, daher kommt eine leere Liste zurück und `profiles` wird nie abgefragt. Gleiche Ursache wie zuvor bei `AdminVics.tsx`.

## Fix
`AssignVerificationDialog.tsx` bekommt denselben rollenabhängigen Zweig wie `AdminVics`:

- `useAuth()` einbinden, um `role` und `user.id` zu erhalten.
- In `fetchVics()`:
  - **Caller:** `profiles` direkt mit `.eq("assigned_caller_id", user.id)` abfragen (nur zugewiesene Vics).
  - **Admin:** bestehender `user_roles` → `profiles`-Ablauf.
- Die parallele Abfrage der bestehenden `verification_assignments` (für „bereits zugewiesen"-Markierung) bleibt unverändert.

Keine weiteren Änderungen an UI, RLS oder anderen Komponenten.
