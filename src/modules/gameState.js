const STORAGE_KEY = "enigma_santa_ana_state";

/** Misiones de la expedicion (mapa avanza de 2 en 2 paradas por mision completada). */
export const EXPEDITION_MISSION_TOTAL = 3;
/** Cantidad de paradas en la ruta (Loja … Santa Ana-La Florida). */
export const ROUTE_STOP_TOTAL = 5;

/**
 * Indice de parada activa segun misiones completadas.
 * Salta de 2 en 2 para repartir el progreso en la ruta (0, 2, 4 …).
 * Con todas las misiones hechas, la expedicion llega a la ultima parada.
 */
export function getActiveStopIndexForMissions(missionsCompleted) {
  const m = Math.max(0, Math.min(EXPEDITION_MISSION_TOTAL, missionsCompleted));
  if (m >= EXPEDITION_MISSION_TOTAL) {
    return ROUTE_STOP_TOTAL - 1;
  }
  return Math.min(m * 2, ROUTE_STOP_TOTAL - 1);
}

const DEFAULT_STATE = {
  playerName: "",
  missionsCompleted: 0,
  selectedStopIndex: 0,
  certificateDownloaded: false,
  progress: {
    p01Visited: false,
    p02Completed: false,
    p03Completed: false,
  },
  missionAccepted: false,
};

function sanitizeState(rawState) {
  const safeState = rawState && typeof rawState === "object" ? rawState : {};
  const safeProgress =
    safeState.progress && typeof safeState.progress === "object"
      ? safeState.progress
      : {};

  return {
    playerName:
      typeof safeState.playerName === "string" ? safeState.playerName : "",
    missionsCompleted:
      Number.isInteger(safeState.missionsCompleted) && safeState.missionsCompleted >= 0
        ? safeState.missionsCompleted
        : 0,
    selectedStopIndex: (() => {
      const maxIdx = ROUTE_STOP_TOTAL - 1;
      if (!Number.isInteger(safeState.selectedStopIndex) || safeState.selectedStopIndex < 0) {
        return 0;
      }
      return Math.min(maxIdx, safeState.selectedStopIndex);
    })(),
    progress: {
      p01Visited: Boolean(safeProgress.p01Visited),
      p02Completed: Boolean(safeProgress.p02Completed),
      p03Completed: Boolean(safeProgress.p03Completed),
    },
    missionAccepted: Boolean(safeState.missionAccepted),
    certificateDownloaded: Boolean(safeState.certificateDownloaded),
  };
}

export function getGameState() {
  const rawState = window.sessionStorage.getItem(STORAGE_KEY);

  if (!rawState) {
    return { ...DEFAULT_STATE, progress: { ...DEFAULT_STATE.progress } };
  }

  try {
    return sanitizeState(JSON.parse(rawState));
  } catch {
    return { ...DEFAULT_STATE, progress: { ...DEFAULT_STATE.progress } };
  }
}

function saveGameState(nextState) {
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

export function markScreenVisited(screenKey) {
  const state = getGameState();
  const nextState = {
    ...state,
    progress: {
      ...state.progress,
      [screenKey]: true,
    },
  };
  saveGameState(nextState);
  return nextState;
}

export function setPlayerName(playerName) {
  const cleanName = playerName.trim().replace(/\s+/g, " ");
  const state = getGameState();
  const nextState = {
    ...state,
    playerName: cleanName,
    progress: {
      ...state.progress,
      p02Completed: cleanName.length > 0,
    },
  };
  saveGameState(nextState);
  return nextState;
}

export function acceptMission() {
  const state = getGameState();
  const nextState = {
    ...state,
    missionAccepted: true,
    progress: {
      ...state.progress,
      p03Completed: true,
    },
  };
  saveGameState(nextState);
  return nextState;
}

export function areAllMissionsComplete() {
  return getGameState().missionsCompleted >= EXPEDITION_MISSION_TOTAL;
}

export function markCertificateDownloaded() {
  const state = getGameState();
  const nextState = { ...state, certificateDownloaded: true };
  saveGameState(nextState);
  return nextState;
}

export function setSelectedStopIndex(selectedStopIndex) {
  const state = getGameState();
  const maxIdx = ROUTE_STOP_TOTAL - 1;
  const safeIndex =
    Number.isInteger(selectedStopIndex) && selectedStopIndex >= 0
      ? Math.min(maxIdx, selectedStopIndex)
      : 0;
  const nextState = {
    ...state,
    selectedStopIndex: safeIndex,
  };
  saveGameState(nextState);
  return nextState;
}

/**
 * Mision 1..EXPEDITION_MISSION_TOTAL.
 * Desbloqueada si ya completaste todas las anteriores (missionsCompleted >= missionNumber - 1).
 */
export function isMissionUnlocked(missionNumber) {
  const n = Math.floor(Number(missionNumber));
  if (n < 1 || n > EXPEDITION_MISSION_TOTAL) {
    return false;
  }
  const done = Math.max(0, getGameState().missionsCompleted || 0);
  return done >= n - 1;
}

/**
 * Suma progreso solo si esta mision es la siguiente pendiente.
 * Si el jugador la repite ya superada, no cambia missionsCompleted.
 *
 * @param {number} missionNumber 1, 2 o 3
 */
export function completeMissionByNumber(missionNumber) {
  const state = getGameState();
  const current = Math.max(0, Math.min(EXPEDITION_MISSION_TOTAL, state.missionsCompleted || 0));
  const n = Math.floor(Number(missionNumber));

  if (n < 1 || n > EXPEDITION_MISSION_TOTAL) {
    return state;
  }
  if (current !== n - 1) {
    return state;
  }
  if (current >= EXPEDITION_MISSION_TOTAL) {
    return state;
  }

  const nextCompleted = current + 1;
  const nextState = {
    ...state,
    missionsCompleted: nextCompleted,
    selectedStopIndex: getActiveStopIndexForMissions(nextCompleted),
  };

  saveGameState(nextState);
  return nextState;
}

/**
 * Reinicia misiones y mapa (nueva partida en la misma sesion).
 * @param {object} options
 * @param {boolean} [options.clearPlayerName] Si true, borra el nombre y el progreso de registro.
 */
export function restartExpedition(options = {}) {
  const clearPlayerName = Boolean(options.clearPlayerName);
  const state = getGameState();
  const trimmed = (state.playerName || "").trim();
  const name = clearPlayerName ? "" : state.playerName;

  const nextState = {
    ...state,
    playerName: name,
    missionsCompleted: 0,
    selectedStopIndex: 0,
    missionAccepted: false,
    certificateDownloaded: false,
    progress: {
      ...state.progress,
      p03Completed: false,
      p02Completed: clearPlayerName ? false : trimmed.length > 0,
    },
  };

  saveGameState(nextState);
  return nextState;
}

/** Ruta recomendada despues de reiniciar (intro si ya hay nombre, si no registro). */
export function getPostRestartRoute() {
  const s = getGameState();
  return (s.playerName || "").trim() ? "#/p03" : "#/p02";
}
