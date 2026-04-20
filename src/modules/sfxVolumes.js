/**
 * Audio Phaser + HTML ambiente: un solo lugar para rutas, volúmenes y duck.
 *
 * Clave Phaser → archivo → dónde suena
 * - sfx_ok (acierto.mp3): J2 ítems; J3 granos; quiz respuesta correcta; fallback salto si no hay sfx_jump.
 * - sfx_error (error-sound.mp3): J2 choque; J3 guardián; quiz error / sin intentos.
 * - sfx_jump (sfx_jump.wav): J2 salto corto dedicado (suelo vs aire con rate en Game2Scene).
 * - sfx_mission_complete (mision-completada.mp3): victoria J1/J2/J3; ResultScene misión 1; siempre con duckAmbientAudio.
 * - sfx_relic (reliquia-encontrada.mp3): J1 reliquia; J2 pieza cultural; J3 orbe/pieza (playClippedSfx ~2s).
 *
 * Ambiente (HTML, no Phaser): selva-loop.mp3 — ver audioManager.js (playAmbientAudio / duck).
 */
export const AMBIENT_LOOP_URL = "/assets/audio/selva-loop.mp3";

/** Mismas claves que BootScene.load.audio — única fuente de rutas públicas. */
export const PHASE_SFX_FILES = {
  sfx_ok: "/assets/audio/acierto.mp3",
  sfx_error: "/assets/audio/error-sound.mp3",
  sfx_jump: "/assets/audio/sfx_jump.wav",
  sfx_mission_complete: "/assets/audio/mision-completada.mp3",
  sfx_relic: "/assets/audio/reliquia-encontrada.mp3",
};

export const SFX_VOL = {
  /** Base del loop HTML tras applyAmbientZoneProfile */
  ambientBase: 0.26,

  jump: 0.32,
  jumpAir: 0.2,
  ok: 0.3,
  error: 0.32,
  relic: 0.36,
  mission: 0.52,

  quizOk: 0.3,
  quizError: 0.31,

  duckMissionTo: 0.1,
  duckMissionHoldMs: 1200,
  duckMissionRestoreMs: 950,

  duckZoneTo: 0.12,
  duckZoneHoldMs: 320,
  duckZoneRestoreMs: 720,
};
