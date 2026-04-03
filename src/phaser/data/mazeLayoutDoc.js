/**
 * §4.2 Diseño del laberinto — rejilla documentada 21 columnas × 13 filas (celda nominal 44×44 px en diseño).
 * Leyenda: # muro · o grano · . vacío · p pieza · V vasija meta · (vainas * las añade postProcess).
 */
export const DOC_MAZE_COLS = 21;
export const DOC_MAZE_ROWS = 13;
/** Celda según documento (área útil 924×572); en runtime se escala a LAYOUT.GAME_H. */
export const DOC_CELL_PX = 44;

export const MAZE_ASCII_DOC = [
  "#####################",
  "#ooooooooooooooooooo#",
  "#o########o########o#",
  "#o#ooooooooooooooo#o#",
  "#o#o#############o#o#",
  "#o#ooooooooooooooo#o#",
  "#o#o#############o#o#",
  "#o#ooooooVoooooooo#o#",
  "#o#o#############o#o#",
  "#o#ooopooooooopoooo#o#",
  "#o#o#############o#o#",
  "#o#opoooooooooo#o#o#",
  "#ooooooooooooooooooo#",
];
