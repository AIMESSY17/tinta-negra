// Alisa la entrepierna del David (david-zonas.glb) y deja el resultado en public/models/david-liso.glb.
// Suavizado de Laplace con el borde fijo: la protuberancia pasa a ser una superficie lisa, sin abrir la malla.
// Uso: node scripts/david-pudor.mjs [entrada.glb] [salida.glb]
import { readFileSync, writeFileSync } from 'node:fs';

const [, , IN = 'david-zonas.glb', OUT = 'public/models/david-liso.glb'] = process.argv;
const buf = readFileSync(IN);
const jl = buf.readUInt32LE(12);
const json = JSON.parse(buf.subarray(20, 20 + jl).toString());
const binStart = 20 + jl + 8;
const bin = new Uint8Array(buf.subarray(binStart, binStart + buf.readUInt32LE(20 + jl)));
const acc = i => { const a = json.accessors[i], bv = json.bufferViews[a.bufferView]; return { a, off: bv.byteOffset + (a.byteOffset || 0) }; };
const prim = json.meshes[0].primitives[0];
const pA = acc(prim.attributes.POSITION), nA = acc(prim.attributes.NORMAL), zA = acc(prim.attributes._ZONE), iA = acc(prim.indices);
const N = pA.a.count;
const ab = bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength);
const P = new Float32Array(ab, pA.off, N * 3), NR = new Float32Array(ab, nA.off, N * 3), Z = new Float32Array(ab, zA.off, N);
const I = new Uint32Array(ab, iA.off, iA.a.count);

// vecinos
const nb = Array.from({ length: N }, () => new Set());
for (let t = 0; t < I.length; t += 3) for (let k = 0; k < 3; k++) { const a = I[t + k], b = I[t + (k + 1) % 3]; nb[a].add(b); nb[b].add(a); }

// región: entrepierna, solo la cáscara de adelante
const C = { x: -0.038, y: 0.52 }, R = 0.038;
let zFront = -1;
for (let i = 0; i < N; i++) if (Math.hypot(P[i * 3] - C.x, P[i * 3 + 1] - C.y) < 0.012) zFront = Math.max(zFront, P[i * 3 + 2]);
const w = new Float32Array(N);
let count = 0;
for (let i = 0; i < N; i++) {
  const d = Math.hypot(P[i * 3] - C.x, (P[i * 3 + 1] - C.y) * 0.8);
  if (d < R && P[i * 3 + 2] > zFront - 0.045) {
    const t = d / R; w[i] = 1 - t * t * (3 - 2 * t); count++;
    if (Math.round(Z[i]) === 4) Z[i] = 3; // estaba mal etiquetado como espalda
  }
}
// iteraciones de Laplace ponderadas
const tmp = new Float32Array(N * 3);
for (let it = 0; it < 400; it++) {
  tmp.set(P);
  for (let i = 0; i < N; i++) {
    if (!w[i]) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const j of nb[i]) { sx += tmp[j * 3]; sy += tmp[j * 3 + 1]; sz += tmp[j * 3 + 2]; n++; }
    const k = 0.6 * w[i];
    P[i * 3] += (sx / n - P[i * 3]) * k; P[i * 3 + 1] += (sy / n - P[i * 3 + 1]) * k; P[i * 3 + 2] += (sz / n - P[i * 3 + 2]) * k;
  }
}
// normales: se recalculan solo cerca de la región
const touched = new Set(); for (let i = 0; i < N; i++) if (w[i]) { touched.add(i); for (const j of nb[i]) touched.add(j); }
const acc3 = new Float32Array(N * 3);
for (let t = 0; t < I.length; t += 3) {
  const [a, b, c] = [I[t], I[t + 1], I[t + 2]];
  if (!touched.has(a) && !touched.has(b) && !touched.has(c)) continue;
  const ux = P[b * 3] - P[a * 3], uy = P[b * 3 + 1] - P[a * 3 + 1], uz = P[b * 3 + 2] - P[a * 3 + 2];
  const vx = P[c * 3] - P[a * 3], vy = P[c * 3 + 1] - P[a * 3 + 1], vz = P[c * 3 + 2] - P[a * 3 + 2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  for (const v of [a, b, c]) { acc3[v * 3] += nx; acc3[v * 3 + 1] += ny; acc3[v * 3 + 2] += nz; }
}
for (const i of touched) {
  const l = Math.hypot(acc3[i * 3], acc3[i * 3 + 1], acc3[i * 3 + 2]) || 1;
  NR[i * 3] = acc3[i * 3] / l; NR[i * 3 + 1] = acc3[i * 3 + 1] / l; NR[i * 3 + 2] = acc3[i * 3 + 2] / l;
}
const outBin = Buffer.from(new Uint8Array(ab));
const out = Buffer.concat([buf.subarray(0, binStart), outBin, buf.subarray(binStart + outBin.length)]);
writeFileSync(OUT, out);
console.log(`alisados ${count} vértices → ${OUT}`);
