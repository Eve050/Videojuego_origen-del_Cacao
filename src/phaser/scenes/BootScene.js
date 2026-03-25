import Phaser from "phaser";
import questions from "../data/questions.json";
import culturalData from "../data/culturalData.json";
import zonesConfig from "../data/zonesConfig.json";
import { takePendingExpeditionMission } from "../missionContext.js";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
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
    mk("ph_floor", 32, 32, 0x2d4a38);
    mk("ph_obstacle", 48, 36, 0x5c4030);
    mk("ph_pod", 20, 20, 0xe8d060);
    mk("ph_pod_gold", 26, 26, 0xffc94a);
    mk("ph_piece", 22, 22, 0x4a90c8);
    mk("ph_runner", 36, 48, 0x3d7a52);
  }
}
