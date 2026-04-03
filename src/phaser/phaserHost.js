import Phaser from "phaser";
import BootScene from "./scenes/BootScene.js";
import MenuScene from "./scenes/MenuScene.js";
import MiniIntroScene from "./scenes/MiniIntroScene.js";
import MiniInstructionsScene from "./scenes/MiniInstructionsScene.js";
import Game1Scene from "./scenes/Game1Scene.js";
import Game2Scene from "./scenes/Game2Scene.js";
import Game3Scene from "./scenes/Game3Scene.js";
import QuizScene from "./scenes/QuizScene.js";
import ResultScene from "./scenes/ResultScene.js";
import { LAYOUT } from "./layout.js";
import { setPendingExpeditionMission, setPendingDirectRunner } from "./missionContext.js";

/** @type {Phaser.Game | null} */
let gameInstance = null;

export function destroyPhaserGame() {
  if (gameInstance) {
    gameInstance.destroy(true, false);
    gameInstance = null;
  }
}

/**
 * Arranca el motor según documento técnico (1280×720, Arcade, FIT).
 * @param {HTMLElement | string} parent - elemento o id
 * @param {object} [options]
 * @param {1|2|3} [options.expeditionMission] - Si se define, salta menú e intro y abre ese minijuego (P06–P08).
 * @param {boolean} [options.directRunner] - Tras game over: solo reinicia el auto-runner (Game2) sin instrucciones ni menú.
 */
export function startPhaserGame(parent, options = {}) {
  destroyPhaserGame();
  setPendingExpeditionMission(options.expeditionMission ?? null);
  setPendingDirectRunner(options.directRunner === true);
  const el = typeof parent === "string" ? document.getElementById(parent) : parent;
  if (!el) {
    throw new Error("startPhaserGame: contenedor no encontrado");
  }

  const config = {
    type: Phaser.AUTO,
    parent: el,
    width: LAYOUT.WIDTH,
    height: LAYOUT.HEIGHT,
    backgroundColor: "#1a1a2e",
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [
      BootScene,
      MenuScene,
      MiniIntroScene,
      MiniInstructionsScene,
      Game1Scene,
      Game2Scene,
      Game3Scene,
      QuizScene,
      ResultScene,
    ],
  };

  gameInstance = new Phaser.Game(config);
  return gameInstance;
}

export function isPhaserRunning() {
  return gameInstance !== null;
}
