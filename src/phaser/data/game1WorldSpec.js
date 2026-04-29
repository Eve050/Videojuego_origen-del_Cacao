/**
 * Mapa «Ruta del Cacao» — especificación de diseño (mundo cuadrado, rejilla y spawn).
 * Export Tiled: mismos nombres de capa; tilemap debe coincidir en tamaño (64×64 × 48px = 3072).
 */
export const GAME1_WORLD_SIZE = 3072;
export const GAME1_TILE_PX = 48;
export const GAME1_GRID_TILES = 64;

/** Centro del templo / punto de aparición del jugador (coords mundo px). */
export const GAME1_SPAWN_X = 1536;
export const GAME1_SPAWN_Y = 1536;

/** Capas esperadas en el JSON de Tiled (ortogonal). */
export const GAME1_LAYERS = {
  ground: "Ground",
  details: "Details",
  structures: "Structures",
  collision: "Collision",
  top: "Top",
};

/**
 * Ubicaciones doc — puntos amarillos en el mapa (4 frutos de cacao + 1 vasija).
 * Coordenadas en px de mundo (0–3072).
 */
export const GAME1_COLLECTIBLES_L1 = [
  { kind: "cacao", x: 700, y: 1400, shadowY: 1436, qid: "objeto-cacao-1" },
  { kind: "cacao", x: 1450, y: 750, shadowY: 786, qid: "objeto-cacao-2" },
  { kind: "cacao", x: 2650, y: 650, shadowY: 686, qid: "objeto-cacao-3" },
  { kind: "cacao", x: 1250, y: 2400, shadowY: 2436, qid: "objeto-cacao-4" },
  /** Vasija ceremonial — sobre la piedra plana del mismo sendero (zona rocosa SE). */
  { kind: "vasija", x: 2280, y: 2665, shadowY: 2705, qid: "objeto-2-vasija" },
];
