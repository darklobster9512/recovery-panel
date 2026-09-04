# Caller-Zugriff einschränken

Caller sollen die Bereiche **Einstellungen**, **Telegram**, **Email Vorlagen** und **Caller** nicht mehr sehen und nicht mehr aufrufen können. Nur Admins haben Zugriff.

## Änderungen

**`src/App.tsx`** — Routen `/admin/einstellungen`, `/admin/telegram`, `/admin/emails` von `ADMIN_OR_CALLER` auf `requiredRole="admin"` umstellen. (`/admin/caller` ist bereits admin-only.)

**`src/pages/AdminPanel.tsx`** — In `navItems` bei den Einträgen „Email Vorlagen", „Telegram" und „Einstellungen" `adminOnly: true` setzen, damit die Sidebar sie für Caller ausblendet.

Verhalten: Ruft ein Caller eine dieser URLs direkt auf, leitet `ProtectedRoute` ihn zurück auf `/admin`.
