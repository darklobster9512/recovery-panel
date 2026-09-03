import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { readBarcodesFromImageData, setZXingModuleOverrides } from "zxing-wasm/reader";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

setZXingModuleOverrides({
  locateFile: (path, prefix) => (path.endsWith(".wasm") ? "/wasm/zxing_reader.wasm" : prefix + path),
});

async function tryDetect(pdf: pdfjsLib.PDFDocumentProxy, scale: number): Promise<string | null> {
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas-Kontext nicht verfügbar");

  await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const results = await readBarcodesFromImageData(imageData, {
    formats: ["DataMatrix", "QRCode"],
    tryHarder: true,
  });

  if (!results.length) return null;
  const r = results[0];
  const pos: any = r.position;
  const xs = [pos.topLeft.x, pos.topRight.x, pos.bottomLeft.x, pos.bottomRight.x];
  const ys = [pos.topLeft.y, pos.topRight.y, pos.bottomLeft.y, pos.bottomRight.y];
  const minX = Math.max(0, Math.min(...xs));
  const minY = Math.max(0, Math.min(...ys));
  const maxX = Math.min(canvas.width, Math.max(...xs));
  const maxY = Math.min(canvas.height, Math.max(...ys));
  const w = maxX - minX;
  const h = maxY - minY;
  const pad = Math.round(Math.max(w, h) * 0.03);

  const cx = Math.max(0, Math.floor(minX - pad));
  const cy = Math.max(0, Math.floor(minY - pad));
  const cw = Math.min(canvas.width - cx, Math.ceil(w + pad * 2));
  const ch = Math.min(canvas.height - cy, Math.ceil(h + pad * 2));

  const crop = document.createElement("canvas");
  crop.width = cw;
  crop.height = ch;
  const cctx = crop.getContext("2d");
  if (!cctx) throw new Error("Canvas-Kontext nicht verfügbar");
  cctx.drawImage(canvas, cx, cy, cw, ch, 0, 0, cw, ch);
  return crop.toDataURL("image/png");
}

export async function extractPostidentCode(pdfUrl: string): Promise<string> {
  const res = await fetch(pdfUrl);
  if (!res.ok) throw new Error("PDF konnte nicht geladen werden");
  const buf = await res.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;

  for (const scale of [2.5, 3.5]) {
    const dataUrl = await tryDetect(pdf, scale);
    if (dataUrl) return dataUrl;
  }
  throw new Error("Code konnte nicht aus der PDF extrahiert werden");
}
