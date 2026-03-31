import Phaser from "phaser";
import questions from "../data/questions.json";
import culturalData from "../data/culturalData.json";
import zonesConfig from "../data/zonesConfig.json";
import { takePendingExpeditionMission } from "../missionContext.js";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    this.load.image("bg_selva_run", "/assets/images/fondo-selva-noche.webp");
  }

  create() {
    this.registry.set("questions", questions);
    this.registry.set("culturalData", culturalData);
    this.registry.set("zonesConfig", zonesConfig);

    this.generatePlaceholderTextures();

    const expeditionMission = takePendingExpeditionMission();
    this.registry.set("expeditionMission", expeditionMission);

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
    pl.fillStyle(0x2a1810, 1);
    pl.fillRoundedRect(13, 41, 7, 5, 2);
    pl.fillRoundedRect(24, 41, 7, 5, 2);
    pl.fillStyle(0x4a3528, 1);
    pl.fillRoundedRect(13, 34, 7, 11, 3);
    pl.fillRoundedRect(24, 34, 7, 11, 3);
    pl.fillStyle(0x3a2418, 1);
    pl.fillRect(10, 32, 24, 3);
    pl.fillStyle(0xc9a050, 1);
    pl.fillRoundedRect(19, 32, 6, 3, 1);
    pl.fillStyle(0x5c4030, 1);
    pl.fillRoundedRect(8, 22, 5, 13, 3);
    pl.fillRoundedRect(31, 22, 5, 13, 3);
    pl.fillStyle(0x6b4a38, 1);
    pl.fillRoundedRect(11, 20, 22, 20, 7);
    pl.fillStyle(0x8b6548, 1);
    pl.fillRoundedRect(13, 22, 18, 14, 5);
    pl.fillStyle(0x4a3020, 1);
    pl.fillRect(13, 36, 5, 2);
    pl.fillRect(26, 36, 5, 2);
    pl.fillStyle(0xd4c8b8, 1);
    pl.fillRoundedRect(18, 23, 8, 9, 2);
    pl.fillStyle(0x2d4a38, 1);
    pl.fillTriangle(18, 22, 26, 22, 22, 25);
    pl.fillStyle(0xc9a050, 1);
    pl.fillCircle(17, 27, 1.5);
    pl.fillCircle(27, 27, 1.5);
    pl.lineStyle(2, 0x3a2818, 0.65);
    pl.beginPath();
    pl.moveTo(11, 24);
    pl.lineTo(33, 32);
    pl.strokePath();
    pl.lineStyle(2, 0x3a2818, 0.65);
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
    pl.lineStyle(1.5, 0x3a2820, 0.9);
    pl.strokeRoundedRect(11, 20, 22, 20, 7);
    pl.generateTexture("ph_player", 44, 48);
    pl.destroy();

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

    /** Juego 1 — iconos legibles (estilo ilustración limpia) */
    const gb = this.make.graphics({ x: 0, y: 0, add: false });
    gb.fillStyle(0x1a1010, 0.25);
    gb.fillEllipse(28, 52, 26, 9);
    gb.fillStyle(0xc9a050, 1);
    gb.fillRoundedRect(14, 12, 30, 36, 9);
    gb.fillStyle(0xe8c878, 1);
    gb.fillRoundedRect(17, 15, 24, 20, 7);
    gb.fillStyle(0x8a6020, 1);
    gb.fillEllipse(28, 42, 22, 12);
    gb.lineStyle(2, 0xfff0c0, 0.95);
    gb.strokeRoundedRect(14, 12, 30, 36, 9);
    gb.fillStyle(0xfff8e8, 0.85);
    gb.fillCircle(24, 24, 5);
    gb.generateTexture("ph_g1_bottle", 58, 58);
    gb.destroy();

    const gtz = this.make.graphics({ x: 0, y: 0, add: false });
    gtz.fillStyle(0x102828, 0.35);
    gtz.fillEllipse(18, 32, 20, 7);
    gtz.fillStyle(0x00a898, 1);
    gtz.beginPath();
    gtz.moveTo(18, 7);
    gtz.lineTo(27, 14);
    gtz.lineTo(22, 25);
    gtz.lineTo(14, 25);
    gtz.lineTo(9, 14);
    gtz.closePath();
    gtz.fillPath();
    gtz.fillStyle(0x40f0e0, 0.65);
    gtz.fillTriangle(18, 11, 23, 17, 13, 20);
    gtz.lineStyle(2, 0xc8ffff, 0.95);
    gtz.strokeCircle(18, 18, 12);
    gtz.generateTexture("ph_g1_turquoise", 36, 36);
    gtz.destroy();

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
