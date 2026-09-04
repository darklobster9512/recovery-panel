# Foto im Chat-Fenster wie in der Seitenleiste zuschneiden

Im Chat-Fenster wird das Foto von Dr. Thomas Korte komplett eingepasst, dadurch sieht man den Oberkörper statt des Gesichts. In der Seitenleiste ist es bereits so zugeschnitten, dass nur der obere Bildbereich (Kopf) sichtbar ist. Das Chat-Fenster soll denselben Zuschnitt bekommen.

## Was sich ändert

- Das Foto im Kopfbereich des Chat-Fensters zeigt künftig nur den oberen Bildausschnitt, also das Gesicht – identisch zur Seitenleiste.
- Gilt nur für das Ersatz-Foto (Dr. Thomas Korte). Fotos von zugewiesenen Ansprechpartnern bleiben wie bisher normal eingepasst.

## Technische Umsetzung

- `src/components/chat/ChatWidget.tsx`: optionales Prop `avatarCropTop?: boolean`. Ist es gesetzt, wird das Bild im Header mit denselben Klassen gerendert wie in der Sidebar (`absolute left-1/2 top-0 h-[250%] w-auto max-w-none -translate-x-1/2` im `relative overflow-hidden`-Container) statt `w-full h-full object-cover`.
- `src/pages/Dashboard.tsx`: `avatarCropTop={!assignedCaller}` an `ChatWidget` übergeben.
