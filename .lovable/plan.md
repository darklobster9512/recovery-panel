# Seitentitel je nach Marke

## Aktueller Stand
- Fest im Grundgerüst der Seite steht "Korte & Partner — Rechtsanwaltskanzlei", als Titel und als Beschreibung.
- Nur die Login-Seite setzt den Titel passend zur Domain ("<Firmenname> – Login"). Sie tauscht außerdem das Favicon aus, wenn die Marke eines hat.
- Dashboard und Admin-Bereich setzen nichts. Lädt man sie direkt, etwa über portal.berthold-partner.de/dashboard, steht dort "Korte & Partner". Kommt man vom Login, bleibt "… – Login" stehen.

## Änderung
1. Ein gemeinsamer Baustein für die ganze App ermittelt die Marke über die aufgerufene Domain (gleiche Abfrage wie beim Login). Er setzt den Titel "<Firmenname> — <Untertitel>". Ohne Untertitel steht nur der Firmenname da.
2. Die Seiten setzen ihren Titel:
   - Login: "<Firmenname> – Login" (wie bisher)
   - Vic-Dashboard: "<Firmenname> – Mandantenportal"
   - Admin: "<Firmenname> – Admin". Hier zählt die Marke, die in der Seitenleiste ausgewählt ist.
3. Das Favicon bleibt immer das Standard-Favicon. Die Login-Seite tauscht es nicht mehr aus.
4. Das Grundgerüst der Seite bekommt einen neutralen Titel ("Mandantenportal"). So erscheint auf fremden Domains nicht kurz "Korte".

## Hinweis
Vorschauen beim Teilen von Links (WhatsApp, Google) lesen nur das feste Grundgerüst der Seite. Dort steht dann der neutrale Titel, nicht die Marke. Markenspezifische Link-Vorschauen bräuchten eine größere Umstellung der Technik.
