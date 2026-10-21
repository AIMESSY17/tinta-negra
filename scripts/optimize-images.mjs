// Convierte todo lo que hay en img/ a WebP en public/media/ (tamaño grande + miniatura)
// y genera src/generated/media.json con el listado de cada carpeta.
// Se ejecuta solo antes de `npm run dev` y `npm run build`. Solo reprocesa lo que cambió.
import { readdir, stat, mkdir, writeFile, readFile } from 'node:fs/promises';
import { join, dirname, relative, extname, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'img');
const OUT = join(root, 'public', 'media');
const MANIFEST = join(root, 'src', 'generated', 'media.json');
const EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

// ancho máximo por carpeta de primer nivel (los bocetos del fondo van a una textura WebGL)
const MAX = { fondo: 800, vitruvio: 1000, default: 1400 };
const THUMB = 360;
const QUALITY = { fondo: 70, default: 80 };

async function walk(dir) {
  const out = [];
  let entries = [];
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else if (EXT.has(extname(e.name).toLowerCase())) out.push(p);
  }
  return out;
}

// porcentaje de píxeles violeta (para priorizar bocetos con acento)
async function violetRatio(file) {
  const { data, info } = await sharp(file).resize(64, 64, { fit: 'inside' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let v = 0;
  const n = info.width * info.height;
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    if (mx < .2 || d / mx < .25) continue;
    let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
    if (h > 245 && h < 310) v++;
  }
  return +(v / n).toFixed(3);
}

let old = {};
try { old = JSON.parse(await readFile(MANIFEST, 'utf8')); } catch {}
const oldByPath = new Map(Object.values(old.folders || {}).flat().map(f => [f.path, f]));

const files = await walk(SRC);
const folders = {};
let done = 0, skipped = 0;
for (const file of files) {
  const rel = relative(SRC, file).split('\\').join('/');
  const top = rel.split('/')[0];
  const folder = posix.dirname(rel);
  const base = rel.slice(0, -extname(rel).length);
  const big = join(OUT, base + '.webp'), small = join(OUT, base + '-s.webp');
  const srcStat = await stat(file);
  let entry = oldByPath.get(rel);
  let fresh = false;
  try { fresh = (await stat(big)).mtimeMs >= srcStat.mtimeMs && (await stat(small)).mtimeMs >= srcStat.mtimeMs && entry; } catch {}
  if (!fresh) {
    const meta = await sharp(file).metadata();
    // descarta imágenes casi vacías (p. ej. un PNG negro de 300x150)
    const st = await sharp(file).stats();
    if (st.channels.slice(0, 3).every(c => c.stdev < 3)) { console.log('  ignorada (vacía):', rel); continue; }
    await mkdir(dirname(big), { recursive: true });
    const max = MAX[top] || MAX.default;
    await sharp(file).rotate().resize({ width: max, height: Math.round(max * 1.6), fit: 'inside', withoutEnlargement: true }).webp({ quality: QUALITY[top] || QUALITY.default }).toFile(big);
    await sharp(file).rotate().resize({ width: THUMB, height: Math.round(THUMB * 1.4), fit: 'inside', withoutEnlargement: true }).webp({ quality: 72 }).toFile(small);
    const outMeta = await sharp(big).metadata();
    entry = { path: rel, file: rel.split('/').pop(), w: outMeta.width, h: outMeta.height, violet: await violetRatio(file) };
    done++;
  } else skipped++;
  (folders[folder] ||= []).push(entry);
}
for (const k in folders) folders[k].sort((a, b) => a.file.localeCompare(b.file));
await mkdir(dirname(MANIFEST), { recursive: true });
await writeFile(MANIFEST, JSON.stringify({ folders }, null, 1));
console.log(`imágenes: ${done} procesadas, ${skipped} sin cambios → public/media/`);
