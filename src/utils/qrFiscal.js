import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import jsQR from "jsqr";
import { formatFechaInput } from "./format";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function decodeBase64Url(base64Url) {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "="
  );
  const jsonString = decodeURIComponent(escape(atob(padded)));
  return JSON.parse(jsonString);
}

export function extraerDatosQRFiscal(qrText) {
  const url = new URL(qrText);
  const p = url.searchParams.get("p");
  if (!p) throw new Error("El QR no contiene datos fiscales válidos.");
  return decodeBase64Url(p);
}

const TIPOS_COMPROBANTE = {
  1: "Factura A", 2: "Nota de Débito A", 3: "Nota de Crédito A",
  6: "Factura B", 7: "Nota de Débito B", 8: "Nota de Crédito B",
  11: "Factura C", 12: "Nota de Débito C", 13: "Nota de Crédito C",
  51: "Factura M",
};

export function tipoComprobanteLabel(codigo) {
  return TIPOS_COMPROBANTE[codigo] || `Comprobante ${codigo}`;
}

export async function leerQRDesdePDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2.5 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: context, viewport }).promise;
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const qr = jsQR(imageData.data, canvas.width, canvas.height);
    if (qr?.data) return qr.data;
  }

  throw new Error("No se encontró ningún código QR en el PDF.");
}

export function buildDatosFiscales(qrText) {
  const datos = extraerDatosQRFiscal(qrText);
  const tipoComprobante = tipoComprobanteLabel(datos.tipoCmp);
  const puntoVenta = String(datos.ptoVta || "").padStart(4, "0");
  const numeroComprobante = String(datos.nroCmp || "").padStart(8, "0");

  return {
    fecha: formatFechaInput(datos.fecha),
    sociedad: `CUIT ${datos.cuit}`,
    origen: "Factura fiscal",
    importe: Number(datos.importe || 0),
    comprobante: `${tipoComprobante} ${puntoVenta}-${numeroComprobante}`,
    datosFiscales: {
      ...datos,
      qrUrl: qrText,
      tipoComprobante,
      puntoVenta,
      numeroComprobante,
    },
  };
}