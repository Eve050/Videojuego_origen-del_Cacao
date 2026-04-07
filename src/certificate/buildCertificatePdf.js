import { jsPDF } from "jspdf";

const GREEN = [29, 107, 58];
const GREEN_DARK = [18, 68, 42];
const GOLD = [200, 146, 26];
const GOLD_SOFT = [235, 215, 160];
const CREAM = [252, 249, 242];
const CREAM_EDGE = [245, 238, 225];
const BROWN = [26, 13, 5];
const BROWN_MUTED = [90, 78, 68];

function drawCornerOrnament(doc, x, y, sx = 1, sy = 1) {
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.24);
  doc.line(x, y, x + 7 * sx, y);
  doc.line(x, y, x, y + 7 * sy);
  doc.setLineWidth(0.14);
  doc.line(x + 1.6 * sx, y + 1.6 * sy, x + 6.2 * sx, y + 1.6 * sy);
  doc.line(x + 1.6 * sx, y + 1.6 * sy, x + 1.6 * sx, y + 6.2 * sy);
  doc.setLineWidth(0.12);
  doc.line(x + 2.5 * sx, y + 4.2 * sy, x + 4.8 * sx, y + 4.2 * sy);
  doc.line(x + 4.2 * sx, y + 2.5 * sy, x + 4.2 * sx, y + 4.8 * sy);
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
  const headerH = 32;
  const footerY = pageH - 17;

  // Fondo general
  doc.setFillColor(...CREAM_EDGE);
  doc.rect(0, 0, pageW, pageH, "F");

  // Marco exterior doble
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.85);
  doc.rect(frameOut, frameOut, pageW - frameOut * 2, pageH - frameOut * 2, "S");
  doc.setDrawColor(...GREEN_DARK);
  doc.setLineWidth(0.25);
  doc.rect(frameIn, frameIn, pageW - frameIn * 2, pageH - frameIn * 2, "S");

  doc.setFillColor(...GOLD);
  doc.rect(frameIn, frameIn, pageW - frameIn * 2, 1, "F");

  // Cabecera verde
  doc.setFillColor(...GREEN);
  doc.rect(frameIn, frameIn + 1, pageW - frameIn * 2, headerH - 1, "F");
  doc.setFillColor(...GREEN_DARK);
  doc.rect(frameIn, frameIn + headerH - 7, pageW - frameIn * 2, 7, "F");

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(frameIn, frameIn + headerH, pageW - frameIn, frameIn + headerH);

  const hx1 = frameIn + 7;
  const hx2 = pageW - frameIn - 7;
  const hy1 = frameIn + 6;
  const hy2 = frameIn + headerH - 5;
  doc.setDrawColor(...GOLD_SOFT);
  doc.setLineWidth(0.3);
  const L = 8;
  doc.line(hx1, hy1, hx1 + L, hy1);
  doc.line(hx1, hy1, hx1, hy1 + L);
  doc.line(hx2, hy1, hx2 - L, hy1);
  doc.line(hx2, hy1, hx2, hy1 + L);
  doc.line(hx1, hy2, hx1 + L, hy2);
  doc.line(hx1, hy2, hx1, hy2 - L);
  doc.line(hx2, hy2, hx2 - L, hy2);
  doc.line(hx2, hy2, hx2, hy2 - L);

  doc.setTextColor(249, 242, 221);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("El Enigma de Santa Ana", pageW / 2, frameIn + 14, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("La Florida · Ruta Orígenes del Cacao", pageW / 2, frameIn + 22, { align: "center" });
  doc.setFontSize(8);
  doc.setTextColor(220, 210, 188);
  doc.text("elorigendelcacao.com", hx1, frameIn + headerH - 3);

  const bodyPad = 2;
  const bodyTop = frameIn + headerH + bodyPad;
  const bodyBottom = footerY - bodyPad;

  doc.setFillColor(...CREAM);
  doc.rect(frameIn + bodyPad, bodyTop, pageW - (frameIn + bodyPad) * 2, bodyBottom - bodyTop, "F");
  // Velo cálido suave para tono pergamino.
  doc.setFillColor(249, 244, 232);
  doc.rect(frameIn + bodyPad, bodyTop, pageW - (frameIn + bodyPad) * 2, bodyBottom - bodyTop, "F");

  const bx1 = frameIn + 5;
  const bx2 = pageW - frameIn - 5;
  const by1 = bodyTop + 4;
  const by2 = bodyBottom - 6;

  doc.setDrawColor(...GOLD_SOFT);
  doc.setLineWidth(0.2);
  doc.rect(bx1 + 3, by1 + 2, bx2 - bx1 - 6, by2 - by1 - 4, "S");
  doc.setDrawColor(194, 166, 110);
  doc.setLineWidth(0.15);
  doc.rect(bx1 + 4.4, by1 + 3.4, bx2 - bx1 - 8.8, by2 - by1 - 6.8, "S");

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  const c = 6;
  doc.line(bx1 + 3, by1 + 2, bx1 + 3 + c, by1 + 2);
  doc.line(bx1 + 3, by1 + 2, bx1 + 3, by1 + 2 + c);
  doc.line(bx2 - 3, by1 + 2, bx2 - 3 - c, by1 + 2);
  doc.line(bx2 - 3, by1 + 2, bx2 - 3, by1 + 2 + c);
  doc.line(bx1 + 3, by2 - 2, bx1 + 3 + c, by2 - 2);
  doc.line(bx1 + 3, by2 - 2, bx1 + 3, by2 - 2 - c);
  doc.line(bx2 - 3, by2 - 2, bx2 - 3 - c, by2 - 2);
  doc.line(bx2 - 3, by2 - 2, bx2 - 3, by2 - 2 - c);
  drawCornerOrnament(doc, bx1 + 4.8, by1 + 4, 1, 1);
  drawCornerOrnament(doc, bx2 - 4.8, by1 + 4, -1, 1);
  drawCornerOrnament(doc, bx1 + 4.8, by2 - 4, 1, -1);
  drawCornerOrnament(doc, bx2 - 4.8, by2 - 4, -1, -1);

  // Composición central limpia y elegante.
  const innerL = bx1 + 8;
  const innerR = bx2 - 8;
  const innerW = innerR - innerL;
  const centerCx = innerL + innerW / 2;
  const rightCx = innerR - 22;

  const certY = by1 + 18;
  const recognizeY = certY + 12;
  const nameY = recognizeY + 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BROWN);
  const certLabel = "CERTIFICADO DIGITAL";
  const labelW = doc.getTextWidth(certLabel);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.22);
  doc.line(innerL + 10, certY - 1.4, centerCx - labelW / 2 - 6, certY - 1.4);
  doc.line(centerCx + labelW / 2 + 6, certY - 1.4, innerR - 10, certY - 1.4);
  doc.text(certLabel, centerCx, certY, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12.5);
  doc.setTextColor(...BROWN_MUTED);
  doc.text("Se reconoce como", centerCx, recognizeY, { align: "center" });

  doc.setFont("times", "bold");
  doc.setFontSize(31);
  doc.setTextColor(128, 88, 24);
  const nameMaxW = innerW - 120;
  const nameLines = doc.splitTextToSize(displayName, nameMaxW);
  const nameLineH = 10;
  const nameBlockH = Math.max(1, nameLines.length) * nameLineH;
  doc.text(nameLines, centerCx, nameY, { align: "center" });
  // Subrayado fino del nombre.
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.2);
  doc.line(centerCx - 38, nameY + nameBlockH + 1.2, centerCx + 38, nameY + nameBlockH + 1.2);

  const honorY = nameY + nameBlockH + 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...BROWN_MUTED);
  doc.text("con el título honorífico de", centerCx, honorY, { align: "center" });

  const badgeY = honorY + 9.5;
  const badgeW = 98;
  const badgeH = 9;
  const badgeX = centerCx - badgeW / 2;
  doc.setFillColor(...GREEN_DARK);
  doc.setDrawColor(173, 141, 76);
  doc.setLineWidth(0.16);
  if (typeof doc.roundedRect === "function") {
    doc.roundedRect(badgeX, badgeY - 4.2, badgeW, badgeH, 1.4, 1.4, "FD");
  } else {
    doc.rect(badgeX, badgeY - 4.2, badgeW, badgeH, "FD");
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(220, 242, 228);
  doc.text("Explorador del Cacao", centerCx, badgeY + 1.3, { align: "center" });

  // Sello lateral discreto.
  const sealR = 11;
  const sealY = by1 + 42;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.45);
  doc.setFillColor(255, 252, 246);
  doc.circle(rightCx, sealY, sealR, "FD");
  doc.circle(rightCx, sealY, sealR, "S");
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.22);
  doc.circle(rightCx, sealY, sealR - 2, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.2);
  doc.setTextColor(...GREEN);
  doc.text("RUTA", rightCx, sealY - 2.8, { align: "center" });
  doc.text("CACAO", rightCx, sealY + 1.2, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(4.2);
  doc.setTextColor(...BROWN_MUTED);
  doc.text("EC · PE", rightCx, sealY + 5.2, { align: "center" });
  // Texto descriptivo centrado.
  const yBody = badgeY + 19;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.2);
  doc.setTextColor(...BROWN);
  const bodyLines = doc.splitTextToSize(
    "Por completar la expedición educativa y las tres misiones sobre la historia del cacao y la cultura Mayo-Chinchipe en el sitio Santa Ana-La Florida (Palanda, Ecuador).",
    innerW - 96,
  );
  doc.text(bodyLines, centerCx, yBody, { align: "center" });

  // Pie
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.32);
  doc.line(frameIn + 8, footerY, pageW - frameIn - 8, footerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BROWN_MUTED);
  const fecha = new Date().toLocaleDateString("es-EC", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text("Ruta Orígenes del Cacao", frameIn + 10, footerY + 5.5);
  doc.text(`Expedido el ${fecha}`, pageW - frameIn - 10, footerY + 5.5, { align: "right" });
  doc.setFontSize(7);
  doc.setTextColor(140, 130, 120);
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
