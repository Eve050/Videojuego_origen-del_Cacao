import Phaser from "phaser";
import { LAYOUT } from "../layout.js";

/**
 * Misma jerarquía visual que Misión 1 (panel degradado, oro, glow, botones dorados).
 * Colores guía: título #00FF9C, oro #FFD700, texto principal #FFFFFF.
 * Las escenas Phaser pintan en canvas; las clases `.modal-felicidades` viven en `style.css`
 * como referencia si en el futuro se monta el mismo modal en HTML.
 */
export const MISSION_WIN_MODAL_STYLES = {
  titleColor: "#00FF9C",
  titleStroke: "#061210",
  missionColor: "#FFFFFF",
  missionShadow: "#FFD700",
  hintColor: "#e8f4ee",
  statsColor: "#FFFFFF",
  borderGold: 0xffd700,
  accentLine: 0x00ff9c,
  goldGradTop: 0xffe566,
  goldGradBot: 0xd4a800,
  goldHoverTop: 0xfff0a0,
  goldHoverBot: 0xe8c040,
  gradTL: 0x0a0f0a,
  gradTR: 0x111a11,
  gradBL: 0x162016,
  gradBR: 0x111a11,
  dim: 0x0a0f0a,
  btnText: "#1a1a0a",
  statLabelColor: "#FFD700",
};

/**
 * @param {Phaser.Scene} scene
 * @param {{
 *   depth?: number,
 *   titleText?: string,
 *   badgeText?: string | null,
 *   missionLine: string,
 *   hintLine: string,
 *   statsLine?: string | null,
 *   statsRows?: { label: string, value: string }[] | null,
 *   footerLine?: string | null,
 *   buttons: { label: string, onClick: () => void }[],
 *   compact?: boolean,
 *   buttonsExclusive?: boolean,
 * }} options
 * @returns {Phaser.GameObjects.GameObjects[]}
 */
export function showMissionWinModal(scene, options) {
  const {
    depth = 220,
    titleText = "¡FELICIDADES!",
    badgeText = null,
    missionLine,
    hintLine,
    statsLine = null,
    statsRows = null,
    footerLine = null,
    buttons,
    compact = false,
    buttonsExclusive = true,
  } = options;

  if (!buttons?.length) {
    throw new Error("showMissionWinModal: se requiere al menos un botón");
  }

  const ui = [];
  const cx = LAYOUT.WIDTH / 2;
  const cy = LAYOUT.HEIGHT / 2;
  const C = MISSION_WIN_MODAL_STYLES;
  const scaleUi = Math.max(compact ? 0.72 : 0.78, Math.min(1.08, LAYOUT.WIDTH / 1280));
  const fs = (px) => `${Math.round(px * scaleUi)}px`;

  const hintLines = String(hintLine).split("\n").length;
  const btnHPre = Math.round(50 * scaleUi);
  const btnGapPre = Math.round(11 * scaleUi);
  const bottomPadPre = Math.round(30 * scaleUi);
  const totalBtnBlockPre =
    buttons.length * btnHPre + (buttons.length > 0 ? (buttons.length - 1) * btnGapPre : 0) + bottomPadPre;

  const statsExtra =
    statsRows?.length > 0
      ? 20 + statsRows.length * 50 + (statsRows.length > 1 ? (statsRows.length - 1) * 10 : 0)
      : statsLine
        ? 52
        : 0;
  const extraH =
    statsExtra +
    (footerLine ? 52 : 0) +
    (badgeText ? 40 : 0) +
    Math.max(0, hintLines - 1) * 24 +
    totalBtnBlockPre;

  const panelW = Math.min(940, LAYOUT.WIDTH - 48);
  const tallContent = Boolean(statsRows?.length || footerLine || badgeText);
  const maxPanelH = tallContent
    ? Math.max(520, Math.round(LAYOUT.HEIGHT - 28))
    : Math.round(LAYOUT.HEIGHT * 0.74);
  let panelH = Math.min(maxPanelH, Math.max(480, 380 + extraH));
  let px0 = cx - panelW / 2;
  let py0 = cy - panelH / 2;
  const cornerR = 22;

  const drawGoldGlow = (g, pad, alpha, lineW, h = panelH) => {
    g.lineStyle(lineW, C.borderGold, alpha);
    g.strokeRoundedRect(px0 - pad, py0 - pad, panelW + pad * 2, h + pad * 2, cornerR + Math.min(pad, 12));
  };

  const dim = scene.add
    .rectangle(cx, cy, LAYOUT.WIDTH, LAYOUT.HEIGHT, C.dim, 0.92)
    .setScrollFactor(0)
    .setDepth(depth)
    .setInteractive({ useHandCursor: true });
  ui.push(dim);

  const glowOuter = scene.add.graphics().setScrollFactor(0).setDepth(depth + 1);
  const panelFill = scene.add.graphics().setScrollFactor(0).setDepth(depth + 2);
  const decoLines = scene.add.graphics().setScrollFactor(0).setDepth(depth + 3);

  const redrawPanelShell = (h) => {
    glowOuter.clear();
    glowOuter.lineStyle(18, C.borderGold, 0.16);
    glowOuter.strokeRoundedRect(px0 - 4, py0 - 4, panelW + 8, h + 8, cornerR + 4);
    drawGoldGlow(glowOuter, 10, 0.22, 3, h);
    drawGoldGlow(glowOuter, 4, 0.42, 2, h);

    panelFill.clear();
    panelFill.fillGradientStyle(C.gradTL, C.gradTR, C.gradBL, C.gradBR, 1);
    panelFill.fillRoundedRect(px0, py0, panelW, h, cornerR);
    panelFill.lineStyle(4, C.borderGold, 1);
    panelFill.strokeRoundedRect(px0, py0, panelW, h, cornerR);
    panelFill.lineStyle(1, C.accentLine, 0.28);
    panelFill.strokeRoundedRect(px0 + 3, py0 + 3, panelW - 6, h - 6, cornerR - 2);
    panelFill.lineStyle(2, C.borderGold, 0.45);
    panelFill.strokeRoundedRect(px0 + 12, py0 + 12, panelW - 24, h - 24, cornerR - 8);

    const inset = 48;
    const decoBottomReserve =
      buttons.length > 0
        ? Math.round(
            buttons.length * 50 * scaleUi +
              Math.max(0, buttons.length - 1) * 11 * scaleUi +
              52 * scaleUi,
          )
        : 86;
    const yDecoBot = py0 + h - Math.max(118, Math.min(h - 72, decoBottomReserve + 24));
    decoLines.clear();
    decoLines.lineStyle(2, C.borderGold, 0.55);
    decoLines.lineBetween(px0 + inset, py0 + 58, px0 + panelW - inset, py0 + 58);
    decoLines.lineBetween(px0 + inset, yDecoBot, px0 + panelW - inset, yDecoBot);
    decoLines.lineStyle(1, C.borderGold, 0.3);
    decoLines.lineBetween(px0 + inset + 20, py0 + 62, px0 + panelW - inset - 20, py0 + 62);
  };

  redrawPanelShell(panelH);
  ui.push(glowOuter, panelFill, decoLines);

  for (let i = 0; i < 10; i += 1) {
    const sx = Phaser.Math.FloatBetween(px0 + 24, px0 + panelW - 24);
    const sy = Phaser.Math.FloatBetween(py0 + 70, Math.max(py0 + 120, py0 + panelH - 100));
    const dot = scene.add
      .circle(sx, sy, Phaser.Math.Between(1, 2), C.borderGold, 0.35)
      .setScrollFactor(0)
      .setDepth(depth + 3);
    ui.push(dot);
    scene.tweens.add({
      targets: dot,
      alpha: { from: 0.2, to: 0.75 },
      duration: Phaser.Math.Between(900, 1800),
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      delay: Phaser.Math.Between(0, 600),
    });
  }

  const fadeTargets = [];

  let titleY = py0 + Math.round(96 * scaleUi);
  if (badgeText) {
    const badge = scene.add
      .text(cx, py0 + Math.round(50 * scaleUi), badgeText, {
        fontSize: compact ? "8px" : "11px",
        fontFamily: '"Press Start 2P", monospace',
        color: C.titleColor,
        align: "center",
        fontStyle: "bold",
        wordWrap: { width: panelW - 32 },
        lineSpacing: Math.round(4 * scaleUi),
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth + 5)
      .setAlpha(0);
    ui.push(badge);
    fadeTargets.push(badge);
    titleY = py0 + Math.round(124 * scaleUi);
  }

  const titleFontPx = titleText.length > 12 ? 64 : 84;
  const title = scene.add
    .text(cx, titleY, titleText, {
      fontSize: fs(titleFontPx),
      fontFamily: '"Exo 2", "Segoe UI", sans-serif',
      color: C.titleColor,
      fontStyle: "bold",
      align: "center",
      stroke: C.titleStroke,
      strokeThickness: Math.max(5, Math.round(8 * scaleUi)),
      shadowColor: C.titleColor,
      shadowBlur: Math.round(22 * scaleUi),
      shadowOffsetX: 0,
      shadowOffsetY: 0,
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(depth + 5)
    .setAlpha(0)
    .setScale(0.94);
  ui.push(title);

  const subY = titleY + Math.round(102 * scaleUi);
  const subMain = scene.add
    .text(cx, subY, missionLine, {
      fontSize: fs(44),
      fontFamily: '"Exo 2", "Segoe UI", sans-serif',
      color: C.missionColor,
      fontStyle: "bold",
      align: "center",
      stroke: "#0a0f0a",
      strokeThickness: Math.max(3, Math.round(4 * scaleUi)),
      shadowColor: C.missionShadow,
      shadowBlur: Math.round(14 * scaleUi),
      shadowOffsetX: 0,
      shadowOffsetY: 1,
      wordWrap: { width: panelW - 72 },
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(depth + 5)
    .setAlpha(0);
  ui.push(subMain);

  const hintY = subY + Math.round(62 * scaleUi) + Math.round((hintLines - 1) * 18 * scaleUi);
  const subHint = scene.add
    .text(cx, hintY, hintLine, {
      fontSize: fs(24),
      fontFamily: '"Nunito", "Segoe UI", sans-serif',
      color: C.hintColor,
      align: "center",
      lineSpacing: Math.round(6 * scaleUi),
      shadowColor: "#000000",
      shadowBlur: 4,
      shadowOffsetX: 0,
      shadowOffsetY: 1,
      wordWrap: { width: panelW - 80 },
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(depth + 5)
    .setAlpha(0);
  ui.push(subHint);

  let statsObj = null;
  let statsCursorY = hintY + Math.round(48 * scaleUi);
  let statsBlockBottom = subHint.getBounds().bottom;

  if (statsRows?.length) {
    statsCursorY += Math.round(10 * scaleUi);
    const gap = Math.round(12 * scaleUi);
    const rowTexts = [];
    let maxLabelW = 0;
    let maxValW = 0;
    for (let ri = 0; ri < statsRows.length; ri += 1) {
      const { label, value } = statsRows[ri];
      const lab = `${label}:`;
      const tLab = scene.add
        .text(0, 0, lab, {
          fontSize: fs(19),
          fontFamily: '"Nunito", "Segoe UI", sans-serif',
          color: C.statLabelColor,
          fontStyle: "bold",
        })
        .setOrigin(1, 0.5)
        .setScrollFactor(0)
        .setDepth(depth + 5)
        .setAlpha(0);
      const tVal = scene.add
        .text(0, 0, value, {
          fontSize: fs(22),
          fontFamily: '"Nunito", "Segoe UI", sans-serif',
          color: C.statsColor,
          fontStyle: "bold",
        })
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(depth + 5)
        .setAlpha(0);
      maxLabelW = Math.max(maxLabelW, tLab.width);
      maxValW = Math.max(maxValW, tVal.width);
      rowTexts.push({ tLab, tVal, y: statsCursorY });
      statsCursorY += Math.round(46 * scaleUi);
    }
    const blockW = maxLabelW + gap + maxValW;
    const blockLeft = cx - blockW / 2;
    const labelRightX = blockLeft + maxLabelW;
    const valueLeftX = labelRightX + gap;
    for (const { tLab, tVal, y } of rowTexts) {
      tLab.setPosition(labelRightX, y);
      tVal.setPosition(valueLeftX, y);
      ui.push(tLab, tVal);
      fadeTargets.push(tLab, tVal);
      statsBlockBottom = Math.max(
        statsBlockBottom,
        tLab.getBounds().bottom,
        tVal.getBounds().bottom,
      );
    }
  } else if (statsLine) {
    statsObj = scene.add
      .text(cx, statsCursorY + Math.round(8 * scaleUi), statsLine, {
        fontSize: fs(20),
        fontFamily: '"Nunito", "Segoe UI", sans-serif',
        color: C.statsColor,
        align: "center",
        wordWrap: { width: panelW - 48 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth + 5)
      .setAlpha(0);
    ui.push(statsObj);
  }

  let footerObj = null;
  if (footerLine) {
    const fy = statsRows?.length ? statsCursorY + Math.round(12 * scaleUi) : statsObj ? statsObj.y + Math.round(44 * scaleUi) : statsCursorY + Math.round(36 * scaleUi);
    footerObj = scene.add
      .text(cx, fy, footerLine, {
        fontSize: fs(20),
        fontFamily: '"Nunito", "Segoe UI", sans-serif',
        color: C.hintColor,
        align: "center",
        fontStyle: "italic",
        wordWrap: { width: panelW - 64 },
        lineSpacing: Math.round(5 * scaleUi),
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth + 5)
      .setAlpha(0);
    ui.push(footerObj);
  }

  let contentBottom = subHint.getBounds().bottom;
  if (statsRows?.length) {
    contentBottom = Math.max(contentBottom, statsBlockBottom);
  } else if (statsObj) {
    contentBottom = Math.max(contentBottom, statsObj.getBounds().bottom);
  }
  if (footerObj) {
    contentBottom = Math.max(contentBottom, footerObj.getBounds().bottom);
  }

  const btnW = Math.round(Math.min(400, panelW - 140) * scaleUi);
  const btnH = Math.round(50 * scaleUi);
  const btnR = 14;
  const btnGap = Math.round(11 * scaleUi);
  const bottomPad = Math.round(30 * scaleUi);
  const totalBtnBlock = buttons.length * btnH + (buttons.length - 1) * btnGap;
  const gapAboveButtons = Math.round(18 * scaleUi);
  const btnLift = Math.round(14 * scaleUi);
  const anchoredBtnTop = py0 + panelH - bottomPad - totalBtnBlock;
  let firstBtnTopEdge = Math.max(anchoredBtnTop - btnLift, contentBottom + gapAboveButtons);
  const requiredPanelBottom = firstBtnTopEdge + totalBtnBlock + bottomPad;
  if (requiredPanelBottom > py0 + panelH) {
    panelH = Math.min(maxPanelH, requiredPanelBottom - py0);
    redrawPanelShell(panelH);
  }

  let btnYRun = firstBtnTopEdge;

  fadeTargets.push(subMain, subHint);
  if (statsObj) fadeTargets.push(statsObj);
  if (footerObj) fadeTargets.push(footerObj);

  let blocked = false;
  const wrapExclusive = (fn) => () => {
    if (blocked) return;
    blocked = true;
    fn();
  };

  for (let i = 0; i < buttons.length; i += 1) {
    const btnY = btnYRun + btnH / 2;
    const btnX = cx - btnW / 2;
    const { label, onClick } = buttons[i];

    const mapBtn = scene.add.graphics().setScrollFactor(0).setDepth(depth + 4);
    const drawRoundedBtn = (topCol, botCol, lineCol, lineW) => {
      mapBtn.clear();
      mapBtn.fillGradientStyle(topCol, topCol, botCol, botCol, 1);
      mapBtn.fillRoundedRect(btnX, btnY - btnH / 2, btnW, btnH, btnR);
      mapBtn.lineStyle(lineW, lineCol, 1);
      mapBtn.strokeRoundedRect(btnX, btnY - btnH / 2, btnW, btnH, btnR);
    };
    drawRoundedBtn(C.goldGradTop, C.goldGradBot, C.borderGold, 3);
    mapBtn.setInteractive(
      new Phaser.Geom.Rectangle(btnX, btnY - btnH / 2, btnW, btnH),
      Phaser.Geom.Rectangle.Contains,
    );
    if (mapBtn.input) {
      mapBtn.input.cursor = "pointer";
    }
    ui.push(mapBtn);

    const mapTxt = scene.add
      .text(cx, btnY, label, {
        fontSize: fs(18),
        fontFamily: '"Exo 2", "Segoe UI", sans-serif',
        color: C.btnText,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth + 6)
      .setAlpha(0);
    ui.push(mapTxt);
    fadeTargets.push(mapTxt);

    mapBtn.on("pointerover", () => {
      drawRoundedBtn(C.goldHoverTop, C.goldHoverBot, C.borderGold, 3);
      scene.tweens.add({
        targets: mapTxt,
        scale: 1.05,
        duration: 160,
        ease: "Back.eOut",
      });
    });
    mapBtn.on("pointerout", () => {
      drawRoundedBtn(C.goldGradTop, C.goldGradBot, C.borderGold, 3);
      scene.tweens.add({
        targets: mapTxt,
        scale: 1,
        duration: 140,
        ease: "Quad.eOut",
      });
    });
    const fire = buttonsExclusive ? wrapExclusive(onClick) : onClick;
    mapBtn.on("pointerdown", fire);

    btnYRun += btnH + btnGap;
  }

  scene.tweens.add({
    targets: title,
    alpha: 1,
    scale: 1,
    duration: 420,
    ease: "Cubic.eOut",
  });
  scene.tweens.add({
    targets: title,
    scaleX: 1.035,
    scaleY: 1.035,
    duration: 1400,
    ease: "Sine.inOut",
    yoyo: true,
    repeat: -1,
    delay: 450,
  });
  scene.tweens.add({
    targets: fadeTargets,
    alpha: 1,
    duration: 380,
    delay: 180,
    ease: "Quad.eOut",
  });

  dim.on("pointerdown", () => {});

  return ui;
}
