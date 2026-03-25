import { jsPDF } from "jspdf";

const GREEN = [29, 107, 58];
const GREEN_DARK = [18, 68, 42];
const GOLD = [200, 146, 26];
const GOLD_SOFT = [235, 215, 160];
const CREAM = [252, 249, 242];
const CREAM_EDGE = [245, 238, 225];
const BROWN = [26, 13, 5];
const BROWN_MUTED = [90, 78, 68];

/**
 * Genera y descarga el certificado en PDF (A4 horizontal, solo cliente).
 * @param {{ playerName: string; fileBase?: string }} opts
 */
export function downloadCertificatePdf(opts) {
  const playerName = (opts.playerName || "Explorador").trim() || "Explorador";
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

  const bx1 = frameIn + 5;
  const bx2 = pageW - frameIn - 5;
  const by1 = bodyTop + 4;
  const by2 = bodyBottom - 6;

  doc.setDrawColor(...GOLD_SOFT);
  doc.setLineWidth(0.2);
  doc.rect(bx1 + 3, by1 + 2, bx2 - bx1 - 6, by2 - by1 - 4, "S");

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

  // Dos columnas: izquierda (nombre, distintivo) · derecha (sello + texto)
  const innerL = bx1 + 8;
  const innerR = bx2 - 8;
  const innerW = innerR - innerL;
  const colGap = innerL + innerW * 0.56;
  const leftCx = (innerL + colGap) / 2;
  const rightColW = innerR - colGap - 6;
  const rightCx = colGap + 6 + rightColW / 2;

  let y = by1 + 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...BROWN);
  const certLabel = "CERTIFICADO DIGITAL";
  const labelW = doc.getTextWidth(certLabel);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.3);
  doc.line(innerL + 6, y - 1.2, leftCx - labelW / 2 - 3, y - 1.2);
  doc.line(leftCx + labelW / 2 + 3, y - 1.2, colGap - 8, y - 1.2);
  doc.text(certLabel, leftCx, y, { align: "center" });

  y += 11;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...BROWN_MUTED);
  doc.text("Se reconoce como", leftCx, y, { align: "center" });

  y += 9;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.22);
  doc.line(leftCx - 38, y - 2.5, leftCx + 38, y - 2.5);

  y += 1;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...GOLD);
  const nameMaxW = colGap - innerL - 14;
  const nameLines = doc.splitTextToSize(playerName, nameMaxW);
  doc.text(nameLines, leftCx, y, { align: "center" });
  y += nameLines.length * 7 + 2;

  doc.line(leftCx - 38, y, leftCx + 38, y);

  y += 9;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...BROWN_MUTED);
  doc.text("con el título honorífico de", leftCx, y, { align: "center" });

  y += 8;
  const badgeW = 76;
  const badgeH = 8;
  const badgeX = leftCx - badgeW / 2;
  doc.setFillColor(...GREEN_DARK);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.18);
  if (typeof doc.roundedRect === "function") {
    doc.roundedRect(badgeX, y - 4.5, badgeW, badgeH, 1.8, 1.8, "FD");
  } else {
    doc.rect(badgeX, y - 4.5, badgeW, badgeH, "FD");
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(210, 245, 220);
  doc.text("Explorador del Cacao", leftCx, y + 0.8, { align: "center" });

  // Columna derecha: sello + párrafo
  const sealR = 14;
  const sealY = by1 + 28;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.45);
  doc.setFillColor(255, 252, 246);
  doc.circle(rightCx, sealY, sealR, "FD");
  doc.circle(rightCx, sealY, sealR, "S");
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.22);
  doc.circle(rightCx, sealY, sealR - 2, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...GREEN);
  doc.text("RUTA", rightCx, sealY - 2.8, { align: "center" });
  doc.text("CACAO", rightCx, sealY + 1.2, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(4.8);
  doc.setTextColor(...BROWN_MUTED);
  doc.text("EC · PE", rightCx, sealY + 5.2, { align: "center" });

  let yRight = sealY + sealR + 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...BROWN);
  const bodyLines = doc.splitTextToSize(
    "Por completar la expedición educativa y las tres misiones sobre la historia del cacao y la cultura Mayo-Chinchipe en el sitio Santa Ana-La Florida (Palanda, Ecuador).",
    rightColW - 4,
  );
  doc.text(bodyLines, rightCx, yRight, { align: "center" });

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
