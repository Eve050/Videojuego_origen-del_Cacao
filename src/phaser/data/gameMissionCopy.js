/** Textos del panel «MISIÓN» por escena (objetivo del jugador en ese momento). */

export const GAME1_MISSION = {
  title: "Misión 1 · Ruta del cacao",
  body:
    "Explora la plaza ceremonial de Santa Ana – La Florida.\n\n" +
    "• Recoge los 4 granos de cacao y la vasija ritual (objetos destacados en el mapa).\n" +
    "• Acércate y usa E, el botón ACCIÓN o toca el objeto para abrir la pregunta.\n" +
    "• Responde bien para sumar puntos y desbloquear datos científicos.",
};

export const GAME2_MISSION = {
  title: "Misión 2 · Viaje del cacao",
  body:
    "Recorre la ruta del cacao hasta Europa.\n\n" +
    "• Salta obstáculos (↑, W, espacio; en móvil usa los controles del minijuego).\n" +
    "• Recoge vasijas en el aire; las doradas y las piezas culturales desbloquean datos.\n" +
    "• Completa la ruta para cerrar la misión.",
};

/** @param {import("phaser").Scene & { level?: number }} scene */
export function getGame3MissionBody(scene) {
  const lv = scene.level ?? 1;
  if (lv >= 2) {
    return (
      "Nivel final · laberinto cultural.\n\n" +
      "• Recoge todos los orbes ancestrales para completar la misión.\n" +
      "• Evita a los guardianes; el poder dorado activa un modo cacería temporal.\n" +
      "• Al cumplir los objetivos, completa el nivel final."
    );
  }
  return (
    "Nivel 1 · laberinto cultural.\n\n" +
    "• Recoge todos los granos del laberinto.\n" +
    "• Después recoge cada orbe ancestral para pasar de nivel.\n" +
    "• Esquiva guardianes; el poder te ayuda a dispersarlos un momento."
  );
}

export const GAME3_MISSION_TITLE = "Misión 3 · Cacao maze";

/** @param {import("phaser").Scene & { q?: { objectLabel?: string, objectKey?: string } }} scene */
export function getQuizMissionBody(scene) {
  const obj = scene.q?.objectLabel || scene.q?.objectKey || "este objeto";
  return (
    `Has encontrado: ${obj}.\n\n` +
    "Elige la respuesta correcta entre las cuatro opciones (hasta 3 intentos; menos puntos si tardas en acertar).\n\n" +
    "Si aciertas, desbloqueas un dato científico y la fuente."
  );
}

export const QUIZ_MISSION_TITLE = "Mini examen";
