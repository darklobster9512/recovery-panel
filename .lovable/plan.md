# Anfragen nur für Admins

- Sidebar: Menüpunkt „Anfragen“ bekommt `adminOnly: true`, Caller sehen ihn nicht mehr.
- Seite: `/admin/anfragen` in `App.tsx` auf `requiredRole="admin"` umstellen; in `AdminPanel.tsx` leitet die Seite Nicht-Admins auf `/admin` um (wie bei Brandings).
- Datenbank: Lese- und Bearbeitungsrechte für Kontaktanfragen nur noch für Admins (Caller-Teil aus beiden Regeln entfernen), damit Caller die Daten auch nicht direkt abrufen können.
