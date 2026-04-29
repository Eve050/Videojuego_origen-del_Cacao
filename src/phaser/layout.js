/**
 * Zonas según documento técnico v1.0 (canvas 1280×720).
 * Suma vertical: 60 + 480 + 40 + 120 = 700 → 20 px libres al pie.
 */
export const LAYOUT = {
  WIDTH: 1280,
  HEIGHT: 720,
  HUD_TOP_H: 60,
  GAME_TOP: 60,
  GAME_H: 480,
  /** Misión 1: todo el lienzo bajo el HUD (sin franja negra de pista/controles). */
  GAME1_PLAY_H: 660,
  HINT_TOP: 540,
  HINT_BAR_H: 40,
  CONTROLS_TOP: 580,
  CONTROLS_H: 120,
  /** Espacio real bajo CONTROLS_TOP hasta el borde inferior (720) */
  CONTROLS_H_ACTUAL: 140,
};
