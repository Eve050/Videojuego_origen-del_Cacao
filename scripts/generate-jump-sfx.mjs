/**
 * Genera public/assets/audio/sfx_jump.wav (salto corto, sin ffmpeg).
 * Regenerar: node scripts/generate-jump-sfx.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "..", "public", "assets", "audio", "sfx_jump.wav");

const sampleRate = 22050;
const dur = 0.1;
const n = Math.floor(sampleRate * dur);
const dataSize = n * 2;
const buf = Buffer.alloc(44 + dataSize);

buf.write("RIFF", 0);
buf.writeUInt32LE(36 + dataSize, 4);
buf.write("WAVE", 8);
buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(1, 22);
buf.writeUInt32LE(sampleRate, 24);
buf.writeUInt32LE(sampleRate * 2, 28);
buf.writeUInt16LE(2, 32);
buf.writeUInt16LE(16, 34);
buf.write("data", 36);
buf.writeUInt32LE(dataSize, 40);

let phase = 0;
const f0 = 360;
const f1 = 95;
let seed = 0x9e3779b9;
const rnd = () => {
  seed ^= seed << 13;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  return (seed >>> 0) / 4294967296;
};

for (let i = 0; i < n; i += 1) {
  const t = i / sampleRate;
  const prog = t / dur;
  const f = f0 + (f1 - f0) * prog;
  phase += (2 * Math.PI * f) / sampleRate;
  const env = Math.sin(Math.PI * prog) ** 0.65;
  const body = Math.sin(phase) * 0.38 * env;
  const click = (rnd() - 0.5) * 0.12 * (1 - prog) ** 3;
  const v = Math.max(-1, Math.min(1, body + click));
  buf.writeInt16LE(Math.round(v * 32000), 44 + i * 2);
}

fs.writeFileSync(outPath, buf);
console.log("Wrote", outPath, `(${buf.length} bytes)`);
