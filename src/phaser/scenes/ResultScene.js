import Phaser from "phaser";
import { LAYOUT } from "../layout.js";
import { exitToMainMap } from "../data/introCopy.js";
import { completeMissionByNumber } from "../../modules/gameState.js";
import { duckAmbientAudio } from "../../modules/audioManager.js";
import { SFX_VOL } from "../../modules/sfxVolumes.js";

/** Alineado a la guía tipográfica del proyecto (Phaser usa nombres web, no variables CSS). */
const FONT = {
  pixel: '"Press Start 2P", monospace',
  heading: '"Exo 2", sans-serif',
  body: '"Nunito", sans-serif',
};

const MAZE_CULTURAL_FACTS = [
  "Santa Ana – La Florida: la evidencia más antigua del uso de cacao en el mundo. 5.500 AP.",
  "La plaza ceremonial circular tiene 40 metros de diámetro. Centro de la vida de la cultura Mayo Chinchipe – Marañón.",
  "En 2024, 1.395 personas visitaron el sitio. En 2017 eran solo 456. Crecimiento del 200%.",
  "En 2025–2026 se registraron más de 70 nuevos sitios arqueológicos en los cantones Palanda y Chinchipe.",
];

function tierExplore(score) {
  if (score >= 300) {
    return "Eres un Guardián del Origen del Cacao. ¡Descubrimiento perfecto!";
  }
  if (score >= 200) {
    return "¡Excelente investigador! El sitio guarda más secretos.";
  }
  if (score >= 100) {
    return "Buen trabajo. El yacimiento tiene más historia que descubrir.";
  }
  return "La ciencia necesita perseverancia. ¡Inténtalo de nuevo!";
}

export default class ResultScene extends Phaser.Scene {
  constructor() {
    super({ key: "ResultScene" });
  }

  ensureSfxUnlocked() {
    const ctx = this.sound?.context;
    if (!ctx) return;
    if (ctx.state === "suspended" && typeof ctx.resume === "function") {
      ctx.resume().catch(() => {});
    }
  }

  init(data) {
    this.payload = data || {};
  }

  create() {
    const exp = this.registry.get("expeditionMission");
    const isExp = exp === 1 || exp === 2 || exp === 3;

    this.add.rectangle(0, 0, LAYOUT.WIDTH, LAYOUT.HEIGHT, 0x1a1a2e).setOrigin(0);

    if (isExp) {
      this.add
        .text(LAYOUT.WIDTH / 2, 32, `◆ ARCADE · MISIÓN ${exp} DE 3 · EXPEDICIÓN ◆`, {
          fontSize: "11px",
          color: "#6cfc8a",
          fontStyle: "bold",
          fontFamily: FONT.pixel,
        })
        .setOrigin(0.5);
    } else {
      this.add
        .text(LAYOUT.WIDTH / 2, 36, "PROPUESTA DE MINIJUEGOS EDUCATIVOS | El Enigma de Santa Ana – La Florida", {
          fontSize: "12px",
          color: "#c8921a",
          fontFamily: FONT.body,
        })
        .setOrigin(0.5);
    }

    const game = this.payload.game;
    let title = this.payload.title || "Resultado";
    let body = this.payload.detail || "";
    const score = this.payload.score ?? 0;

    if (game === "explore") {
      title = "¡FELICIDADES!";
      body = `MISIÓN SUPERADA\nMisión 1 superada con éxito.\nYa puedes pasar a la siguiente misión.\n\nPuntuación final: ${score} / 300 puntos\n\n${tierExplore(score)}`;
    } else if (game === "runner_fail") {
      title = "GAME OVER";
      body = `Sin vidas.\n\nPuntos: ${score}\nVasijas: ${this.payload.vainas ?? 0}\nDatos históricos: ${this.payload.datos ?? 0} / 5\n\nEl camino del cacao no es fácil — ¡inténtalo otra vez!`;
    } else if (game === "runner") {
      title = "¡FELICIDADES!";
      const vainas = this.payload.vainas ?? 0;
      const datos = this.payload.datos ?? 0;
      body = `MISIÓN SUPERADA\nMisión 2 superada con éxito.\nYa puedes pasar a la siguiente misión.\n\nVasijas recolectadas: ${vainas}\nDatos históricos: ${datos} / 5 zonas`;
      if (this.payload.allZones && score != null) {
        body += `\n\nPuntuación total: ${score} puntos\n\n¡Suerte en la siguiente misión, explorador del cacao ancestral!`;
      }
    } else if (game === "mazeWin") {
      title = "¡FELICIDADES!";
      const pt = this.payload.piecesTotal ?? 4;
      body = `MISIÓN SUPERADA\n${
        this.payload.finalLevel
          ? "Superaste el nivel final del Cacao Maze."
          : "Has honrado a los guardianes de la cultura Mayo Chinchipe – Marañón."
      }\n\nPiezas arqueológicas: ${this.payload.pieces ?? 0} / ${pt} | Puntos: ${score}`;
      if (this.payload.finalLevel) {
        body += "\n\nYa completaste la misión 3. Puedes continuar para obtener tu certificado.";
      }
    } else if (game === "mazeLose") {
      title = "Los guardianes han protegido el laberinto sagrado...";
      body = `El cacao ancestral de 5.500 años sigue esperando ser descubierto.\n\nPuntos: ${score} | Mejor puntaje: ${this.payload.highScore ?? score}`;
      if (this.payload.detail) {
        body += `\n\n${this.payload.detail}`;
      }
    }

    const titleSize =
      game === "runner_fail" ? "42px" : game === "runner" || game === "explore" || game === "mazeWin" ? "48px" : "22px";
    const titleColor =
      game === "runner_fail" ? "#ff6b6b" : game === "runner" || game === "explore" || game === "mazeWin" ? "#6cfc8a" : "#c8921a";
    this.add
      .text(LAYOUT.WIDTH / 2, game === "runner_fail" ? 120 : 140, title, {
        fontSize: titleSize,
        color: titleColor,
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: 1000 },
        fontFamily: FONT.heading,
      })
      .setOrigin(0.5);

    if (
      !game ||
      game === "explore" ||
      game === "runner" ||
      game === "runner_fail" ||
      game === "mazeWin" ||
      game === "mazeLose"
    ) {
      this.add
        .text(LAYOUT.WIDTH / 2, 280, body, {
          fontSize: "16px",
          color: "#f9f2dd",
          align: "center",
          wordWrap: { width: 920 },
          fontFamily: FONT.body,
        })
        .setOrigin(0.5);
    } else {
      this.add
        .text(LAYOUT.WIDTH / 2, 250, `Puntos: ${score}`, {
          fontSize: "20px",
          color: "#f9f2dd",
          fontFamily: FONT.heading,
        })
        .setOrigin(0.5);
      this.add
        .text(LAYOUT.WIDTH / 2, 300, body, {
          fontSize: "15px",
          color: "#cccccc",
          align: "center",
          wordWrap: { width: 820 },
          fontFamily: FONT.body,
        })
        .setOrigin(0.5);
    }

    this.add
      .text(LAYOUT.WIDTH / 2, LAYOUT.HEIGHT - 22, "Plan Binacional Ecuador–Perú • Proyecto Palanda", {
        fontSize: "11px",
        color: "#5a564c",
        fontFamily: FONT.body,
      })
      .setOrigin(0.5);

    const y0 = 448;
    const expeditionSuccess =
      game === "explore" ||
      (game === "runner" && this.payload.allZones === true) ||
      game === "mazeWin";
    const expeditionFail = game === "runner_fail" || game === "mazeLose";
    if (game === "explore" && this.cache.audio.exists("sfx_mission_complete")) {
      this.ensureSfxUnlocked();
      duckAmbientAudio({
        duckTo: SFX_VOL.duckMissionTo,
        holdMs: SFX_VOL.duckMissionHoldMs,
        restoreMs: SFX_VOL.duckMissionRestoreMs,
      });
      this.sound.play("sfx_mission_complete", { volume: SFX_VOL.mission });
    }

    if (isExp) {
      if (expeditionSuccess) {
        if (game === "explore") {
          this.resultBtn(y0, "[ VER DATOS HISTÓRICOS ]", () => this.showExploreFacts());
        } else if (game === "runner") {
          this.resultBtn(y0, "[ VER DATOS HISTÓRICOS ]", () => this.showRunnerFacts());
        } else if (game === "mazeWin") {
          this.resultBtn(y0, "[ VER DATOS CULTURALES ]", () => this.showMazeFacts());
        }
        const y1 = game === "explore" || game === "runner" || game === "mazeWin" ? y0 + 44 : y0;
        const continueLabel =
          game === "mazeWin"
            ? "[ VER MI CERTIFICADO ]"
            : game === "runner" || game === "explore"
              ? "[ IR A LA SIGUIENTE MISIÓN ]"
              : "[ CONTINUAR EXPEDICIÓN ]";
        this.resultBtn(y1, continueLabel, () => {
          completeMissionByNumber(exp);
          window.location.hash = game === "mazeWin" ? "#/p10" : "#/p04";
        });
      } else if (expeditionFail) {
        const replayLabel = game === "runner_fail" ? "[ VOLVER A JUGAR ]" : "[ REINTENTAR ]";
        this.resultBtn(y0, replayLabel, () => {
          const key = exp === 1 ? "Game1Scene" : exp === 2 ? "Game2Scene" : "Game3Scene";
          this.scene.start(key);
        });
        this.resultBtn(y0 + 44, "[ VOLVER AL MAPA ]", () => exitToMainMap());
      }
      return;
    }

    if (game === "explore") {
      this.resultBtn(y0, "[ VER DATOS HISTÓRICOS ]", () => this.showExploreFacts());
      this.resultBtn(y0 + 44, "[ CONTINUAR AL MAPA ]", () => exitToMainMap());
      this.resultBtn(y0 + 88, "[ JUGAR DE NUEVO ]", () =>
        this.scene.start("MiniIntroScene", { pack: "game1" }),
      );
    } else if (game === "runner_fail") {
      this.resultBtn(y0, "[ VOLVER A JUGAR ]", () => this.scene.start("Game2Scene"));
      this.resultBtn(y0 + 44, "[ CONTINUAR AL MAPA ]", () => exitToMainMap());
      this.resultBtn(y0 + 88, "[ VER DATOS HISTÓRICOS ]", () => this.showRunnerFacts());
    } else if (game === "runner") {
      this.resultBtn(y0, "[ VER DATOS HISTÓRICOS ]", () => this.showRunnerFacts());
      this.resultBtn(y0 + 44, "[ CONTINUAR AL MAPA ]", () => exitToMainMap());
      this.resultBtn(y0 + 88, "[ JUGAR DE NUEVO ]", () =>
        this.scene.start("MiniIntroScene", { pack: "game2" }),
      );
    } else if (game === "mazeWin" || game === "mazeLose") {
      this.resultBtn(y0, "[ VER DATOS CULTURALES ]", () => this.showMazeFacts());
      this.resultBtn(y0 + 44, "[ CONTINUAR AL MAPA ]", () => exitToMainMap());
      const retry = game === "mazeLose" ? "[ INTENTAR DE NUEVO ]" : "[ JUGAR DE NUEVO ]";
      this.resultBtn(y0 + 88, retry, () => this.scene.start("MiniIntroScene", { pack: "game3" }));
    } else {
      this.resultBtn(y0 + 22, "[ CONTINUAR AL MAPA ]", () => exitToMainMap());
    }
  }

  resultBtn(y, label, fn) {
    const x = LAYOUT.WIDTH / 2;
    const w = 400;
    const h = 40;
    this.add.rectangle(x, y, w, h, 0x2a2418).setStrokeStyle(2, 0xc8921a);
    const txt = this.add
      .text(x, y, label, {
        fontSize: "13px",
        color: "#f9f2dd",
        fontStyle: "bold",
        fontFamily: FONT.heading,
      })
      .setOrigin(0.5);
    const z = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
    z.on("pointerdown", fn);
    z.on("pointerover", () => txt.setColor("#fff8cc"));
    z.on("pointerout", () => txt.setColor("#f9f2dd"));
  }

  showExploreFacts() {
    const qs = this.registry.get("questions") || [];
    const parts = qs.map((q, i) => `${i + 1}. ${q.fact} (${q.source || "Zarrillo et al., 2018"})`);
    this.showModal("Datos científicos (quiz)", parts.join("\n\n"));
  }

  showRunnerFacts() {
    const zones = this.registry.get("zonesConfig") || [];
    const parts = zones.map((z) => `• ${z.name}: ${z.zoneFact || z.bannerText || ""}`);
    this.showModal("Datos históricos por zona", parts.join("\n\n"));
  }

  showMazeFacts() {
    const body = MAZE_CULTURAL_FACTS.map((l, i) => `${i + 1}. ${l}`).join("\n\n");
    this.showModal("Datos culturales", body);
  }

  showModal(heading, body) {
    const depth = 200;
    const els = [];
    const dismiss = () => {
      els.forEach((e) => e.destroy());
    };

    const block = this.add
      .rectangle(LAYOUT.WIDTH / 2, LAYOUT.HEIGHT / 2, 1040, 560, 0x12100e, 0.97)
      .setStrokeStyle(2, 0xc8921a)
      .setDepth(depth);
    els.push(block);

    const h = this.add
      .text(LAYOUT.WIDTH / 2, 100, heading, {
        fontSize: "20px",
        color: "#e4b84a",
        fontStyle: "bold",
        fontFamily: FONT.heading,
      })
      .setOrigin(0.5)
      .setDepth(depth + 1);
    els.push(h);

    const t = this.add
      .text(LAYOUT.WIDTH / 2, 150, body, {
        fontSize: "14px",
        color: "#e8e4dc",
        align: "left",
        wordWrap: { width: 960 },
        fontFamily: FONT.body,
      })
      .setOrigin(0.5, 0)
      .setDepth(depth + 1);
    els.push(t);

    const closeY = LAYOUT.HEIGHT - 100;
    const cx = LAYOUT.WIDTH / 2;
    const closeBg = this.add
      .rectangle(cx, closeY, 200, 40, 0x3d2e18)
      .setStrokeStyle(2, 0xc8921a)
      .setDepth(depth + 1);
    els.push(closeBg);
    const closeTxt = this.add
      .text(cx, closeY, "[ Cerrar ]", {
        fontSize: "14px",
        color: "#f9f2dd",
        fontStyle: "bold",
        fontFamily: FONT.heading,
      })
      .setOrigin(0.5)
      .setDepth(depth + 2);
    els.push(closeTxt);
    const z = this.add.zone(cx, closeY, 200, 40).setDepth(depth + 2).setInteractive({ useHandCursor: true });
    els.push(z);
    z.on("pointerdown", dismiss);
    z.on("pointerover", () => closeTxt.setColor("#fff8cc"));
    z.on("pointerout", () => closeTxt.setColor("#f9f2dd"));
  }
}
