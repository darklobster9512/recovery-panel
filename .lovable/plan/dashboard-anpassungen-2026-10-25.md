# Dashboard-Anpassungen

1. **Kachel „Neue Leads ohne Caller“ → „Vics ohne Caller“**: zählt Vics ohne zugewiesenen Caller, Klick führt zu /admin/vics.
2. **„Abschlussquote“ → „Hochgeladene Dokumente (7 Tage)“**: Anzahl der Uploads der letzten 7 Tage mit Trend zur Vorwoche und Gesamtzahl.
3. **„Nächste Termine“ → „Vics ohne Caller“ (Liste)**: die 5 neuesten Vics ohne Caller mit Name, E-Mail und Registrierungsdatum. Ein Klick öffnet den Vic, „Alle“ führt zu /admin/vics.

Termine heute bleiben als Kachel oben erhalten.

## Technische Details
- In `AdminDashboard.tsx`: Abfrage `profiles` mit `assigned_caller_id IS NULL`; Mitarbeiter (admin/caller) über `user_roles` herausfiltern. `user_documents.created_at` der letzten 14 Tage abfragen und Gesamtzahl per Count holen.
