# /auth als zentrierte Card umwandeln

## Ziel
Die bestehende `/auth`-Seite soll als mittig zentrierte Card dargestellt werden, wie im Referenzprojekt `vic-automation`. Inhalt, Texte, Icons und Farben bleiben erhalten – nur das äußere Layout wird in eine Card mit neutralem Hintergrund gepackt.

## Änderungen

1. **`src/pages/Auth.tsx`**
   - Äußerstes `div` ersetzen: von `min-h-screen flex bg-white text-gray-900` zu `min-h-screen flex items-center justify-center bg-slate-50 p-4 md:p-8`.
   - Beide innere Panels (Formular links, Hero rechts) in eine Card-Wrapper packen:
     - `max-w-6xl w-full flex flex-col md:flex-row shadow-2xl rounded-3xl overflow-hidden bg-white min-h-[800px]`
   - Formular-Panel: `w-full lg:w-1/2 p-8 lg:p-16` beibehalten, Inhalt unverändert.
   - Hero-Panel: `hidden lg:flex w-1/2` beibehalten, damit er erst ab `lg` sichtbar ist (wie bisher).
   - Keine inhaltlichen Änderungen an Logik, Formularfeldern, Toggle, Animationen oder Hero-Texten.

2. **Responsive Prüfung**
   - Screenshot der `/auth`-Seite im Preview machen (Desktop und Mobile-Breakpoint).
   - Sicherstellen, dass die Card mittig zentriert ist, der Hero weiterhin rechts neben dem Formular steht und auf kleinen Screens das Formular allein in der Card bleibt.

## Nicht im Scope
- Keine Änderung an Inhalt, Farben, Schriftarten oder Validierung.
- Kein neues Branding oder zusätzliche Felder.
