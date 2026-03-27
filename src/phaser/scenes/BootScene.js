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

    mk("ph_player", 32, 40, 0x1d6b3a);
    mk("ph_collect", 28, 28, 0xc8921a);
    mk("ph_guardian", 28, 28, 0x8b2942);
    mk("ph_wall", 32, 32, 0x4a3728);
    mk("ph_wall_maze", 32, 32, 0x5a2a8a);
    mk("ph_floor", 32, 32, 0x2d4a38);
    mk("ph_obstacle", 48, 36, 0x5c4030);
    mk("ph_pod", 20, 20, 0xe8d060);
    mk("ph_pod_gold", 26, 26, 0xffc94a);
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
    pot.fillStyle(0xa85c32, 1);
    pot.fillEllipse(16, 24, 20, 13);
    pot.fillStyle(0xc47444, 1);
    pot.fillRoundedRect(10, 10, 12, 10, 2);
    pot.fillStyle(0xe8b878, 1);
    pot.fillEllipse(16, 9, 10, 4);
    pot.lineStyle(2, 0x5c2810, 0.85);
    pot.strokeEllipse(16, 24, 20, 13);
    pot.lineStyle(1, 0x7a4020, 0.9);
    pot.beginPath();
    pot.moveTo(10, 14);
    pot.lineTo(22, 14);
    pot.strokePath();
    pot.generateTexture("ph_vessel", 34, 34);

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
    mk("ph_runner", 36, 48, 0x3d7a52);
  }
}
