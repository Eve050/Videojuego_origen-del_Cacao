/** @type {number | null} */
let pendingExpeditionMission = null;

/** Tras game over: arrancar directo en Game2Scene (sin menú ni pantalla de instrucciones). */
let pendingDirectRunner = false;

export function setPendingExpeditionMission(n) {
  pendingExpeditionMission = typeof n === "number" && n >= 1 && n <= 3 ? n : null;
}

export function setPendingDirectRunner(v) {
  pendingDirectRunner = v === true;
}

export function takePendingExpeditionMission() {
  const v = pendingExpeditionMission;
  pendingExpeditionMission = null;
  return v;
}

export function takePendingDirectRunner() {
  const v = pendingDirectRunner;
  pendingDirectRunner = false;
  return v;
}
