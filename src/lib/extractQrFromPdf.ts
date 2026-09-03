import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import jsQR from "jsqr";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export interface QrExtractionResult {
  qrDataUrl: string;
  foundQr: boolean;
}

export async function extractQrFromPdf(pdfUrl: string): Promise<QrExtractionResult> {
  const res = await fetch(pdfUrl);
  if (!res.ok) throw new Error("PDF konnte nicht geladen werden");
  const buf = await res.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2.5 });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas-Kontext nicht verfügbar");

  await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const qr = jsQR(imageData.data, imageData.width, imageData.height);

  if (qr && qr.location) {
    const xs = [
      qr.location.topLeftCorner.x,
      qr.location.topRightCorner.x,
      qr.location.bottomLeftCorner.x,
      qr.location.bottomRightCorner.x,
    ];
    const ys = [
      qr.location.topLeftCorner.y,
      qr.location.topRightCorner.y,
      qr.location.bottomLeftCorner.y,
      qr.location.bottomRightCorner.y,
    ];
    const minX = Math.max(0, Math.min(...xs));
    const minY = Math.max(0, Math.min(...ys));
    const maxX = Math.min(canvas.width, Math.max(...xs));
    const maxY = Math.min(canvas.height, Math.max(...ys));
    const w = maxX - minX;
    const h = maxY - minY;
    const pad = Math.round(Math.max(w, h) * 0.12);

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
    return { qrDataUrl: crop.toDataURL("image/png"), foundQr: true };
  }

  return { qrDataUrl: canvas.toDataURL("image/png"), foundQr: false };
}
