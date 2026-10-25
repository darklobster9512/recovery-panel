# Livechat schöner gestalten

Nur Optik, keine Funktionsänderung.

## Chat-Liste (links)
- Kopfzeile "Chats" mit Anzahl ungelesener Chats, darunter Suchfeld mit weichem, abgerundetem Hintergrund.
- Jeder Eintrag mit rundem Initialen-Avatar (Markenblau-Ton), Name fett, Uhrzeit der letzten Nachricht rechts ("10:24", "Gestern", Datum).
- Letzte Nachricht einzeilig grau; ungelesene: Name + Vorschau dunkler, blaue Zahl-Pille.
- Aktiver Chat: hellblauer Hintergrund mit blauer Linie links statt grauem Block. Weicher Hover.

## Chat-Fenster (rechts)
- Kopfzeile mit größerem Avatar, Name, E-Mail; "Antworten als" als dezentes Feld rechts.
- Nachrichtenbereich mit Tages-Trennern ("Heute", "Gestern", Datum) als kleine Pille in der Mitte.
- Sprechblasen: eigene blau mit abgerundeter Ecke unten rechts, Vic-Nachrichten weiß mit feinem Rand und Schatten; Uhrzeit klein unten in der Blase; Absendername nur bei Wechsel.
- Anhänge: Bilder mit runden Ecken, Dateien als kleine Karte mit Symbol.
- Leerer Zustand: großes Symbol in hellblauem Kreis, Überschrift + Hinweis.
- Eingabezeile als abgerundete "Pille" mit Büroklammer und rundem blauen Senden-Knopf.

## Technisch
- Nur `src/components/AdminLivechat.tsx`, nur Klassen/Markup; Farben über bestehende Design-Tokens (hell, Primär #0061FF).
- Danach im Browser per Screenshot prüfen.
