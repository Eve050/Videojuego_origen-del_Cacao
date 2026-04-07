import { jsPDF } from "jspdf";

const BG_OUTER = [18, 18, 18];
const GREEN_DEEP = [26, 46, 35];
const GREEN_DARK = [13, 26, 20];
const GREEN_MID = [45, 77, 58];
const GOLD = [212, 175, 55];
const GOLD_SOFT = [247, 239, 138];
const GOLD_DARK = [146, 109, 39];
const TEXT_LIGHT = [248, 246, 240];
const TEXT_GOLD_SOFT = [212, 175, 85];

function drawFrameCorner(doc, x, y, sx = 1, sy = 1) {
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.35);
  doc.line(x, y, x + 9 * sx, y);
  doc.line(x, y, x, y + 9 * sy);
  doc.setLineWidth(0.2);
  doc.line(x + 1.8 * sx, y + 1.8 * sy, x + 7.4 * sx, y + 1.8 * sy);
  doc.line(x + 1.8 * sx, y + 1.8 * sy, x + 1.8 * sx, y + 7.4 * sy);
}

function drawInnerCorner(doc, x, y, sx = 1, sy = 1) {
  doc.setDrawColor(185, 157, 92);
  doc.setLineWidth(0.25);
  doc.line(x, y, x + 6.5 * sx, y);
  doc.line(x, y, x, y + 6.5 * sy);
  doc.setLineWidth(0.12);
  doc.line(x + 1.4 * sx, y + 1.4 * sy, x + 5.2 * sx, y + 1.4 * sy);
  doc.line(x + 1.4 * sx, y + 1.4 * sy, x + 1.4 * sx, y + 5.2 * sy);
}

/**
 * Genera y descarga el certificado en PDF (A4 horizontal, solo cliente).
 * @param {{ playerName: string; fileBase?: string }} opts
 */
export function downloadCertificatePdf(opts) {
  const playerName = (opts.playerName || "Explorador").trim() || "Explorador";
  const displayName = playerName.toUpperCase();
  const fileBase = opts.fileBase || "certificado-enigma-santa-ana";

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const frameOut = 8;
  const frameIn = 10;
  const contentPad = 4;
  const headerH = 32;
  const footerY = pageH - 18;

  // Fondo exterior oscuro
  doc.setFillColor(...BG_OUTER);
  doc.rect(0, 0, pageW, pageH, "F");

  // Marco premium dorado (simulación de gradiente por capas)
  doc.setDrawColor(...GOLD_DARK);
  doc.setLineWidth(1.8);
  doc.rect(frameOut, frameOut, pageW - frameOut * 2, pageH - frameOut * 2, "S");
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.85);
  doc.rect(frameOut + 1.3, frameOut + 1.3, pageW - (frameOut + 1.3) * 2, pageH - (frameOut + 1.3) * 2, "S");
  doc.setDrawColor(...GOLD_SOFT);
  doc.setLineWidth(0.35);
  doc.rect(frameOut + 2.1, frameOut + 2.1, pageW - (frameOut + 2.1) * 2, pageH - (frameOut + 2.1) * 2, "S");

  // Panel principal verde profundo
  doc.setFillColor(...GREEN_DEEP);
  doc.rect(frameIn, frameIn, pageW - frameIn * 2, pageH - frameIn * 2, "F");

  // Sombra interior sutil
  doc.setDrawColor(8, 14, 10);
  doc.setLineWidth(0.8);
  doc.rect(frameIn + 0.8, frameIn + 0.8, pageW - (frameIn + 0.8) * 2, pageH - (frameIn + 0.8) * 2, "S");

  // Header superior
  doc.setFillColor(...GREEN_MID);
  doc.rect(frameIn + 1.2, frameIn + 1.2, pageW - (frameIn + 1.2) * 2, headerH - 4.4, "F");
  doc.setFillColor(...GREEN_DARK);
  doc.rect(frameIn + 1.2, frameIn + headerH - 5, pageW - (frameIn + 1.2) * 2, 2.6, "F");

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.55);
  doc.line(frameIn + 1.2, frameIn + headerH - 2.4, pageW - frameIn - 1.2, frameIn + headerH - 2.4);

  // Esquinas decorativas del header
  drawFrameCorner(doc, frameIn + 6, frameIn + 6, 1, 1);
  drawFrameCorner(doc, pageW - frameIn - 6, frameIn + 6, -1, 1);
  drawFrameCorner(doc, frameIn + 6, frameIn + headerH - 6.2, 1, -1);
  drawFrameCorner(doc, pageW - frameIn - 6, frameIn + headerH - 6.2, -1, -1);

  // Titulos header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17.5);
  doc.setTextColor(...TEXT_LIGHT);
  doc.text("El Enigma de Santa Ana", pageW / 2, frameIn + 14.2, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_GOLD_SOFT);
  doc.text("La Florida · Ruta Orígenes del Cacao", pageW / 2, frameIn + 22.2, { align: "center" });
  doc.setFontSize(7.5);
  doc.setTextColor(212, 205, 183);
  doc.text("elorigendelcacao.com", frameIn + 8, frameIn + headerH - 3.4);

  // Marco interno del área central
  const bodyTop = frameIn + headerH + contentPad;
  const bodyBottom = footerY - contentPad;

  const bx1 = frameIn + 5;
  const bx2 = pageW - frameIn - 5;
  const by1 = bodyTop + 2.5;
  const by2 = bodyBottom - 2.5;

  doc.setDrawColor(...GOLD_DARK);
  doc.setLineWidth(0.42);
  doc.rect(bx1, by1, bx2 - bx1, by2 - by1, "S");
  doc.setDrawColor(...GOLD_SOFT);
  doc.setLineWidth(0.17);
  doc.rect(bx1 + 1.3, by1 + 1.3, bx2 - bx1 - 2.6, by2 - by1 - 2.6, "S");

  drawInnerCorner(doc, bx1 + 1.8, by1 + 1.8, 1, 1);
  drawInnerCorner(doc, bx2 - 1.8, by1 + 1.8, -1, 1);
  drawInnerCorner(doc, bx1 + 1.8, by2 - 1.8, 1, -1);
  drawInnerCorner(doc, bx2 - 1.8, by2 - 1.8, -1, -1);

  // Composición central premium
  const innerL = bx1 + 10;
  const innerR = bx2 - 10;
  const innerW = innerR - innerL;
  const centerCx = innerL + innerW / 2;
  const rightCx = innerR - 22;

  const certY = by1 + 18;
  const recognizeY = certY + 12;
  const nameY = recognizeY + 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...TEXT_GOLD_SOFT);
  const certLabel = "CERTIFICADO DIGITAL";
  const labelW = doc.getTextWidth(certLabel);
  doc.setDrawColor(168, 148, 88);
  doc.setLineWidth(0.2);
  doc.line(innerL + 8, certY - 1.3, centerCx - labelW / 2 - 6, certY - 1.3);
  doc.line(centerCx + labelW / 2 + 6, certY - 1.3, innerR - 8, certY - 1.3);
  doc.text(certLabel, centerCx, certY, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(...TEXT_LIGHT);
  doc.text("Se reconoce como", centerCx, recognizeY, { align: "center" });

  // Nombre principal estilo oro
  doc.setFont("times", "bold");
  doc.setFontSize(29);
  doc.setTextColor(244, 228, 168);
  const nameMaxW = innerW - 136;
  const nameLines = doc.splitTextToSize(displayName, nameMaxW);
  const nameLineH = 10;
  const nameBlockH = Math.max(1, nameLines.length) * nameLineH;
  doc.text(nameLines, centerCx, nameY, { align: "center" });

  // Subrayado fino del nombre
  doc.setDrawColor(172, 151, 92);
  doc.setLineWidth(0.18);
  doc.line(centerCx - 46, nameY + nameBlockH + 1.5, centerCx + 46, nameY + nameBlockH + 1.5);

  const honorY = nameY + nameBlockH + 10.2;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...TEXT_LIGHT);
  doc.text("con el título honorífico de", centerCx, honorY, { align: "center" });

  // Badge premium
  const badgeY = honorY + 10;
  const badgeW = 106;
  const badgeH = 10.2;
  const badgeX = centerCx - badgeW / 2;
  doc.setFillColor(13, 26, 20);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.28);
  if (typeof doc.roundedRect === "function") {
    doc.roundedRect(badgeX, badgeY - 4.8, badgeW, badgeH, 2.5, 2.5, "FD");
  } else {
    doc.rect(badgeX, badgeY - 4.8, badgeW, badgeH, "FD");
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...GOLD_SOFT);
  doc.text("★", badgeX + 8.5, badgeY + 1.15, { align: "center" });
  doc.text("★", badgeX + badgeW - 8.5, badgeY + 1.15, { align: "center" });
  doc.text("Explorador del Cacao", centerCx, badgeY + 1.2, { align: "center" });

  // Texto descriptivo centrado
  const yBody = badgeY + 19;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.8);
  doc.setTextColor(...TEXT_LIGHT);
  const bodyLines = doc.splitTextToSize(
    "Por completar la expedición educativa y las tres misiones sobre la historia del cacao y la cultura Mayo-Chinchipe en el sitio Santa Ana-La Florida (Palanda, Ecuador).",
    innerW - 140,
  );
  doc.text(bodyLines, centerCx, yBody, { align: "center" });

  // Sello lateral dorado
  const sealY = by1 + 40;
  doc.setFillColor(20, 33, 26);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.45);
  doc.circle(rightCx, sealY, 14, "FD");
  doc.setDrawColor(...GOLD_SOFT);
  doc.setLineWidth(0.2);
  doc.circle(rightCx, sealY, 12, "S");
  doc.circle(rightCx, sealY, 9.2, "S");
  doc.setDrawColor(...GOLD_DARK);
  doc.setLineWidth(0.25);
  doc.line(rightCx - 4.2, sealY, rightCx + 4.2, sealY);
  doc.line(rightCx, sealY - 4.2, rightCx, sealY + 4.2);
  doc.line(rightCx - 3.1, sealY - 3.1, rightCx + 3.1, sealY + 3.1);
  doc.line(rightCx + 3.1, sealY - 3.1, rightCx - 3.1, sealY + 3.1);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.7);
  doc.setTextColor(...GOLD_SOFT);
  doc.text("Ruta Orígenes del Cacao", rightCx, sealY - 6.4, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(4.2);
  doc.setTextColor(190, 180, 150);
  doc.text("SC | PE", rightCx, sealY + 7.2, { align: "center" });

  // Pie
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.32);
  doc.line(frameIn + 8, footerY, pageW - frameIn - 8, footerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(205, 188, 140);
  const fecha = new Date().toLocaleDateString("es-EC", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text("Ruta Orígenes del Cacao", frameIn + 10, footerY + 5.5);
  doc.text(`Expedido el ${fecha}`, pageW - frameIn - 10, footerY + 5.5, { align: "right" });
  doc.setFontSize(7.2);
  doc.setTextColor(160, 148, 118);
  doc.text(
    "Documento generado en tu navegador · Sin envío de datos al servidor",
    pageW / 2,
    footerY + 11,
    { align: "center" },
  );

  const safeFile =
    playerName
      .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 48) || "explorador";
  doc.save(`${fileBase}-${safeFile}.pdf`);
}
