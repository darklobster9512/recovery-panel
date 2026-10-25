# Schritt 3: Bank-Karten neu

## Was sich ändert
- Jeder Auftrag ist eine eigene Karte über die volle Breite (eine Zeile pro Karte): Logo der Bank links (aus der Verifikation, sonst runde Initialen), Bankname groß, darunter „Video-Ident“ / „Postident“, rechts Häkchen bzw. Badge „Standard“.
- Ausgewählte Karten stehen oben (Überschrift „Ausgewählt (n)“), nicht ausgewählte darunter („Weitere Verifikationen“). Beim Anklicken wandert die Karte in den passenden Bereich. Ausgewählte Karten haben blauen Rand und leichten blauen Hintergrund.
- Banken, bei denen der Vic laut „Aktuelle Bank“ schon Kunde ist, stehen ganz unten, ausgegraut, nicht anklickbar, nie ausgewählt, mit Vermerk „Vic ist bereits Kunde dieser Bank“. Auch wenn sie zu den Standard-Aufträgen gehören, werden sie automatisch abgewählt.
- Mehrere Banken werden erkannt, z. B. „Sparkasse Targobank“, „Sparkasse, Targobank“, „Sparkasse / Targobank“, „Sparkasse und Targobank“. Groß-/Kleinschreibung und Leerzeichen egal („deutsche bank“, „DeutscheBank“ passen beide zu Deutsche Bank).

## Technisch
- Neue Funktion `blockedBanks(bankInput, verifications)` in `src/lib/verificationRequests.ts`: normalisiert Eingabe (lowercase, Umlaute, Leerzeichen/Satzzeichen entfernt) und prüft je Bankname der Verifikationen, ob der normalisierte Name in der normalisierten Eingabe vorkommt. Damit werden auch mehrteilige Namen ohne Trennzeichen erkannt.
- Beim Wechsel zu Schritt 3 werden blockierte Keys aus `selected` entfernt; Toggle für blockierte Karten gesperrt.
- Verifikationen werden zusätzlich mit `logo_url` geladen.
- Tests in `src/test/verificationRequests.test.ts`: „Sparkasse Targobank“ blockiert Targobank, „Sparkasse, Deutsche Bank“ blockiert Deutsche Bank, „deutschebank“ ebenso, „Sparkasse“ blockiert keine Auftragsbank.
