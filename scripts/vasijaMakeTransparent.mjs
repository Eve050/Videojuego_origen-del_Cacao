/**
 * Quita fondo blanco del PNG de la vasija y escribe vasija-mayo-chinchipe.png con alpha.
 * 1) Flood-fill desde los bordes (solo fondo conectado al exterior).
 * 2) Componentes conectadas claras grandes huecos cerrados (ej. interior del asa).
 * Uso: node scripts/vasijaMakeTransparent.mjs   |   npm run vasija:alpha
 */
import sharp from "sharp";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const preferSrc = join(root, "public/assets/images/game1/vasija-mayo-chinchipe-src.png");
const fallback = join(root, "public/assets/images/game1/vasija-mayo-chinchipe.png");
const input = existsSync(preferSrc) ? preferSrc : fallback;
const output = join(root, "public/assets/images/game1/vasija-mayo-chinchipe.png");

if (!existsSync(input)) {
  console.error("No existe la imagen de entrada:", input);
  process.exit(1);
}
if (input === fallback && !existsSync(preferSrc)) {
  console.warn("Aviso: coloca vasija-mayo-chinchipe-src.png (fondo blanco) para mejor resultado.");
}

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const out = new Uint8ClampedArray(data);

function satRgb(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max < 1 ? 0 : (max - min) / max;
}

function distWhite(r, g, b) {
  return Math.sqrt((255 - r) ** 2 + (255 - g) ** 2 + (255 - b) ** 2);
}

function clearPixel(i) {
  out[i] = 0;
  out[i + 1] = 0;
  out[i + 2] = 0;
  out[i + 3] = 0;
}

/** Conectado al fondo exterior (blanco / crema / anti-alias). */
function matchesExteriorBg(r, g, b) {
  const lum = (r + g + b) / 3;
  const sat = satRgb(r, g, b);
  const d = distWhite(r, g, b);
  if (lum < 72) return false;
  if (sat > 0.48 && lum < 248) return false;
  if (d < 62 && sat < 0.24 && lum > 158) return true;
  if (d < 88 && sat < 0.16 && lum > 178) return true;
  if (Math.min(r, g, b) > 168 && sat < 0.22 && d < 102) return true;
  return false;
}

/** Píxel “hueco interior” / halo residual (sin fondar el objeto entero). */
function matchesEnclosedLight(r, g, b) {
  const lum = (r + g + b) / 3;
  const sat = satRgb(r, g, b);
  const d = distWhite(r, g, b);
  if (lum < 80) return false;
  if (sat > 0.38 && lum < 240) return false;
  return d < 52 && sat < 0.18 && lum > 185;
}

// --- Paso 1: flood desde bordes ---
const visited = new Uint8Array(W * H);
const queue = [];
function pushStart(x, y) {
  const p = y * W + x;
  if (visited[p]) return;
  const i = p * 4;
  const r = out[i];
  const g = out[i + 1];
  const b = out[i + 2];
  if (!matchesExteriorBg(r, g, b)) return;
  visited[p] = 1;
  queue.push(p);
}

for (let x = 0; x < W; x++) {
  pushStart(x, 0);
  pushStart(x, H - 1);
}
for (let y = 0; y < H; y++) {
  pushStart(0, y);
  pushStart(W - 1, y);
}

while (queue.length) {
  const p = queue.pop();
  const i = p * 4;
  clearPixel(i);

  const x = p % W;
  const y = (p / W) | 0;

  if (x > 0) trySpread(p - 1);
  if (x < W - 1) trySpread(p + 1);
  if (y > 0) trySpread(p - W);
  if (y < H - 1) trySpread(p + W);
}

function trySpread(np) {
  if (visited[np]) return;
  const j = np * 4;
  const r = out[j];
  const g = out[j + 1];
  const b = out[j + 2];
  if (!matchesExteriorBg(r, g, b)) return;
  visited[np] = 1;
  queue.push(np);
}

// --- Paso 2: componentes conectadas claras grandes (hueco del asa, etc.) ---
const seen = new Uint8Array(W * H);
const stack = [];
const component = [];

for (let p = 0; p < W * H; p++) {
  if (seen[p]) continue;
  const i = p * 4;
  if (out[i + 3] === 0) {
    seen[p] = 1;
    continue;
  }
  const r = out[i];
  const g = out[i + 1];
  const b = out[i + 2];
  if (!matchesEnclosedLight(r, g, b)) continue;

  component.length = 0;
  seen[p] = 1;
  stack.push(p);

  while (stack.length) {
    const cp = stack.pop();
    component.push(cp);
    const cx = cp % W;
    const cy = (cp / W) | 0;

    const nbs = [
      cx > 0 ? cp - 1 : -1,
      cx < W - 1 ? cp + 1 : -1,
      cy > 0 ? cp - W : -1,
      cy < H - 1 ? cp + W : -1,
    ];
    for (const np of nbs) {
      if (np < 0 || seen[np]) continue;
      const j = np * 4;
      if (out[j + 3] === 0) continue;
      const r2 = out[j];
      const g2 = out[j + 1];
      const b2 = out[j + 2];
      if (!matchesEnclosedLight(r2, g2, b2)) continue;
      seen[np] = 1;
      stack.push(np);
    }
  }

  // Huecos grandes; reflejos puntúales suelen ser CC pequeñas
  if (component.length < 180) continue;

  for (const cp of component) {
    clearPixel(cp * 4);
  }
}

// --- Paso 3: halo muy claro pegado al borde ya transparente ---
for (let y = 1; y < H - 1; y++) {
  for (let x = 1; x < W - 1; x++) {
    const p = y * W + x;
    const i = p * 4;
    if (out[i + 3] === 0) continue;

    let transparentNeighbors = 0;
    for (const dp of [p - 1, p + 1, p - W, p + W]) {
      if (out[dp * 4 + 3] === 0) transparentNeighbors++;
    }
    if (transparentNeighbors === 0) continue;

    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];
    const lum = (r + g + b) / 3;
    const sat = satRgb(r, g, b);
    const d = distWhite(r, g, b);
    if (lum > 135 && sat < 0.14 && d < 118 && transparentNeighbors >= 2) {
      clearPixel(i);
    }
  }
}

await sharp(Buffer.from(out), {
  raw: { width: W, height: H, channels: 4 },
})
  .png({ compressionLevel: 9 })
  .toFile(output);

console.log("OK:", output, `${W}x${H}`);
