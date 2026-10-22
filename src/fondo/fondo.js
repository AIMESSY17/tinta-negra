/* El fondo del sitio: un solo <canvas id="bg"> fijo detrás de las tres páginas.
   Bucle, gestos de la mesa, zonas de lectura y modo liviano, con los mismos tiempos que el boceto. */
import config from '../config.js';
import { state, emit, on, addTicker, $ } from '../lib/state.js';
import { sketches, src, BASE } from '../lib/media.js';
import { createMesa } from './mesa.js';

const reduced = state.reduced;
const IS_TOUCH = state.touch;
const FX = { trail: true, drops: true, redraw: !reduced, depth: !IS_TOUCH, smear: !reduced };
const mouse = { x: innerWidth / 2, y: innerHeight / 2, px: null, py: null, has: false };
// sv: velocidad del scroll; dx/dy: velocidad del arrastre (inercia); vx/vy: lo que corre la tinta
const cam = { x: 0, y: 0, vx: 0, vy: 0, sv: 0, dx: 0, dy: 0 };
const drops = [];
let BG = null, painting = false, tilt = null, tallerAbierto = false, arrastre = null;

/* La mesa reacciona en toda la página, también debajo de los textos.
   Solo la tapan los controles, la hoja, el taller y el cuerpo de la estatua (eso lo marca la estatua en el evento). */
const CONTROLES = 'a,button,input,textarea,select,label,summary,[role=button],[contenteditable],.chip,.zona,.obra,.retrato,.hoja,.velo,.taller,.top,.tabbar,.pista,.mov,[data-nomesa]';
const enMesa = (t, e) => !!t?.closest?.('[data-mesa],.panel') && !t.closest(CONTROLES) && !(e && e.__estatua);

/* ---------- zonas de lectura: abrazan el texto real, no el contenedor ---------- */
const LECTURA = [
  '.mega', '.kicker', '.hero-tx > p', '.acciones', '.zonas', '.cab .n', '.chips', '.mas-obras', '.vacio',
  '.cita p', '.cita small', '.cta p', '.cta .btn', '.bio p', '.datos',
  '.faq summary', '.faq .r', '.etapa .tx > *', '.cuidado > *', '.contacto > div', '.pie',
].join(',');
let lecturas = [];
const juntar = () => { lecturas = [...document.querySelectorAll(LECTURA)]; };
const rango = document.createRange();
function ajustado(el) {
  const r = el.getBoundingClientRect(); if (!r.width) return null;
  // el texto real: unión de las cajas del contenido, recortada al propio elemento (filas con scroll horizontal)
  rango.selectNodeContents(el);
  const t = rango.getBoundingClientRect();
  let x0 = r.left, y0 = r.top, x1 = r.right, y1 = r.bottom;
  if (t.width && t.height) { x0 = Math.max(r.left, t.left); y0 = Math.max(r.top, t.top); x1 = Math.min(r.right, t.right); y1 = Math.min(r.bottom, t.bottom); }
  // el título gótico: suma el calco violeta corrido
  if (el.classList.contains('mega')) { const fs = parseFloat(getComputedStyle(el).fontSize); x1 += fs * .06; y1 += fs * .05; }
  return x1 > x0 && y1 > y0 ? { x0, y0, x1, y1 } : null;
}
/* Medir fuerza layout: se mide solo cuando algo cambió (tamaño, fuentes, contenido, página, scroll de una fila)
   y se guarda en coordenadas de documento. En cada frame solo se resta el scroll. */
let medidas = [], sucio = true;
const marcar = () => { sucio = true; };
function medir() {
  juntar();
  const sy = scrollY; medidas = [];
  for (const el of lecturas) {
    const a = ajustado(el); if (!a) continue;
    medidas.push({ x: a.x0 - 12, y: a.y0 - 12 + sy, w: a.x1 - a.x0 + 24, h: a.y1 - a.y0 + 24 });
  }
  sucio = false;
}
function zonasLectura() {
  if (sucio) medir();
  const H = innerHeight, sy = scrollY, adentro = [], cerca = [];
  for (const m of medidas) {
    const top = m.y - sy, bot = top + m.h;
    if (bot < -68 || top > H + 92) continue;
    const z = { x: m.x, y: top, w: m.w, h: m.h };
    (bot > 12 && top < H - 12 ? adentro : cerca).push(z);
  }
  // primero los que están en pantalla
  return adentro.concat(cerca).slice(0, 24);
}
function vigilarZonas() {
  addEventListener('resize', marcar);
  document.fonts?.ready.then(marcar);
  document.fonts?.addEventListener?.('loadingdone', marcar);
  on('page', marcar);
  const main = $('#main');
  if (!main) return;
  // cambios de tamaño (un desplegable de preguntas, una grilla filtrada) y de contenido o atributos
  const ro = new ResizeObserver(marcar);
  ro.observe(main); ro.observe(document.body);
  new MutationObserver(marcar).observe(main, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['hidden', 'open', 'style'] });
  // filas con scroll horizontal (chips, zonas): el texto se corre dentro de su caja
  document.addEventListener('scroll', e => { if (e.target !== document) marcar(); }, { capture: true, passive: true });
}

/* ---------- modo liviano: video loop de la mesa o imagen fija ---------- */
function modoLiviano() {
  if (BG) { BG.destroy(); BG = null; }
  const c = $('#bg'); if (c) c.hidden = true;
  document.documentElement.classList.add('no-webgl');
  if ($('#bg-liviano')) return;
  const m = config.mesaLiviana || {};
  let el;
  if ((m.webm || m.mp4) && !reduced) {
    el = document.createElement('video');
    Object.assign(el, { muted: true, loop: true, autoplay: true, playsInline: true });
    el.setAttribute('muted', ''); el.setAttribute('playsinline', '');
    if (m.imagen) el.poster = BASE + m.imagen;
    for (const [k, t] of [['webm', 'video/webm'], ['mp4', 'video/mp4']]) if (m[k]) { const s = document.createElement('source'); s.src = BASE + m[k]; s.type = t; el.append(s); }
  } else {
    el = document.createElement('img');
    el.alt = '';
    el.src = BASE + (m.imagen || '');
  }
  el.id = 'bg-liviano';
  el.setAttribute('aria-hidden', 'true');
  document.body.prepend(el);
}

export function initFondo() {
  const forced = new URLSearchParams(location.search).get('liviano');
  const ctx = {
    canvas: $('#bg'), urls: sketches.map(s => src(s.path)), IS_TOUCH, FX, mouse, cam, drops,
    get time() { return state.time; }, get studio() { return state.studio; },
  };
  if (forced !== '1') { try { BG = createMesa(ctx); } catch (err) { console.error(err); BG = null; } }
  if (!BG) modoLiviano();

  juntar(); vigilarZonas();
  // solo en desarrollo: para las pruebas automáticas
  if (import.meta.env.DEV) window.__mesa = { cam, mouse, get pintando() { return painting; }, get zonas() { return zonasLectura(); } };
  const raiz = document.documentElement;

  /* ---------- gestos ---------- */
  let lp = null;
  document.addEventListener('pointerdown', e => {
    state.lastInput = state.time; if (!enMesa(e.target, e)) return;
    if (e.pointerType === 'mouse') {
      // escritorio: solo se guarda dónde se apretó. Sin preventDefault ni captura: un clic sigue siendo un clic
      if (e.button !== 0 || !BG) return;
      arrastre = { id: e.pointerId, x0: e.clientX, y0: e.clientY, lx: e.clientX, ly: e.clientY, activo: false };
      return;
    }
    lp = { x: e.clientX, y: e.clientY, t: performance.now(), tm: null };
    // táctil: mantener apretado 420 ms pinta
    lp.tm = setTimeout(() => {
      if (!lp) return; painting = true; mouse.has = true; mouse.x = lp.x; mouse.y = lp.y; mouse.px = lp.x; mouse.py = lp.y;
      try { navigator.vibrate && navigator.vibrate(12); } catch (_) { /* sin vibración */ }
      emit('pista-off');
    }, 420);
  });
  document.addEventListener('pointermove', e => {
    if (e.pointerType === 'mouse') {
      mouse.x = e.clientX; mouse.y = e.clientY;
      if (arrastre && arrastre.id === e.pointerId) {
        // el arrastre empieza recién después de 5 px: ahí se captura el puntero y la mano se cierra
        if (!arrastre.activo) {
          if (Math.hypot(e.clientX - arrastre.x0, e.clientY - arrastre.y0) <= 5) return;
          arrastre.activo = true;
          try { document.body.setPointerCapture(e.pointerId); } catch (_) { /* nada */ }
          raiz.classList.add('arrastrando');
          getSelection?.().removeAllRanges();
        }
        const dx = e.clientX - arrastre.lx, dy = e.clientY - arrastre.ly;
        arrastre.lx = e.clientX; arrastre.ly = e.clientY;
        // la cámara del lienzo sigue a la mano; la velocidad queda para la inercia y la tinta corrida
        cam.x -= dx; cam.y -= dy; cam.dx = -dx; cam.dy = -dy;
        mouse.has = true; state.lastInput = state.time;
        return;
      }
      // el destino del evento ya es el elemento bajo el puntero (el lienzo no recibe eventos): sin elementFromPoint
      const t = e.target;
      const ok = !!t && enMesa(t, e);
      mouse.has = ok;
      raiz.classList.toggle('sobre-mesa', ok);
      if (ok) state.lastInput = state.time;
      return;
    }
    if (lp && !painting && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) > 10) { clearTimeout(lp.tm); lp = null; }
    if (painting) { mouse.x = e.clientX; mouse.y = e.clientY; state.lastInput = state.time; }
  }, { passive: true });
  // el scroll se frena solo mientras se pinta; el resto del tiempo, scroll nativo
  document.addEventListener('touchmove', e => { if (painting) e.preventDefault(); }, { passive: false });
  function fin(e) {
    if (arrastre && arrastre.id === e.pointerId) {
      const a = arrastre; arrastre = null;
      if (a.activo) {
        raiz.classList.remove('arrastrando');
        try { document.body.releasePointerCapture(e.pointerId); } catch (_) { /* nada */ }
        // después de un arrastre real se cancela solo el click que viene justo después
        sinClick = true; setTimeout(() => { sinClick = false; }, 60);
      } else if (BG) BG.addDrop(e.clientX, e.clientY); // menos de 5 px: un clic normal sobre la mesa deja la gota
      return;
    }
    // toque corto: gota de tinta
    if (lp) { clearTimeout(lp.tm); if (!painting && performance.now() - lp.t < 400 && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) < 10 && BG) BG.addDrop(e.clientX, e.clientY); }
    lp = null; if (painting) { painting = false; if (IS_TOUCH) mouse.has = false; }
  }
  document.addEventListener('pointerup', fin);
  let sinClick = false;
  document.addEventListener('click', e => { if (sinClick) { sinClick = false; e.preventDefault(); e.stopPropagation(); } }, true);
  document.addEventListener('pointercancel', e => {
    if (arrastre) { arrastre = null; raiz.classList.remove('arrastrando'); }
    if (lp) clearTimeout(lp.tm); lp = null; painting = false; if (IS_TOUCH) mouse.has = false;
  });
  // el menú contextual funciona en todo el sitio; solo en táctil se evita mientras se mantiene apretado para pintar
  document.addEventListener('contextmenu', e => { if (IS_TOUCH && (painting || lp)) e.preventDefault(); });

  /* ---------- giroscopio: punto de luz violeta (solo halo de color) ---------- */
  const onTilt = e => { if (e.gamma == null) return; tilt = { x: Math.max(-1, Math.min(1, e.gamma / 28)), y: Math.max(-1, Math.min(1, ((e.beta || 45) - 45) / 28)) }; };
  if (IS_TOUCH && window.DeviceOrientationEvent && BG) {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      const b = $('#mov'); if (b) {
        b.hidden = false;
        b.onclick = () => DeviceOrientationEvent.requestPermission().then(r => { if (r === 'granted') addEventListener('deviceorientation', onTilt); b.hidden = true; }).catch(() => { b.hidden = true; });
      }
    } else addEventListener('deviceorientation', onTilt);
  }

  /* ---------- visibilidad: el render se pausa si ninguna sección de mesa está a la vista ---------- */
  const vis = new Set();
  const io = new IntersectionObserver(es => es.forEach(en => (en.isIntersecting ? vis.add(en.target) : vis.delete(en.target))), { threshold: 0 });
  document.querySelectorAll('[data-mesa],.panel').forEach(el => io.observe(el));

  /* ---------- medición de fps los primeros 2 s (solo táctil): si es muy lento, modo liviano ---------- */
  let medT = 0, medF = 0, medido = forced === '0' || !IS_TOUCH;

  let ghostT = 0, lastScroll = scrollY;
  addTicker(dt => {
    if (!BG) return;
    // el scroll anima la mesa: se desliza con la página y la tinta se corre con la velocidad
    const ds = scrollY - lastScroll; lastScroll = scrollY;
    cam.sv += (ds * .55 - cam.sv) * .35;
    // arrastre con inercia: al soltar sigue y frena suave
    if (!arrastre) { cam.x += cam.dx; cam.y += cam.dy; const f = Math.pow(.93, dt * 60); cam.dx *= f; cam.dy *= f; }
    else { cam.dx *= .7; cam.dy *= .7; }
    cam.y += cam.sv;
    cam.vx = cam.dx; cam.vy = cam.sv + cam.dy;
    if (!reduced) { cam.y += dt * 5; cam.x += dt * 2; }
    const mesaVisible = vis.size > 0 && !tallerAbierto && !document.hidden;
    // pincel: mouse, dedo pintando, punto de luz del giroscopio o pincel fantasma
    let bx = mouse.x, by = mouse.y, on = mouse.has && FX.trail, paint = true;
    if (IS_TOUCH && !painting && tilt) { bx = innerWidth * (.5 + tilt.x * .42); by = innerHeight * (.45 + tilt.y * .4); on = true; paint = false; }
    const idle = state.time - state.lastInput > (IS_TOUCH ? 1.6 : 3.5);
    if (!on && idle && FX.trail && !reduced) {
      ghostT += dt; on = true; paint = true;
      bx = innerWidth * (.5 + .38 * Math.sin(ghostT * .53) + .08 * Math.sin(ghostT * 1.7)); by = innerHeight * (.5 + .3 * Math.sin(ghostT * .71 + 1.2) + .06 * Math.cos(ghostT * 2.3));
    }
    const ax = mouse.px ?? bx, ay = mouse.py ?? by;
    if (mesaVisible) {
      BG.render(dt, { ax, ay, bx, by, on, paint, spd: Math.hypot(bx - ax, by - ay) }, { x: 0, y: 0, amt: 0 }, zonasLectura());
      // mientras está la pantalla de carga no se mide: compite con el dibujo y daría un número injusto
      if (!medido && !raiz.classList.contains('cargando')) {
        medT += dt; medF++;
        if (medT >= 2) { medido = true; if (medF / medT < 22) modoLiviano(); }
      }
    }
    mouse.px = bx; mouse.py = by;
  }, 0);

  return {
    addDrop: (x, y, s) => BG?.addDrop(x, y, s),
    refrescar: marcar,
    setTaller: v => { tallerAbierto = v; },
    // la mesa lista para la pantalla de carga (en modo liviano no hay nada que esperar)
    lista: BG ? BG.lista : Promise.resolve(),
    arrastrando: () => !!(arrastre && arrastre.activo) || painting,
  };
}
