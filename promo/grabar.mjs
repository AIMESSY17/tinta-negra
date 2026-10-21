// Graba cada escena del sitio por separado, en formato reel (1080×1920 px).
//   node grabar.mjs                 → todas las escenas
//   node grabar.mjs pedido proceso  → solo esas
//
// El viewport es de 540×960 CSS a escala 2×: los cuadros salen de 1080×1920 px reales
// y el sitio usa su diseño de celular, que es el que se lee bien en un reel.
// (Con --escala=1 se graba un viewport literal de 1080×1920 CSS, que muestra el diseño de escritorio.)
import fs from 'node:fs/promises';
import path from 'node:path';
import { levantarSitio, abrirNavegador, PROMO } from './lib/sitio.mjs';
import { crearHumano } from './lib/humano.mjs';
import { grabar, remuestrear, aMp4, guardarCuadro, fpsReales } from './lib/grabadora.mjs';

const ESCALA = Number(process.argv.find(a => a.startsWith('--escala='))?.split('=')[1] || 2);
const VW = 1080 / ESCALA, VH = 1920 / ESCALA;
const DIR_VIDEO = path.join(PROMO, 'video/public/grabaciones');
const DIR_CAPT = path.join(PROMO, 'carrusel/capturas');
const ARCH_DUR = path.join(DIR_VIDEO, 'duraciones.json');

/* ---------- utilidades sobre la página ---------- */

async function entrarSaltandoIntro(page, url) {
  await page.goto(url, { waitUntil: 'commit' });
  await page.waitForSelector('#intro .intro-col', { state: 'attached', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForSelector('#intro', { state: 'detached', timeout: 15000 });
  await esperarEstatua(page);
  await page.waitForTimeout(1600); // viaje de la estatua + títulos entintados
}

async function esperarEstatua(page) {
  // la estatua carga Three.js y el modelo en diferido; el dibujo vitruviano aparece cuando está lista
  await page.waitForSelector('#vit.draw', { state: 'attached', timeout: 30000 }).catch(() => {});
}

const caja = async (page, sel) => {
  const b = await page.locator(sel).first().boundingBox();
  if (!b) throw new Error(`No encontré ${sel}`);
  return b;
};
const centro = b => [b.x + b.width / 2, b.y + b.height / 2];
const docY = (page, sel) => page.locator(sel).first().evaluate(el => el.getBoundingClientRect().top + scrollY);

// lleva el elemento a la franja visible si quedó afuera
async function asegurarVisible(page, h, sel, { arriba = 90, abajo = VH - 90, ms = 600 } = {}) {
  const b = await caja(page, sel);
  if (b.y >= arriba && b.y + b.height <= abajo) return;
  const y = await page.evaluate(() => scrollY);
  const delta = b.y < arriba ? b.y - arriba - 20 : b.y + b.height - abajo + 20;
  await h.scrollA(y + delta, ms);
}

// recorre la línea central de la estatua para saber a qué altura está cada zona
async function mapearZonas(page, h) {
  const st = await caja(page, '#st');
  const cx = st.x + st.width / 2;
  const zonas = {};
  for (let y = st.y + 10; y < st.y + st.height - 10; y += 8) {
    await page.mouse.move(cx, y);
    await page.waitForTimeout(45);
    const z = await page.evaluate(() => {
      const l = document.getElementById('label');
      return getComputedStyle(l).opacity > .5 ? l.childNodes[1]?.textContent?.trim() : null;
    });
    if (z) (zonas[z] ||= []).push(y);
  }
  await page.mouse.move(VW - 20, VH * .5);
  await page.waitForTimeout(300);
  const medio = ys => ys[Math.floor(ys.length / 2)];
  return { cx, y: Object.fromEntries(Object.entries(zonas).map(([k, v]) => [k, medio(v)])) };
}

/* ---------- escenas ---------- */
// preparar: deja la página lista (fuera de cámara) · accion: lo que se graba
// recorte: [marca, desde, hasta] en segundos relativos a la marca · capturas para el carrusel

const ESCENAS = [
  {
    id: 'intro-vitruvio',
    async accion(page, h, marcar, url) {
      await page.goto(url, { waitUntil: 'commit' });
      await page.waitForSelector('#intro.go', { timeout: 30000 });
      marcar('go');
      await page.waitForSelector('#intro', { state: 'detached', timeout: 15000 });
      await page.waitForTimeout(2600);
      await h.ubicar(VW * .82, VH * .78);
      const st = await caja(page, '#st');
      await h.mover(st.x + st.width * .55, st.y + st.height * .45, { ms: 1100 });
      await h.pausa(1400);
    },
    recorte: ['go', -.3, 8.2],
    capturas: [['go', 1.05, 'intro-dibujo'], ['go', 7.6, 'intro-estatua']],
  },
  {
    id: 'mesa-tinta',
    preparar: async (page, h, url) => { await entrarSaltandoIntro(page, url); await h.ubicar(VW * .9, VH * .3); },
    async accion(page, h, marcar) {
      marcar('inicio');
      const P = (x, y) => [VW * x, VH * y];
      await h.recorrer([P(.62, .2), P(.2, .3), P(.1, .55), P(.24, .74), P(.14, .87)], 520);
      await h.clic(...P(.12, .62), { ms: 500 });
      await h.recorrer([P(.35, .9), P(.86, .82), P(.94, .6)], 520);
      await h.clic(...P(.88, .44), { ms: 420 });
      await h.recorrer([P(.7, .2), P(.4, .16), P(.16, .4)], 480);
      await h.clic(...P(.18, .48), { ms: 380 });
      await h.recorrer([P(.1, .7), P(.3, .88), P(.9, .9), P(.86, .7)], 470);
      await h.pausa(500);
    },
    recorte: ['inicio', 0, 9],
    capturas: [['inicio', 6.2, 'mesa-tinta']],
  },
  {
    id: 'estatua-zonas',
    async preparar(page, h, url) {
      await entrarSaltandoIntro(page, url);
      this.mapa = await mapearZonas(page, h);
      await page.waitForTimeout(800);
      await h.ubicar(VW * .88, VH * .72);
    },
    async accion(page, h, marcar) {
      marcar('inicio');
      const { cx, y } = this.mapa;
      const yTorso = y.Torso ?? VH * .5, yCabeza = y.Cabeza ?? VH * .32, yPiernas = y.Piernas ?? VH * .68;
      await h.mover(cx + 6, yTorso, { ms: 800 });
      await h.pausa(500);
      await h.arrastrar(cx + 190, yTorso + 12, 1000);
      await h.pausa(700);
      await h.mover(cx - 4, yCabeza, { ms: 650 });
      await h.pausa(800);
      await h.mover(cx + 10, yPiernas, { ms: 700 });
      await h.pausa(700);
      const chip = page.locator('#zones button', { hasText: 'Brazos' });
      await h.clicEn(chip, { ms: 650 });
      await h.pausa(1800); // scroll suave al taller con Brazos elegido
      const hoja = await caja(page, '#pedido .zw:nth-child(2)');
      await h.mover(...centro(hoja), { ms: 700 });
      await h.pausa(1000);
    },
    recorte: ['inicio', 0, 10],
    capturas: [['inicio', 9.4, 'estatua-zonas']],
  },
  {
    id: 'proceso',
    async preparar(page, h, url) {
      await entrarSaltandoIntro(page, url + 'info');
      const top = await docY(page, '#proceso .obj');
      await h.scrollA(top - VH * .5, 10);
      await page.waitForTimeout(1200);
      await h.scrollA(top - 40, 10);
      await page.waitForTimeout(2200); // carga del shader de piel
      const c = await caja(page, '#proceso .proc-canvas canvas');
      await h.ubicar(c.x + c.width * .85, c.y + c.height * .8);
      await asegurarVisible(page, h, '#proceso .proc-nav', { ms: 10 });
    },
    async accion(page, h, marcar) {
      marcar('inicio');
      await h.pausa(700);
      for (let i = 1; i <= 5; i++) {
        await h.clicEn(page.locator(`#proceso .proc-steps button[data-i="${i}"]`), { ms: 420 });
        await h.pausa(900);
      }
      await h.pausa(500);
    },
    recorte: ['inicio', 0, 9],
    capturas: [['inicio', 5.4, 'proceso']],
  },
  {
    id: 'pedido',
    async preparar(page, h, url) {
      await entrarSaltandoIntro(page, url);
      const top = await docY(page, '#pedido .steps-nav');
      await h.scrollA(top - VH * .5, 10);
      await page.waitForTimeout(1200);
      await h.scrollA(top - 150, 10);
      await page.waitForTimeout(2000); // mini estatua
      await h.ubicar(VW * .85, VH * .45);
    },
    async accion(page, h, marcar) {
      marcar('inicio');
      const S = s => page.locator(`#pedido ${s}`).first();
      const rapido = { ms: 340 };
      await h.clicEn(S('[data-zone="2"]'), { ms: 480 });
      await h.pausa(250);
      await h.clicEn(S('.next'), rapido);
      // regla: arrastrar el tirador hasta 14 cm
      const r = await caja(page, '#pedido .ruler');
      const vbw = await S('.ruler').evaluate(el => el.viewBox.baseVal.width);
      const xCm = cm => r.x + (20 + cm * 20) / vbw * r.width;
      const cmAhora = await page.evaluate(() => +document.querySelector('#pedido .ruler').getAttribute('aria-valuenow'));
      await h.mover(xCm(cmAhora), r.y + r.height * .5, { ms: 380 });
      await h.arrastrar(xCm(16), r.y + r.height * .5, 520);
      await h.clicEn(S('.next'), rapido);
      await h.clicEn(S('[data-ostyle]'), rapido);
      await h.pausa(150);
      await h.clicEn(S('.next'), rapido);
      await h.clicEn(S('input[name="name"]'), rapido);
      await h.escribir('Sofi');
      await page.keyboard.press('Tab');
      await h.escribir('Polilla con calavera');
      await h.pausa(150);
      await h.clicEn(S('.next'), rapido);
      await h.clicEn(S('[data-day]:nth-child(3)'), rapido);
      await h.clicEn(S('[data-slot]:nth-child(2)'), rapido);
      marcar('sello');
      // bajar hasta la ficha completa con el sello
      const f = await docY(page, '#pedido .ficha');
      const fh = await page.locator('#pedido .ficha').evaluate(el => el.offsetHeight);
      await h.scrollA(f + fh / 2 - VH / 2, 800);
      const wa = await caja(page, '#pedido .wa-btn');
      await h.mover(wa.x + wa.width * .7, wa.y + wa.height * .5, { ms: 450 });
      await h.pausa(800);
    },
    recorte: ['inicio', 0, 'fin'],
    capturas: [['fin', -.4, 'pedido']],
  },
];

/* ---------- orquestación ---------- */

async function main() {
  const pedidas = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const escenas = pedidas.length ? ESCENAS.filter(e => pedidas.includes(e.id)) : ESCENAS;
  if (!escenas.length) throw new Error(`Escenas disponibles: ${ESCENAS.map(e => e.id).join(', ')}`);
  await fs.mkdir(DIR_VIDEO, { recursive: true });
  await fs.mkdir(DIR_CAPT, { recursive: true });
  // Remotion lee de acá cuánto dura cada grabación
  const duraciones = JSON.parse(await fs.readFile(ARCH_DUR, 'utf8').catch(() => '{}'));

  const sitio = await levantarSitio();
  const url = sitio.url + '?liviano=0';
  const browser = await abrirNavegador();
  const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: ESCALA, hasTouch: false, colorScheme: 'light', locale: 'es-AR' });
  try {
    // primera carga para que Vite compile y el navegador cachee imágenes y modelos
    const calentar = await ctx.newPage();
    await calentar.goto(url, { waitUntil: 'load', timeout: 120000 });
    await esperarEstatua(calentar);
    await calentar.evaluate(() => [...document.querySelectorAll('img[loading=lazy]')].forEach(i => { i.loading = 'eager'; }));
    await calentar.waitForTimeout(3000);
    await calentar.close();

    for (const e of escenas) {
      const page = await ctx.newPage();
      page.on('pageerror', err => console.warn(`  [${e.id}] error en la página: ${err.message}`));
      const h = crearHumano(page, e.id.length * 31 + 7);
      process.stdout.write(`● ${e.id}… `);
      if (e.preparar) await e.preparar.call(e, page, h, url);
      else await page.goto('about:blank');
      const g = await grabar(page, marcar => e.accion.call(e, page, h, marcar, url));
      const [m, desde, hasta] = e.recorte;
      const t0 = g.marcas[m] + desde;
      // cada escena dura como máximo 10 s
      const t1 = Math.min(t0 + 10, typeof hasta === 'number' ? g.marcas[m] + hasta : g.marcas[hasta]);
      const salida = path.join(DIR_VIDEO, `${e.id}.mp4`);
      await aMp4(remuestrear(g, t0, t1), salida);
      for (const [marca, dt, nombre] of e.capturas || []) await guardarCuadro(g, g.marcas[marca] + dt, path.join(DIR_CAPT, `${nombre}.jpg`));
      duraciones[e.id] = Math.round((t1 - t0) * 30) / 30;
      await fs.writeFile(ARCH_DUR, JSON.stringify(duraciones, null, 2));
      console.log(`${(t1 - t0).toFixed(1)} s · ${fpsReales(g, t0, t1).toFixed(0)} cuadros/s de Chrome`);
      await page.close();
    }
  } finally {
    await browser.close();
    await sitio.cerrar();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
