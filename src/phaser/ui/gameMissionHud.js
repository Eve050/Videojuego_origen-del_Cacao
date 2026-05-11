import Phaser from "phaser";
import { LAYOUT } from "../layout.js";

/** Colores alineados a la guía «Información del juego» (oro / crema / fondo oscuro). */
const C = {
  panelBg: 0x0d0d10,
  panelStroke: 0xd4af37,
  heading: "#e8ebe4",
  subtitleHint: "#b8b5aa",
  missionGold: "#d4af37",
  body: "#ffffff",
  dim: 0x050608,
  bulletFill: 0x141210,
  bulletStroke: 0x6a5530,
  btnGoldTop: 0xf0d060,
  btnGoldBot: 0xc9a227,
  btnText: "#140f06",
};

/**
 * Separa párrafos introductorios de líneas con viñeta (•, -, *, ·).
 * @param {string} raw
 * @returns {{ introParagraphs: string[], bullets: string[] }}
 */
function splitMissionBody(raw) {
  const text = String(raw || "")
    .replace(/\r/g, "")
    .trim();
  if (!text) return { introParagraphs: [], bullets: [] };

  const blocks = text
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  const introParagraphs = [];
  const bullets = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const blockBullets = [];
    const blockIntro = [];
    for (const line of lines) {
      const m = /^[•\-\*\u2022·]\s*(.+)$/.exec(line);
      if (m) blockBullets.push(m[1]);
      else blockIntro.push(line);
    }
    if (blockBullets.length > 0) {
      bullets.push(...blockBullets);
      if (blockIntro.length) introParagraphs.push(blockIntro.join(" "));
    } else if (lines.length) {
      introParagraphs.push(lines.join("\n"));
    }
  }

  if (introParagraphs.length === 0 && bullets.length === 0) {
    introParagraphs.push(text);
  }
  return { introParagraphs, bullets };
}

function measureTextBlock(scene, style, content) {
  const t = scene.add.text(-9999, -9999, content, style).setOrigin(0, 0);
  const b = t.getBounds();
  t.destroy();
  return { w: b.width, h: b.height };
}

/**
 * Botón «MISIÓN» en HUD + panel modal estilo «Información del juego».
 *
 * @param {Phaser.Scene} scene
 * @param {{
 *   title: string,
 *   body: string | (() => string),
 *   panelHeading?: string,
 *   introLead?: string,
 *   x: number,
 *   y: number,
 *   originX?: number,
 *   originY?: number,
 *   buttonDepth?: number,
 *   overlayDepth?: number,
 *   panelMaxW?: number,
 *   compactButton?: boolean | 'mini',
 * }} opts — `mini`: botón extra pequeño (p. ej. quiz sin tapar texto).
 */
export function createGameMissionHud(scene, opts) {
  const {
    title,
    body,
    panelHeading = "INFORMACIÓN DEL JUEGO",
    introLead = "Guía rápida para este momento de la expedición:",
    x,
    y,
    originX = 0,
    originY = 0,
    buttonDepth = 121,
    overlayDepth = 190,
    panelMaxW = 508,
    compactButton = false,
  } = opts;

  const mini = compactButton === "mini";
  const compact = compactButton === true || mini;
  const btnW = mini ? 72 : compact ? 88 : 108;
  const btnH = mini ? 22 : compact ? 26 : 30;
  const cxBtn = x + (0.5 - originX) * btnW;
  const cyBtn = y + (0.5 - originY) * btnH;

  const btnBg = scene.add
    .rectangle(cxBtn, cyBtn, btnW, btnH, 0x141c18, 0.94)
    .setStrokeStyle(2, 0xc8921a, 0.95)
    .setScrollFactor(0)
    .setDepth(buttonDepth);

  const btnTxt = scene.add
    .text(cxBtn, cyBtn, "MISIÓN", {
      fontSize: mini ? "9px" : compact ? "10px" : "11px",
      color: "#e8c058",
      fontFamily: "Exo 2, sans-serif",
      fontStyle: "bold",
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(buttonDepth + 1);

  const hit = scene.add
    .zone(cxBtn, cyBtn, btnW + (compact ? (mini ? 6 : 8) : 10), btnH + (compact ? (mini ? 4 : 4) : 6))
    .setScrollFactor(0)
    .setDepth(buttonDepth + 2)
    .setInteractive({ useHandCursor: true });

  /** @type {Phaser.GameObjects.GameObject[]} */
  let overlayParts = [];
  let overlayOpen = false;

  const destroyOverlayParts = () => {
    for (const p of overlayParts) {
      try {
        p.destroy();
      } catch {
        /* ignore */
      }
    }
    overlayParts = [];
    overlayOpen = false;
  };

  const openOverlay = () => {
    destroyOverlayParts();
    overlayOpen = true;

    const resolvedBody = typeof body === "function" ? body.call(scene) : body;
    const { introParagraphs, bullets } = splitMissionBody(resolvedBody);
    const introJoined = introParagraphs.join("\n\n");

    const cx = LAYOUT.WIDTH / 2;
    const cy = LAYOUT.HEIGHT / 2;
    const pw = Math.min(panelMaxW, LAYOUT.WIDTH - 36);
    const PAD = 22;
    const TOP_BAR = 62;
    const GAP = 11;
    const BULLET_GAP = 9;
    const FOOTER = 58;
    const cornerR = 16;
    const wrapInner = pw - PAD * 2;

    const headingStyle = {
      fontSize: "14px",
      color: C.heading,
      fontFamily: "Exo 2, sans-serif",
      fontStyle: "bold",
      wordWrap: { width: wrapInner - 52 },
    };
    const missionTitleStyle = {
      fontSize: "17px",
      color: C.missionGold,
      fontFamily: "Exo 2, sans-serif",
      fontStyle: "bold",
      wordWrap: { width: wrapInner },
      lineSpacing: 5,
    };
    const leadStyle = {
      fontSize: "13px",
      color: C.subtitleHint,
      fontFamily: "Nunito, sans-serif",
      wordWrap: { width: wrapInner },
      lineSpacing: 4,
    };
    const introStyle = {
      fontSize: "16px",
      color: C.body,
      fontFamily: "Nunito, sans-serif",
      fontStyle: "bold",
      wordWrap: { width: wrapInner },
      lineSpacing: 7,
    };
    const bulletStyle = {
      fontSize: "15px",
      color: C.body,
      fontFamily: "Nunito, sans-serif",
      wordWrap: { width: wrapInner - 40 },
      lineSpacing: 6,
    };

    const headingH = measureTextBlock(scene, headingStyle, panelHeading).h;
    const missionTitleH = measureTextBlock(scene, missionTitleStyle, title).h;
    const leadH = measureTextBlock(scene, leadStyle, introLead).h;
    const introH = introJoined.length > 0 ? measureTextBlock(scene, introStyle, introJoined).h : 0;

    let bulletsBlockH = 0;
    const bulletHeights = [];
    for (const b of bullets) {
      const bh = Math.max(46, measureTextBlock(scene, bulletStyle, b).h + 26);
      bulletHeights.push(bh);
      bulletsBlockH += bh + BULLET_GAP;
    }
    if (bullets.length > 0) bulletsBlockH -= BULLET_GAP;

    let contentH =
      TOP_BAR +
      missionTitleH +
      GAP +
      leadH +
      GAP +
      introH +
      (introJoined.length > 0 && bullets.length > 0 ? GAP + 6 : 0) +
      (bullets.length > 0 ? bulletsBlockH + GAP : 0);

    if (!introJoined.length && bullets.length === 0) {
      contentH = TOP_BAR + measureTextBlock(scene, introStyle, resolvedBody || "—").h + GAP;
    }

    const panelH = Math.min(Math.max(220, contentH + FOOTER + PAD), LAYOUT.HEIGHT - 16);
    const px0 = cx - pw / 2;
    const py0 = cy - panelH / 2;

    const closeOverlayNow = () => {
      destroyOverlayParts();
    };

    const dim = scene.add
      .rectangle(LAYOUT.WIDTH / 2, LAYOUT.HEIGHT / 2, LAYOUT.WIDTH, LAYOUT.HEIGHT, C.dim, 0.88)
      .setScrollFactor(0)
      .setDepth(overlayDepth)
      .setInteractive({ useHandCursor: true });
    dim.on("pointerdown", closeOverlayNow);

    const panelGfx = scene.add.graphics().setScrollFactor(0).setDepth(overlayDepth + 1);
    panelGfx.fillStyle(C.panelBg, 1);
    panelGfx.fillRoundedRect(px0, py0, pw, panelH, cornerR);
    panelGfx.lineStyle(2, C.panelStroke, 1);
    panelGfx.strokeRoundedRect(px0, py0, pw, panelH, cornerR);
    panelGfx.setInteractive(
      new Phaser.Geom.Rectangle(px0, py0, pw, panelH),
      Phaser.Geom.Rectangle.Contains,
    );
    panelGfx.on("pointerdown", (pointer, _lx, _ly, event) => {
      if (event && typeof event.stopPropagation === "function") event.stopPropagation();
    });

    const decoLine = scene.add.graphics().setScrollFactor(0).setDepth(overlayDepth + 2);
    const lineY = py0 + PAD + headingH + 6;
    const lineX = px0 + PAD;
    const lineW = pw - PAD * 2 - 48;
    decoLine.fillGradientStyle(0x7ecf9a, 0xd4af37, 0xd4af37, 0x8ab878, 1);
    decoLine.fillRect(lineX, lineY, lineW, 3);

    const closeR = 17;
    const closeCx = px0 + pw - PAD - closeR;
    const closeCy = py0 + PAD + closeR - 4;

    const closeHit = scene.add
      .circle(closeCx, closeCy, closeR + 4, 0xffffff, 0.001)
      .setScrollFactor(0)
      .setDepth(overlayDepth + 8)
      .setInteractive({ useHandCursor: true });
    closeHit.on("pointerdown", (pointer, _lx, _ly, event) => {
      if (event && typeof event.stopPropagation === "function") event.stopPropagation();
      closeOverlayNow();
    });

    const closeRing = scene.add
      .circle(closeCx, closeCy, closeR, C.panelBg, 1)
      .setStrokeStyle(2, C.panelStroke, 1)
      .setScrollFactor(0)
      .setDepth(overlayDepth + 7);

    const closeX = scene.add
      .text(closeCx, closeCy - 1, "×", {
        fontSize: "22px",
        color: C.missionGold,
        fontFamily: "Georgia, serif",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(overlayDepth + 8);

    overlayParts.push(dim, panelGfx, decoLine, closeRing, closeX, closeHit);

    let y = py0 + PAD;
    const hdr = scene.add
      .text(lineX, y, panelHeading, headingStyle)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(overlayDepth + 3);
    overlayParts.push(hdr);
    y = lineY + 14;

    const missionTitle = scene.add
      .text(lineX, y, title, missionTitleStyle)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(overlayDepth + 3);
    overlayParts.push(missionTitle);
    y += missionTitle.height + GAP;

    const lead = scene.add
      .text(lineX, y, introLead, leadStyle)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(overlayDepth + 3);
    overlayParts.push(lead);
    y += lead.height + GAP;

    if (introJoined.length > 0) {
      const introTxt = scene.add
        .text(lineX, y, introJoined, introStyle)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(overlayDepth + 3);
      overlayParts.push(introTxt);
      y += introTxt.height + (bullets.length > 0 ? GAP + 6 : GAP);
    } else if (!bullets.length && resolvedBody) {
      const fallback = scene.add
        .text(lineX, y, resolvedBody, { ...introStyle, fontStyle: "normal" })
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(overlayDepth + 3);
      overlayParts.push(fallback);
      y += fallback.height + GAP;
    }

    const bulletLeft = lineX + 4;
    for (let i = 0; i < bullets.length; i += 1) {
      const bh = bulletHeights[i] ?? 44;
      const rowGfx = scene.add.graphics().setScrollFactor(0).setDepth(overlayDepth + 2);
      rowGfx.fillStyle(C.bulletFill, 0.96);
      rowGfx.lineStyle(1, C.bulletStroke, 0.65);
      rowGfx.fillRoundedRect(bulletLeft - 4, y - 4, wrapInner + 4, bh, 10);
      rowGfx.strokeRoundedRect(bulletLeft - 4, y - 4, wrapInner + 4, bh, 10);
      overlayParts.push(rowGfx);

      const dot = scene.add
        .circle(bulletLeft + 8, y + Math.min(18, bh * 0.32), 5, C.panelStroke, 1)
        .setScrollFactor(0)
        .setDepth(overlayDepth + 4);
      overlayParts.push(dot);

      const btxt = scene.add
        .text(bulletLeft + 24, y + 10, bullets[i], bulletStyle)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(overlayDepth + 4);
      overlayParts.push(btxt);
      y += bh + BULLET_GAP;
    }

    const btnW2 = 160;
    const btnH2 = 40;
    const btnY = py0 + panelH - FOOTER + 8;
    const cerrarBg = scene.add
      .graphics()
      .setScrollFactor(0)
      .setDepth(overlayDepth + 5);
    const bx0 = cx - btnW2 / 2;
    const by0 = btnY - btnH2 / 2;
    cerrarBg.fillGradientStyle(C.btnGoldTop, C.btnGoldTop, C.btnGoldBot, C.btnGoldBot, 1);
    cerrarBg.fillRoundedRect(bx0, by0, btnW2, btnH2, 12);
    cerrarBg.lineStyle(2, 0x8a6a18, 1);
    cerrarBg.strokeRoundedRect(bx0, by0, btnW2, btnH2, 12);
    cerrarBg.setInteractive(
      new Phaser.Geom.Rectangle(bx0, by0, btnW2, btnH2),
      Phaser.Geom.Rectangle.Contains,
    );
    cerrarBg.on("pointerdown", (pointer, _lx, _ly, event) => {
      if (event && typeof event.stopPropagation === "function") event.stopPropagation();
      closeOverlayNow();
    });

    const cerrarLbl = scene.add
      .text(cx, btnY, "CERRAR", {
        fontSize: "14px",
        color: C.btnText,
        fontStyle: "bold",
        fontFamily: "Exo 2, sans-serif",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(overlayDepth + 6);

    overlayParts.push(cerrarBg, cerrarLbl);
  };

  const toggle = () => {
    if (overlayOpen) destroyOverlayParts();
    else openOverlay();
  };

  hit.on("pointerdown", toggle);

  hit.on("pointerover", () => {
    btnBg.setFillStyle(0x1f2e26, 1);
  });
  hit.on("pointerout", () => {
    btnBg.setFillStyle(0x141c18, 0.94);
  });

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, destroyOverlayParts);

  return {
    setButtonVisible(v) {
      const on = Boolean(v);
      btnBg.setVisible(on);
      btnTxt.setVisible(on);
      hit.setVisible(on);
      if (!on) destroyOverlayParts();
    },
    closeOverlay: destroyOverlayParts,
    toggleOverlay: toggle,
  };
}
