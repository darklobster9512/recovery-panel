# Leichte Trennlinien in der Chat-Liste

- Zwischen den Chats in der linken Liste eine feine, helle Linie (sehr dezent, eingerückt ab dem Namen, nicht unter dem Bild).
- Beim ausgewählten Chat und dem direkt darüber wird die Linie ausgeblendet, damit die blaue Markierung sauber wirkt.

## Technisch
- Nur `src/components/AdminLivechat.tsx`: Listeneinträge bekommen eine Linie über `border-border/60` (Design-Token), z.B. per Pseudo-Linie ab Avatar-Breite.
