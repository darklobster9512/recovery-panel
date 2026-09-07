# Login-Fehler beheben

## Problem
Beim Login erscheint „Es ist ein Fehler aufgetreten“. Der Auth-Server meldet intern:

```
error finding user: sql: Scan error on column index 3, name "confirmation_token": converting NULL to string is unsupported
```

Ursache: Beim manuellen Anlegen der Auth-Konten (Admin und die 45 wiederhergestellten Vics) wurden Textspalten wie `confirmation_token`, `recovery_token`, `email_change_token_new`, `email_change_token_current`, `phone_change_token`, `reauthentication_token` und `email_change` auf `NULL` gelassen. Supabase GoTrue erwartet dort leere Strings (`''`) und stürzt beim Login ab, sobald einer dieser Werte `NULL` ist.

## Fix
Ein einmaliges Update auf `auth.users`, das alle betroffenen Token-Spalten von `NULL` auf `''` setzt — für alle bestehenden Konten, nicht nur den Admin.

Danach: Login mit `admin@admin.de` / `admin123` erneut testen.

## Technische Details
```sql
UPDATE auth.users SET
  confirmation_token        = COALESCE(confirmation_token, ''),
  recovery_token            = COALESCE(recovery_token, ''),
  email_change_token_new    = COALESCE(email_change_token_new, ''),
  email_change_token_current= COALESCE(email_change_token_current, ''),
  email_change              = COALESCE(email_change, ''),
  phone_change              = COALESCE(phone_change, ''),
  phone_change_token        = COALESCE(phone_change_token, ''),
  reauthentication_token    = COALESCE(reauthentication_token, '');
```

Keine Code-, Schema- oder RLS-Änderungen nötig.
