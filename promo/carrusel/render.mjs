// Renderiza el carrusel (1080×1350 PNG) desde carrusel/plantilla.html y promo/textos.json.
// Usa las capturas reales que deja grabar.mjs en carrusel/capturas/.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { abrirNavegador } from '../lib/sitio.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const PROMO = path.join(DIR, '..');
const SALIDA = path.join(PROMO, 'salida/carrusel');

const textos = JSON.parse(await fs.readFile(path.join(PROMO, 'textos.json'), 'utf8'));
const C = textos.carrusel;
const total = C.slides.length + 2;
const base = { marca: textos.marca, usuario: textos.usuario, total };
const laminas = [
  { ...base, tipo: 'portada', indice: 1, ...C.portada },
  ...C.slides.map((s, i) => ({ ...base, tipo: 'funcion', indice: i + 2, n: i + 1, de: C.slides.length, ...s })),
  { ...base, tipo: 'cierre', indice: total, capturas: ['mesa-tinta', 'pedido', 'proceso'], ...C.cierre },
];

await fs.mkdir(SALIDA, { recursive: true });
const browser = await abrirNavegador();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(DIR, 'plantilla.html')).href, { waitUntil: 'networkidle' });
for (const l of laminas) {
  await page.evaluate(s => window.pintar(s), l);
  const nombre = `${String(l.indice).padStart(2, '0')}-${l.tipo === 'funcion' ? l.titulo.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : l.tipo}.png`;
  await page.screenshot({ path: path.join(SALIDA, nombre), clip: { x: 0, y: 0, width: 1080, height: 1350 } });
  console.log(`● ${nombre}`);
}
await browser.close();
