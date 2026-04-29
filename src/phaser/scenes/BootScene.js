import Phaser from "phaser";
import questions from "../data/questions.json";
import culturalData from "../data/culturalData.json";
import zonesConfig from "../data/zonesConfig.json";
import { takePendingExpeditionMission, takePendingDirectRunner, takePendingExternalTouchpad } from "../missionContext.js";
import { PHASE_SFX_FILES } from "../../modules/sfxVolumes.js";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    this.load.image("bg_selva_run", "/assets/images/fondo-selva-noche.webp");
    Object.entries(PHASE_SFX_FILES).forEach(([key, url]) => {
      this.load.audio(key, url);
    });
  }

  create() {
    this.registry.set("questions", questions);
    this.registry.set("culturalData", culturalData);
    this.registry.set("zonesConfig", zonesConfig);

    this.generatePlaceholderTextures();

    const expeditionMission = takePendingExpeditionMission();
    const directRunner = takePendingDirectRunner();
    const externalTouchpad = takePendingExternalTouchpad();
    this.registry.set("expeditionMission", expeditionMission);
    this.registry.set("externalTouchpad", externalTouchpad === true);

    if (directRunner && (expeditionMission === 2 || expeditionMission == null)) {
      this.scene.start("Game2Scene");
      return;
    }

    if (expeditionMission === 1) {
      this.scene.start("Game1Scene");
      return;
    }
    if (expeditionMission === 2) {
      this.scene.start("Game2Scene");
      return;
    }
    if (expeditionMission === 3) {
      this.registry.set("mazeLevel", 1);
      this.scene.start("Game3Scene");
      return;
    }

    this.registry.set("expeditionMission", null);
    this.scene.start("MenuScene");
  }

  generatePlaceholderTextures() {
    const mk = (key, w, h, color) => {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(color, 1);
      g.fillRect(0, 0, w, h);
      g.generateTexture(key, w, h);
      g.destroy();
    };

    const floorG = this.make.graphics({ x: 0, y: 0, add: false });
    for (let y = 0; y < 32; y += 2) {
      for (let x = 0; x < 32; x += 2) {
        floorG.fillStyle(((x + y) >> 2) % 2 === 0 ? 0x2a4838 : 0x223a30, 1);
        floorG.fillRect(x, y, 2, 2);
      }
    }
    floorG.generateTexture("ph_floor", 32, 32);
    floorG.destroy();

    const pl = this.make.graphics({ x: 0, y: 0, add: false });
    pl.fillStyle(0x0a1410, 0.45);
    pl.fillEllipse(22, 41, 26, 9);
    pl.fillStyle(0x1a120c, 1);
    pl.fillRoundedRect(13, 41, 7, 5, 2);
    pl.fillRoundedRect(24, 41, 7, 5, 2);
    pl.fillStyle(0x302018, 1);
    pl.fillRoundedRect(13, 34, 7, 11, 3);
    pl.fillRoundedRect(24, 34, 7, 11, 3);
    pl.fillStyle(0x221810, 1);
    pl.fillRect(10, 32, 24, 3);
    pl.fillStyle(0x7a5818, 1);
    pl.fillRoundedRect(19, 32, 6, 3, 1);
    pl.fillStyle(0x382418, 1);
    pl.fillRoundedRect(8, 22, 5, 13, 3);
    pl.fillRoundedRect(31, 22, 5, 13, 3);
    pl.fillStyle(0x3a2820, 1);
    pl.fillRoundedRect(11, 20, 22, 20, 7);
    pl.fillStyle(0x4d3628, 1);
    pl.fillRoundedRect(13, 22, 18, 14, 5);
    pl.fillStyle(0x281810, 1);
    pl.fillRect(13, 36, 5, 2);
    pl.fillRect(26, 36, 5, 2);
    pl.fillStyle(0xb8a898, 1);
    pl.fillRoundedRect(18, 23, 8, 9, 2);
    pl.fillStyle(0x142820, 1);
    pl.fillTriangle(18, 22, 26, 22, 22, 25);
    pl.fillStyle(0x7a5818, 1);
    pl.fillCircle(17, 27, 1.5);
    pl.fillCircle(27, 27, 1.5);
    pl.lineStyle(2, 0x241810, 0.72);
    pl.beginPath();
    pl.moveTo(11, 24);
    pl.lineTo(33, 32);
    pl.strokePath();
    pl.lineStyle(2, 0x241810, 0.72);
    pl.beginPath();
    pl.moveTo(33, 24);
    pl.lineTo(11, 32);
    pl.strokePath();
    pl.fillStyle(0x8a7058, 0.55);
    pl.fillEllipse(22, 15, 32, 9);
    pl.fillStyle(0xd0c098, 1);
    pl.fillEllipse(22, 13, 32, 8);
    pl.fillStyle(0xdeb896, 1);
    pl.fillCircle(22, 17, 7);
    pl.fillStyle(0xf0e4d0, 1);
    pl.fillEllipse(22, 7, 18, 12);
    pl.lineStyle(1, 0xa89070, 0.9);
    pl.strokeEllipse(22, 7, 18, 12);
    pl.fillStyle(0x3a3028, 1);
    pl.fillRoundedRect(14, 9, 16, 4, 2);
    pl.lineStyle(1, 0x1a1810, 0.55);
    pl.beginPath();
    pl.moveTo(14, 12);
    pl.lineTo(16, 20);
    pl.strokePath();
    pl.beginPath();
    pl.moveTo(30, 12);
    pl.lineTo(28, 20);
    pl.strokePath();
    pl.fillStyle(0x1a1010, 1);
    pl.fillCircle(19, 17, 1.6);
    pl.fillCircle(25, 17, 1.6);
    pl.lineStyle(1.5, 0x281c18, 0.92);
    pl.strokeRoundedRect(11, 20, 22, 20, 7);
    pl.generateTexture("ph_player", 44, 48);
    pl.destroy();

    /** Silueta tejada para parallax cercano (runner / Feronato-style capas). */
    const ridge = this.make.graphics({ x: 0, y: 0, add: false });
    ridge.fillStyle(0x040302, 1);
    ridge.beginPath();
    ridge.moveTo(0, 128);
    ridge.lineTo(0, 70);
    ridge.lineTo(44, 32);
    ridge.lineTo(92, 58);
    ridge.lineTo(148, 14);
    ridge.lineTo(210, 52);
    ridge.lineTo(268, 22);
    ridge.lineTo(332, 60);
    ridge.lineTo(400, 28);
    ridge.lineTo(472, 72);
    ridge.lineTo(512, 40);
    ridge.lineTo(512, 128);
    ridge.closePath();
    ridge.fillPath();
    ridge.generateTexture("ph_parallax_ridge", 512, 128);
    ridge.destroy();

    mk("ph_collect", 28, 28, 0xc8921a);
    mk("ph_guardian", 28, 28, 0x8b2942);
    mk("ph_wall", 32, 32, 0x4a3728);
    mk("ph_wall_maze", 32, 32, 0x5a2a8a);


    const rock = this.make.graphics({ x: 0, y: 0, add: false });
    rock.fillStyle(0x6b4a36, 1);
    rock.fillRoundedRect(4, 8, 52, 30, 8);
    rock.fillStyle(0x8b6848, 1);
    rock.fillEllipse(30, 20, 38, 22);
    rock.lineStyle(3, 0xd4a88a, 0.95);
    rock.strokeRoundedRect(4, 8, 52, 30, 8);
    rock.generateTexture("ph_obstacle", 60, 44);
    rock.destroy();

    const pod = this.make.graphics({ x: 0, y: 0, add: false });
    pod.fillStyle(0x5c3d28, 1);
    pod.fillEllipse(16, 18, 14, 22);
    pod.fillStyle(0xc9a04a, 0.9);
    pod.fillEllipse(16, 17, 8, 14);
    pod.lineStyle(2, 0xfff2c8, 0.9);
    pod.strokeEllipse(16, 18, 14, 22);
    pod.generateTexture("ph_pod", 32, 36);
    pod.destroy();

    const pg = this.make.graphics({ x: 0, y: 0, add: false });
    pg.fillStyle(0xffe566, 1);
    pg.fillEllipse(18, 20, 16, 24);
    pg.fillStyle(0xfff8cc, 0.95);
    pg.fillEllipse(18, 19, 9, 16);
    pg.lineStyle(2, 0xffa020, 1);
    pg.strokeEllipse(18, 20, 16, 24);
    pg.fillStyle(0xffffff, 0.8);
    pg.fillCircle(22, 14, 3);
    pg.generateTexture("ph_pod_gold", 36, 40);
    pg.destroy();

    mk("ph_pellet", 10, 10, 0xff9933);
    mk("ph_piece", 22, 22, 0x4a90c8);

    const ex = this.make.graphics({ x: 0, y: 0, add: false });
    ex.fillStyle(0xf5c542, 1);
    ex.fillCircle(16, 16, 15);
    ex.fillStyle(0xffe9a0, 0.85);
    ex.fillCircle(13, 13, 5);
    ex.lineStyle(2, 0xc99820, 0.9);
    ex.strokeCircle(16, 16, 15);
    ex.generateTexture("ph_explorer", 32, 32);

    const pot = this.make.graphics({ x: 0, y: 0, add: false });
    pot.fillStyle(0x050808, 0.35);
    pot.fillEllipse(26, 46, 22, 8);
    pot.fillStyle(0x8b5a3a, 1);
    pot.fillEllipse(24, 34, 28, 22);
    pot.fillStyle(0xa87850, 1);
    pot.fillEllipse(24, 30, 20, 16);
    pot.fillStyle(0x6a4030, 1);
    pot.fillEllipse(24, 26, 14, 8);
    pot.fillStyle(0xc9a888, 1);
    pot.fillEllipse(12, 22, 8, 12);
    pot.lineStyle(2, 0x3a2018, 0.9);
    pot.strokeEllipse(24, 34, 28, 22);
    pot.lineStyle(2, 0xe8d0b0, 0.5);
    pot.strokeEllipse(12, 22, 8, 12);
    pot.generateTexture("ph_vessel", 48, 48);
    pot.destroy();

    const potG = this.make.graphics({ x: 0, y: 0, add: false });
    potG.fillStyle(0x050808, 0.35);
    potG.fillEllipse(26, 46, 22, 8);
    potG.fillStyle(0xc9a020, 1);
    potG.fillEllipse(24, 34, 28, 22);
    potG.fillStyle(0xffe066, 1);
    potG.fillEllipse(24, 30, 20, 16);
    potG.fillStyle(0x8a6820, 1);
    potG.fillEllipse(24, 26, 14, 8);
    potG.fillStyle(0xfff8cc, 1);
    potG.fillEllipse(12, 22, 8, 12);
    potG.lineStyle(2, 0x8a6020, 0.95);
    potG.strokeEllipse(24, 34, 28, 22);
    potG.lineStyle(2, 0xfff8cc, 0.65);
    potG.strokeEllipse(12, 22, 8, 12);
    potG.fillStyle(0xffffff, 0.85);
    potG.fillCircle(28, 16, 3);
    potG.generateTexture("ph_vessel_gold", 48, 48);
    potG.destroy();

    const pr = this.make.graphics({ x: 0, y: 0, add: false });
    pr.lineStyle(2, 0xffe8a0, 0.95);
    pr.strokeCircle(16, 16, 14);
    pr.lineStyle(2, 0xffa040, 0.75);
    pr.strokeCircle(16, 16, 9);
    pr.lineStyle(2, 0xffffff, 0.55);
    pr.strokeCircle(16, 16, 4);
    pr.fillStyle(0xffcc55, 0.2);
    pr.fillCircle(16, 16, 6);
    pr.generateTexture("ph_power_orb", 32, 32);

    const ghostG = this.make.graphics({ x: 0, y: 0, add: false });
    ghostG.fillStyle(0xffffff, 1);
    ghostG.fillRoundedRect(2, 8, 24, 20, 6);
    ghostG.fillCircle(14, 10, 11);
    ghostG.generateTexture("ph_ghost_pac", 28, 30);
    ghostG.destroy();

    /** Juego 3 — guardianes espirituales (siluetas con forma propia; nombres Kichwa / andinos). */
    const GW = 32;
    const GH = 36;
    const mkMzGuard = (key, bodyFill, eyeGlow, drawAccent) => {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(bodyFill, 0.96);
      g.fillCircle(GW / 2, 13, 12);
      g.fillRoundedRect(4, 12, GW - 8, 22, 7);
      g.fillStyle(0x120818, 0.75);
      g.fillCircle(GW / 2 - 5, 11, 2.5);
      g.fillCircle(GW / 2 + 5, 11, 2.5);
      g.fillStyle(eyeGlow, 0.95);
      g.fillCircle(GW / 2 - 5, 11, 1.25);
      g.fillCircle(GW / 2 + 5, 11, 1.25);
      drawAccent(g);
      g.lineStyle(2, 0x1a0810, 0.55);
      g.strokeRoundedRect(4, 12, GW - 8, 22, 7);
      g.lineStyle(1.2, 0xffffff, 0.22);
      g.strokeCircle(GW / 2, 13, 12);
      g.generateTexture(key, GW, GH);
      g.destroy();
    };
    mkMzGuard("ph_maze_g_kunku", 0xb83830, 0xffe8a0, (g) => {
      g.fillStyle(0xff5520, 0.95);
      g.fillTriangle(16, 2, 9, 11, 23, 11);
      g.fillTriangle(10, 5, 5, 12, 12, 10);
      g.fillTriangle(22, 5, 27, 12, 20, 10);
    });
    mkMzGuard("ph_maze_g_sumak", 0x2a68c0, 0xc8f0ff, (g) => {
      g.lineStyle(2, 0x88d0ff, 0.75);
      g.beginPath();
      g.moveTo(4, 8);
      g.lineTo(10, 5);
      g.lineTo(16, 8);
      g.lineTo(22, 5);
      g.lineTo(28, 8);
      g.strokePath();
      g.fillStyle(0x4088e0, 0.35);
      g.fillEllipse(16, 7, 20, 6);
    });
    mkMzGuard("ph_maze_g_allpa", 0x2a8848, 0xd8ffd8, (g) => {
      g.fillStyle(0x4a5030, 0.9);
      g.fillTriangle(16, 3, 8, 12, 24, 12);
      g.fillStyle(0x5ec878, 0.85);
      g.fillEllipse(16, 5, 8, 4);
    });
    mkMzGuard("ph_maze_g_wasi", 0xa87820, 0xfff8c8, (g) => {
      g.fillStyle(0xe8c060, 0.95);
      g.fillTriangle(16, 2, 7, 12, 25, 12);
      g.fillRect(6, 10, 20, 3);
      g.lineStyle(1.5, 0xfff0c8, 0.65);
      g.strokeTriangle(16, 2, 7, 12, 25, 12);
    });

    const dg = this.make.graphics({ x: 0, y: 0, add: false });
    dg.fillStyle(0x7744aa, 1);
    dg.fillTriangle(14, 3, 25, 14, 14, 25);
    dg.fillTriangle(14, 3, 3, 14, 14, 25);
    dg.lineStyle(2, 0xcc99ff, 1);
    dg.strokeTriangle(14, 3, 25, 14, 14, 25);
    dg.strokeTriangle(14, 3, 3, 14, 14, 25);
    dg.generateTexture("ph_diamond_piece", 28, 28);

    const run = this.make.graphics({ x: 0, y: 0, add: false });
    run.fillStyle(0xf2c8a0, 1);
    run.fillCircle(22, 14, 9);
    run.fillStyle(0x3a6ea8, 1);
    run.fillRoundedRect(14, 22, 18, 22, 4);
    run.fillStyle(0x2a4a78, 1);
    run.fillRoundedRect(10, 38, 8, 14, 3);
    run.fillRoundedRect(28, 36, 8, 14, 3);
    run.lineStyle(2, 0x1a1a28, 0.7);
    run.strokeCircle(22, 14, 9);
    run.generateTexture("ph_runner", 44, 54);
    run.destroy();

    /** Juego 1 — vasija cerámica botella de asa de estribo (solo alfarería, sin rostro) */
    const gb = this.make.graphics({ x: 0, y: 0, add: false });
    const BX = 34;
    const BW = 68;
    const BH = 78;
    gb.fillStyle(0x141008, 0.3);
    gb.fillEllipse(BX, 72, 32, 9);
    gb.fillStyle(0x7a5030, 1);
    gb.fillEllipse(BX, 69, 20, 6);
    gb.lineStyle(1, 0x483018, 0.65);
    gb.strokeEllipse(BX, 69, 20, 6);
    gb.fillStyle(0xb06820, 1);
    gb.fillEllipse(BX, 52, 38, 32);
    gb.fillStyle(0xdc9830, 1);
    gb.fillEllipse(BX, 50, 30, 24);
    gb.fillStyle(0xf0c058, 1);
    gb.fillEllipse(BX, 48, 22, 16);
    gb.lineStyle(1.1, 0x804018, 0.55);
    gb.strokeEllipse(BX, 52, 38, 32);
    gb.lineStyle(1, 0x906038, 0.45);
    gb.beginPath();
    gb.arc(BX, 48, 22, 0.2 * Math.PI, 0.8 * Math.PI, false);
    gb.strokePath();
    gb.beginPath();
    gb.arc(BX, 54, 24, 0.18 * Math.PI, 0.82 * Math.PI, false);
    gb.strokePath();
    gb.beginPath();
    gb.arc(BX, 58, 26, 0.16 * Math.PI, 0.84 * Math.PI, false);
    gb.strokePath();
    gb.fillStyle(0xc08028, 1);
    gb.fillEllipse(BX, 32, 22, 12);
    gb.fillStyle(0xe0a848, 1);
    gb.fillEllipse(BX, 30, 16, 9);
    gb.lineStyle(1, 0x604018, 0.55);
    gb.strokeEllipse(BX, 32, 22, 12);
    gb.fillStyle(0xd49838, 1);
    gb.fillRoundedRect(BX - 5.5, 24, 4, 10, 2);
    gb.fillRoundedRect(BX + 1.5, 24, 4, 10, 2);
    gb.lineStyle(2.2, 0x4a2810, 1);
    gb.strokeEllipse(BX, 15, 19, 16);
    gb.lineStyle(1.2, 0xe0c070, 0.85);
    gb.strokeEllipse(BX, 15, 16, 13);
    gb.fillStyle(0xc8a878, 1);
    gb.fillEllipse(BX, 15.5, 9, 6.5);
    gb.fillStyle(0xe8b850, 1);
    gb.fillEllipse(BX, 5.5, 11, 7);
    gb.fillStyle(0x1a1410, 0.82);
    gb.fillEllipse(BX, 6.2, 5.5, 2);
    gb.lineStyle(1, 0x5a3018, 1);
    gb.strokeEllipse(BX, 5.5, 11, 7);
    gb.generateTexture("ph_g1_bottle", BW, BH);
    gb.destroy();

    /** Collar con cordón y cuentas de turquesa (vista frontal, pieza central) */
    const neck = this.make.graphics({ x: 0, y: 0, add: false });
    const NW = 92;
    const NH = 58;
    const qbx = (t, xa, xb, xc) => (1 - t) * (1 - t) * xa + 2 * (1 - t) * t * xb + t * t * xc;
    const qby = (t, ya, yb, yc) => (1 - t) * (1 - t) * ya + 2 * (1 - t) * t * yb + t * t * yc;
    const pts = [];
    for (let i = 0; i <= 28; i += 1) {
      const t = i / 28;
      pts.push({ x: qbx(t, 10, 46, 82), y: qby(t, 14, 40, 14) });
    }
    neck.fillStyle(0x081820, 0.38);
    neck.fillEllipse(46, 50, 62, 11);
    neck.lineStyle(2.8, 0x2a1810, 1);
    neck.beginPath();
    neck.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i += 1) neck.lineTo(pts[i].x, pts[i].y);
    neck.strokePath();
    neck.lineStyle(1.2, 0x7a6050, 0.82);
    neck.beginPath();
    neck.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i += 1) neck.lineTo(pts[i].x, pts[i].y);
    neck.strokePath();
    const beadSmall = (x, y) => {
      neck.fillStyle(0x003028, 1);
      neck.fillCircle(x, y, 4.6);
      neck.fillStyle(0x00b0a0, 1);
      neck.fillCircle(x, y - 0.5, 3.6);
      neck.fillStyle(0xc8fff8, 0.38);
      neck.fillEllipse(x - 1.5, y - 2.5, 2.6, 3.4);
    };
    [4, 7, 21, 24].forEach((pi) => beadSmall(pts[pi].x, pts[pi].y));
    const mx = pts[14].x;
    const my = pts[14].y + 2;
    neck.fillStyle(0x002820, 1);
    neck.fillEllipse(mx, my + 3, 20, 8.5);
    neck.fillStyle(0x005048, 1);
    neck.fillEllipse(mx, my, 18, 20);
    neck.fillStyle(0x00c8b8, 1);
    neck.fillEllipse(mx, my - 1, 13.5, 15);
    neck.fillStyle(0x88fff0, 0.45);
    neck.fillEllipse(mx - 4, my - 6, 6.5, 9);
    neck.fillStyle(0x051818, 0.9);
    neck.fillEllipse(mx, my - 10, 5, 3.2);
    neck.fillEllipse(mx, my + 9.5, 5, 3.2);
    neck.lineStyle(1.4, 0x003028, 1);
    neck.strokeEllipse(mx, my, 18, 20);
    neck.lineStyle(0.9, 0x58f0e0, 0.75);
    neck.strokeEllipse(mx, my - 1, 10, 12);
    neck.generateTexture("ph_g1_necklace", NW, NH);
    neck.destroy();

    /** Fruto de cacao en planta — recolectable Misión 1 (marcadores mapa). */
    const cacaoSpr = this.make.graphics({ x: 0, y: 0, add: false });
    const C = 22;
    cacaoSpr.fillStyle(0x1a2818, 0.92);
    cacaoSpr.fillEllipse(C + 12, 40, 10, 5);
    cacaoSpr.fillStyle(0x2d4828, 1);
    cacaoSpr.fillEllipse(C + 6, 32, 10, 6);
    cacaoSpr.fillEllipse(C + 18, 30, 9, 5);
    cacaoSpr.fillStyle(0x3a5832, 1);
    cacaoSpr.fillEllipse(C - 6, 28, 8, 5);
    cacaoSpr.fillStyle(0x4a2818, 1);
    cacaoSpr.fillEllipse(C, 26, 12, 16);
    cacaoSpr.fillStyle(0x5a3822, 1);
    cacaoSpr.fillEllipse(C - 3, 24, 6, 8);
    cacaoSpr.fillEllipse(C + 4, 22, 7, 9);
    cacaoSpr.fillStyle(0x6b2820, 1);
    cacaoSpr.fillEllipse(C + 1, 26, 4.5, 5);
    cacaoSpr.fillStyle(0xc83828, 0.95);
    cacaoSpr.fillEllipse(C + 1, 26.5, 2.8, 3);
    cacaoSpr.fillStyle(0xe05038, 0.85);
    cacaoSpr.fillEllipse(C + 0.5, 26.5, 1.4, 1.8);
    cacaoSpr.generateTexture("ph_g1_cacao", 44, 48);
    cacaoSpr.destroy();

    /** Tileset 32×32 para Tiled (Juego 1): 4 pastos + 1 borde sólido (gid 5) */
    const g1ts = this.make.graphics({ x: 0, y: 0, add: false });
    const grassCols = [0x2a5840, 0x325c42, 0x2e5038, 0x365848];
    for (let i = 0; i < 4; i += 1) {
      const tx = i * 32;
      g1ts.fillStyle(grassCols[i], 1);
      g1ts.fillRect(tx, 0, 32, 32);
      for (let n = 0; n < 14; n += 1) {
        g1ts.fillStyle(0x1a2818, Phaser.Math.FloatBetween(0.07, 0.24));
        g1ts.fillRect(tx + Phaser.Math.Between(1, 29), Phaser.Math.Between(1, 29), Phaser.Math.Between(1, 2), 1);
      }
      g1ts.lineStyle(1, 0x1a2018, 0.12);
      g1ts.strokeRect(tx + 0.5, 0.5, 31, 31);
    }
    g1ts.fillStyle(0x1e1810, 1);
    g1ts.fillRect(128, 0, 32, 32);
    g1ts.fillStyle(0x0c0a08, 0.45);
    g1ts.fillRect(130, 2, 28, 4);
    g1ts.lineStyle(1, 0x121008, 0.85);
    g1ts.strokeRect(128.5, 0.5, 31, 31);
    g1ts.generateTexture("ph_g1_tileset", 160, 32);
    g1ts.destroy();

    const hut = this.make.graphics({ x: 0, y: 0, add: false });
    const hcx = 44;
    hut.fillStyle(0x080604, 0.42);
    hut.fillEllipse(hcx, 78, 56, 14);
    hut.fillStyle(0x6a5040, 1);
    hut.beginPath();
    hut.moveTo(16, 74);
    hut.lineTo(22, 48);
    hut.lineTo(66, 48);
    hut.lineTo(72, 74);
    hut.closePath();
    hut.fillPath();
    hut.fillStyle(0x8a7058, 1);
    hut.fillRoundedRect(18, 50, 52, 26, 4);
    hut.fillStyle(0x5a4030, 0.9);
    hut.fillRect(19, 52, 5, 22);
    hut.fillRect(64, 52, 5, 22);
    hut.lineStyle(2, 0x4a3020, 0.85);
    hut.strokeRoundedRect(18, 50, 52, 26, 4);
    hut.fillStyle(0x120a06, 1);
    hut.fillRoundedRect(34, 58, 20, 18, 3);
    hut.fillStyle(0xffddaa, 0.15);
    hut.fillRect(36, 62, 5, 7);
    hut.fillStyle(0xb89860, 1);
    hut.beginPath();
    hut.moveTo(8, 52);
    hut.lineTo(hcx, 6);
    hut.lineTo(80, 52);
    hut.closePath();
    hut.fillPath();
    hut.fillStyle(0x9a7848, 1);
    hut.beginPath();
    hut.moveTo(16, 50);
    hut.lineTo(hcx, 16);
    hut.lineTo(72, 50);
    hut.closePath();
    hut.fillPath();
    hut.lineStyle(1, 0x6a5030, 0.5);
    for (let k = 0; k < 9; k += 1) {
      const ty = 18 + k * 3.5;
      const w = 11 + k * 3.2;
      hut.beginPath();
      hut.moveTo(hcx - w, ty);
      hut.lineTo(hcx + w, ty);
      hut.strokePath();
    }
    hut.lineStyle(2, 0x5a4030, 0.95);
    hut.beginPath();
    hut.moveTo(8, 52);
    hut.lineTo(hcx, 6);
    hut.lineTo(80, 52);
    hut.strokePath();
    hut.generateTexture("ph_g1_house", 88, 88);
    hut.destroy();
  }
}
