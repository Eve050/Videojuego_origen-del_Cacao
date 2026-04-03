/**
 * Textos literales según propuesta «Minijuegos educativos | El Enigma de Santa Ana – La Florida» v1.0.
 */
export const INTRO_COPY = {
  game1: {
    nextScene: "Game1Scene",
    startButton: "[ COMENZAR EXPLORACIÓN ]",
    instructionsButton: "[ VER INSTRUCCIONES ]",
    title: "EL ORIGEN DEL CACAO",
    subtitle: "Palanda, Ecuador – El origen mundial documentado del cacao",
    missionTitle: "INVESTIGADOR, TU MISIÓN:",
    missionLines: [
      "Explorar el sitio arqueológico Santa Ana – La Florida (a 5 km de Palanda, 1.100 msnm).",
      "Encontrar los 3 objetos arqueológicos del descubrimiento de 2002.",
      "Responder correctamente para ganar puntos y desbloquear datos científicos reales.",
      "Al completar los 3 objetos, desbloquearás el mapa completo del sitio.",
    ],
    statsLines: ["PUNTUACIÓN MÁXIMA: 300 puntos.", "INTENTOS POR PREGUNTA: 3."],
  },
  game2: {
    nextScene: "Game2Scene",
    startButton: "[ INICIAR EL VIAJE ]",
    instructionsButton: "[ INSTRUCCIONES ]",
    title: "EL VIAJE DEL CACAO AL MUNDO",
    subtitle: "Desde Palanda, Ecuador, hasta Europa: 5.500 años de historia",
    missionTitle: "EL VIAJE COMIENZA EN PALANDA, ECUADOR – 5.500 AÑOS ATRÁS",
    missionLines: [
      "CÓMO JUGAR:",
      "El escenario avanza solo de Palanda hacia Europa (cinco etapas).",
      "Esquiva rocas y recoge vasijas en el aire (saltando o con doble salto); no están en el suelo.",
      "Las vasijas doradas y las piezas especiales desbloquean datos históricos.",
    ],
    statsLines: ["Objetivo: completar el viaje hasta Europa."],
  },
  game3: {
    nextScene: "Game3Scene",
    title: "CACAO MAZE",
    subtitle:
      "El laberinto sagrado de la cultura Mayo Chinchipe – Marañón. Palanda, Ecuador – 5.500 años de historia.",
    missionTitle: "PANTALLA: SELECCIÓN DE NIVEL",
    missionLines: [
      "Laberinto tipo vista cenital (estilo Pac-Man cultural).",
      "Recoge granos de cacao y piezas arqueológicas; evita a los cuatro guardianes espirituales.",
      "La vaina de cacao dorada otorga poder temporal (10 s de protección según propuesta).",
      "Tres niveles: Explorador, Arqueólogo y Guardián (mayor desafío).",
    ],
    statsLines: [
      "En juego: Granos, Piezas 0/4, tres vidas, nivel actual.",
      "Piezas y vaina dorada desbloquean datos reales del sitio.",
    ],
  },
};

export function exitToMainMap() {
  if (typeof window !== "undefined") {
    window.location.hash = "#/p04";
  }
}
