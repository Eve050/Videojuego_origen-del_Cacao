const STORAGE_KEY = "enigma_santa_ana_state";

const DEFAULT_STATE = {
  playerName: "",
  missionsCompleted: 0,
  selectedStopIndex: 0,
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
    selectedStopIndex:
      Number.isInteger(safeState.selectedStopIndex) && safeState.selectedStopIndex >= 0
        ? safeState.selectedStopIndex
        : 0,
    progress: {
      p01Visited: Boolean(safeProgress.p01Visited),
      p02Completed: Boolean(safeProgress.p02Completed),
      p03Completed: Boolean(safeProgress.p03Completed),
    },
    missionAccepted: Boolean(safeState.missionAccepted),
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

export function setSelectedStopIndex(selectedStopIndex) {
  const state = getGameState();
  const safeIndex = Number.isInteger(selectedStopIndex) && selectedStopIndex >= 0
    ? selectedStopIndex
    : 0;
  const nextState = {
    ...state,
    selectedStopIndex: safeIndex,
  };
  saveGameState(nextState);
  return nextState;
}

export function completeActiveMission() {
  const state = getGameState();
  const currentCompleted = Math.max(0, state.missionsCompleted || 0);

  if (currentCompleted >= 3) {
    return state;
  }

  const nextCompleted = currentCompleted + 1;
  const nextState = {
    ...state,
    missionsCompleted: nextCompleted,
    selectedStopIndex: nextCompleted,
  };

  saveGameState(nextState);
  return nextState;
}
