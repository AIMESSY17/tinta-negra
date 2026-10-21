// Renderiza los reels de promo/textos.json a promo/salida/reels/*.mp4
// (H.264, 1080×1920, 30 fps, menos de 30 MB).
//   node video/render.mjs                 → todos
//   node video/render.mjs reel-4-pedido   → solo ese
import fs from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const PROMO = path.join(DIR, '..');
const SALIDA = path.join(PROMO, 'salida/reels');
const MAX_MB = 30;

const textos = JSON.parse(await fs.readFile(path.join(PROMO, 'textos.json'), 'utf8'));
const pedidos = process.argv.slice(2);
const reels = pedidos.length ? textos.reels.filter(r => pedidos.includes(r.id)) : textos.reels;
await fs.mkdir(SALIDA, { recursive: true });

// la pista de audio es opcional: solo entra si está activada en textos.json y el archivo existe
let audioActivo = !!textos.audio?.activo;
if (audioActivo && !existsSync(path.join(DIR, 'public', textos.audio.archivo))) {
  console.warn(`⚠ audio activado pero no encontré video/public/${textos.audio.archivo}: los reels salen sin sonido.`);
  audioActivo = false;
}

console.log('Empaquetando el proyecto Remotion…');
const serveUrl = await bundle({ entryPoint: path.join(DIR, 'src/index.jsx'), publicDir: path.join(DIR, 'public') });

for (const r of reels) {
  const salida = path.join(SALIDA, `${r.id}.mp4`);
  const comp = await selectComposition({ serveUrl, id: r.id, inputProps: { audioActivo } });
  const inputProps = { ...comp.props, audioActivo };
  let crf = 18;
  for (;;) {
    let ultimo = -1;
    await renderMedia({
      composition: comp, serveUrl, inputProps, outputLocation: salida,
      codec: 'h264', crf, pixelFormat: 'yuv420p', x264Preset: 'slow', imageFormat: 'jpeg', jpegQuality: 92, colorSpace: 'bt709',
      muted: !audioActivo, overwrite: true,
      onProgress: ({ progress }) => {
        const p = Math.floor(progress * 10);
        if (p !== ultimo) { ultimo = p; process.stdout.write(`\r● ${r.id} ${p * 10}%   `); }
      },
    });
    const mb = statSync(salida).size / 1e6;
    if (mb < MAX_MB || crf >= 30) { console.log(`\r● ${r.id} · ${(comp.durationInFrames / 30).toFixed(1)} s · ${mb.toFixed(1)} MB · crf ${crf}`); break; }
    crf += 3; // pasado de peso: más compresión
  }
}
