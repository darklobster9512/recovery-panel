# Workaround für private Verifikationslogos

## Umsetzung
- Eine zentrale Logo-Hilfsfunktion ergänzen, die aus den bereits gespeicherten öffentlichen Supabase-URLs den Objektpfad extrahiert und für den privaten Bucket `verification-logos` eine zeitlich begrenzte Signed URL erzeugt.
- Bestehende externe oder bereits signierte URLs unverändert unterstützen, damit alte und zukünftige Einträge robust funktionieren.
- Die aufgelösten URLs in allen Logo-Ansichten verwenden: Verifikationsverwaltung, Zuweisungshistorie, Vic-Details und Benutzer-Dashboard.
- Beim Hochladen künftig den stabilen Storage-Pfad statt einer nicht nutzbaren Public URL speichern; bestehende Daten bleiben kompatibel und Logos müssen nicht neu hochgeladen werden.
- Bei fehlgeschlagenem Laden einen neutralen Logo-Platzhalter anzeigen statt eines kaputten Bildsymbols.

## Technische Details
- Der Bucket bleibt privat; die vorhandene Lesepolicy erlaubt authentifizierten Nutzern das Erzeugen von Signed URLs.
- Signed URLs werden clientseitig gebündelt erzeugt und zwischengespeichert, um unnötige Storage-Anfragen zu vermeiden.
- Nach der Umsetzung werden Admin- und Benutzeransicht im Browser geprüft.
