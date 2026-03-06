

# Verifikationen-Feature im Admin Panel

## Datenbankänderungen

### 1. Storage Bucket für Logos
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-logos', 'verification-logos', true);
```
Plus RLS-Policies für Admin-Upload und öffentliches Lesen.

### 2. Neue Tabelle `verifications`
Spalten: `id` (uuid), `title` (text), `logo_url` (text), `instructions` (text[] — Array), `appstore_url` (text), `playstore_url` (text), `created_at` (timestamptz), `created_by` (uuid).
RLS: Nur Admins dürfen CRUD (via `has_role`).

## Code-Änderungen

### 1. Route hinzufügen (`App.tsx`)
Neue Route `/admin/verifikationen` → `ProtectedRoute requiredRole="admin"` → `AdminPanel`.

### 2. Sidebar-Eintrag (`AdminPanel.tsx`)
- Neuer navItem: `{ label: "Verifikationen", icon: FileText, path: "/admin/verifikationen" }`
- Neue Pfad-Erkennung `isVerifikationen` → rendert neue `AdminVerifications` Komponente
- Titel-Anpassung im Header

### 3. Neue Komponente `src/components/AdminVerifications.tsx`
- Lädt alle Verifikationen aus der DB
- Zeigt ein Grid (max 5 pro Reihe via `grid-cols-5`) mit:
  - **Erste Card**: Plus-Symbol, onClick öffnet Create-Dialog
  - **Weitere Cards**: Logo, Titel, Edit-Button
- **Dialog (Create/Edit)**:
  - Logo-Upload (File-Input → Supabase Storage hochladen)
  - Titel-Eingabefeld
  - Anweisungen: Liste + "Anweisung hinzufügen"-Button (dynamisch)
  - Appstore-URL und Playstore-URL Eingabefelder
  - Speichern-Button (Insert oder Update)
  - Löschen-Button (nur im Edit-Modus, mit Bestätigungsdialog)

### 4. Supabase Types
Wird automatisch nach Migration aktualisiert.

