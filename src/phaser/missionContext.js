/** @type {number | null} */
let pendingExpeditionMission = null;

export function setPendingExpeditionMission(n) {
  pendingExpeditionMission = typeof n === "number" && n >= 1 && n <= 3 ? n : null;
}

export function takePendingExpeditionMission() {
  const v = pendingExpeditionMission;
  pendingExpeditionMission = null;
  return v;
}
