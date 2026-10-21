/* Hero: el David de mármol con zonas y proporciones vitruvianas.
   Tocar una zona (en la estatua o en sus botones) abre la galería de esa zona; desde ahí,
   "Quiero uno en …" lleva al taller con la zona ya elegida (en el celular, al flujo paso a paso). */
import config from '../config.js';
import { state, $, $$, esc, addTicker, on, emit, isMobile, mobileMQ } from '../lib/state.js';
import { src } from '../lib/media.js';
import { ZONES, count } from '../lib/zones.js';
import { completeHint } from '../lib/hints.js';
import { tattooize } from '../lib/tattoo.js';
import { goSection } from '../lib/router.js';
import { esquinas } from '../lib/ui.js';
import { chip } from '../lib/buttons.js';
import { createGallery } from './gallery.js';

const zoneChips = () => ZONES.slice(1).map((z, i) => z ? chip(z.nombre, { 'data-z': i + 1, 'aria-pressed': 'false' }) : '').join('');

export function buildHero(el) {
  el.innerHTML = `
  <div class="hero-pin">
    <svg id="vit" aria-hidden="true">
      <circle id="vCircle"/><rect id="vSquare"/><line id="vAxis"/><line id="vNavel"/>
      <text id="vFig" text-anchor="middle" font-size="15">Fig. I · estudio del cuerpo para tinta</text>
    </svg>
    <canvas id="st" aria-label="Estatua interactiva: tocá una zona del cuerpo para ver los tatuajes de esa zona"></canvas>
    <img class="st-fallback" src="${src('vitruvio/perfil.jpg')}" alt="" hidden>
    <div class="hero-copy placa hero-placa" data-calm>${esquinas()}
      <h1>${esc(config.estudio.nombre)}</h1>
      <p class="hero-sub">${esc(config.estudio.bajada)}</p>
      <div class="zones chips" id="zones" role="group" aria-label="Elegí una zona para ver sus trabajos">${zoneChips()}</div>
    </div>
    <p class="note placa" id="noteBack" data-hint="rotate"><span class="n-desk">girá la estatua para ver la espalda <span aria-hidden="true">→</span></span><span class="n-mob">deslizá para girar · tocá una zona</span></p>
    <div class="zone-row" role="group" aria-label="Zonas del cuerpo: tocá una para ver sus trabajos">${zoneChips()}</div>
  </div>
  <div id="label" class="placa" aria-hidden="true"></div>`;
}

export function initHero(el, bg) {
  const pin = $('.hero-pin', el), canvas = $('#st', el), svg = $('#vit', el);
  const labelEl = $('#label', el), noteEl = $('#noteBack', el);
  let statue = null, selZone = 0, bodyFocus = 0, visible = true, labelZone = -1, lastPt = null;
  tattooize($('h1', el), { delay: .1, step: .07 });

  /* ---- zona elegida: gota de tinta y la galería de esa zona. La zona queda iluminada mientras está abierta ---- */
  const markZone = z => $$('[data-z]', el).forEach(b => { const onb = +b.dataset.z === z; b.classList.toggle('on', onb); b.setAttribute('aria-pressed', onb); });
  const gallery = createGallery({
    onOpen: () => el.classList.add('zg-open'),
    onClose: () => {
      el.classList.remove('zg-open');
      selZone = 0;
      if (statue) { statue.sel = 0; statue.shift = 0; }
      markZone(0);
    },
    // "Quiero uno en …": al taller con la zona elegida (en el celular, el flujo paso a paso)
    onWant: z => {
      emit('pick-zone', z);
      if (isMobile()) { emit('flow-open', { step: 0 }); return; }
      setTimeout(() => goSection('pedido').then(() => emit('zone-arrived', z)), state.reduced ? 0 : 200);
    },
  });
  function pickZone(z, point) {
    selZone = z;
    // en escritorio la estatua se corre a la derecha para dejarle lugar a la galería
    if (statue) { statue.sel = z; statue.shift = isMobile() ? 0 : .42; }
    markZone(z);
    const p = point || lastPt || (statue ? statue.screenOf(0, 1.1, 0, true) : { x: innerWidth * .6, y: innerHeight * .5 });
    bg?.addDrop(p.x, p.y, 1.3);
    setLabel(0);
    completeHint('rotate');
    gallery.open(z, p);
  }
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-z]');
    if (!b) return;
    const r = b.getBoundingClientRect();
    pickZone(+b.dataset.z, e.clientX ? { x: e.clientX, y: e.clientY } : { x: r.left + r.width / 2, y: r.top + r.height / 2 });
  });
  // tocar la estatua fuera del cuerpo (sin girarla) cierra la galería
  let downAt = null;
  canvas.addEventListener('pointerdown', e => { downAt = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('pointerup', e => { lastPt = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('click', e => {
    if (!gallery.isOpen() || !downAt || Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 8) return;
    if (!statue?.zoneAt(e.clientX, e.clientY)) gallery.close();
  });
  on('page', p => { if (p !== 'inicio') gallery.close({ instant: true }); });

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (!visible) { setLabel(0); if (gallery.isOpen() && !isMobile()) gallery.close({ instant: true }); }
  }, { threshold: 0.02 }).observe(pin);

  addEventListener('keydown', e => {
    if (!visible || !statue || e.target.closest('input,textarea')) return;
    if (e.key === 'ArrowLeft' && e.target === canvas) statue.spin(-.03);
    if (e.key === 'ArrowRight' && e.target === canvas) statue.spin(.03);
  });

  /* ---- etiqueta junto al cursor ---- */
  function setLabel(z, x, y) {
    state.hoverZone = z;
    if (z) {
      if (labelZone !== z) {
        labelZone = z;
        const Z = ZONES[z];
        labelEl.innerHTML = `<div class="thumbs">${Z.items.slice(0, 3).map(it => `<img src="${src(it.path, true)}" alt="">`).join('')}</div><b>${esc(Z.nombre)}</b><small class="sc">${count(z)} ${Z.demo ? 'bocetos de muestra' : 'trabajos'} · tocá para verlos</small>`;
      }
      labelEl.style.transform = `translate(${Math.min(x + 40, innerWidth - 220)}px,${y - 60}px)`;
      labelEl.style.opacity = 1;
    } else { labelEl.style.opacity = 0; labelZone = -1; }
  }


  /* ---- scroll: la estatua gira mientras el hero está en pantalla ---- */
  let lastScroll = scrollY;
  addEventListener('scroll', () => {
    const d = scrollY - lastScroll;
    lastScroll = scrollY;
    if (statue && visible && Math.abs(d) < 400) { statue.rotY += d * .004; if (Math.abs(d) > 2) statue.touched = true; state.lastInput = state.time; }
  }, { passive: true });

  /* ---- proporciones vitruvianas ---- */
  const set = (id, a) => { const n = svg.getElementById(id); for (const k in a) n.setAttribute(k, a[k]); };
  function updateVit() {
    const r0 = svg.getBoundingClientRect();
    const sc = (x, y) => { const p = statue.screenOf(x, y, 0); return { x: p.x - r0.left, y: p.y - r0.top }; };
    const navel = sc(0, 1.12), top = sc(0, 2.0), foot = sc(0, .18), side = sc(.92, 1.12);
    const r = Math.abs(side.x - navel.x) * 1.12, half = (foot.y - top.y) / 2;
    set('vCircle', { cx: navel.x, cy: navel.y, r });
    set('vSquare', { x: navel.x - half, y: top.y, width: half * 2, height: half * 2 });
    set('vAxis', { x1: navel.x, y1: top.y - 30, x2: navel.x, y2: foot.y + 70 });
    set('vNavel', { x1: navel.x - r - 18, y1: navel.y, x2: navel.x + r + 18, y2: navel.y });
    set('vFig', { x: navel.x, y: navel.y - r - 14 });
    const lens = { vCircle: 2 * Math.PI * r, vSquare: 8 * half, vAxis: foot.y - top.y + 100, vNavel: 2 * r + 36 };
    for (const k in lens) svg.getElementById(k).style.setProperty('--len', lens[k]);
    // la pista va centrada en el eje de la estatua, debajo del pedestal (en el celular la ubica el CSS)
    if (!isMobile()) {
      const base = sc(0, -.38), nw = noteEl.offsetWidth, nh = noteEl.offsetHeight;
      const ny = Math.min(base.y + 18, r0.height - nh - 16);
      noteEl.style.transform = `translate(${Math.round(navel.x - nw / 2)}px,${Math.round(ny)}px)`;
    } else if (noteEl.style.transform) noteEl.style.transform = '';
    noteEl.style.opacity = (statue.touched || selZone) ? 0 : .95;
    if (statue.dragging?.() && Math.abs(statue.rotV) > .004) completeHint('rotate');
    return { x: navel.x + r0.left, y: navel.y + r0.top };
  }

  /* ---- carga diferida de Three.js + modelo ---- */
  const api = {
    statue: null,
    ready: null,
    // la carga inicial le pide a la estatua que aparezca desde el perfil
    fromProfile() { if (statue) { statue.rotY = -Math.PI / 2; statue.face(0); statue.touched = false; statue.o.fadeDur = .9; } else api.wantProfile = true; },
    // durante la intro la estatua se materializa en el centro, sobre la caja del Vitruvio
    centerOn(r) {
      if (!state.gl2 || state.reduced) return;
      const p = pin.getBoundingClientRect(), w = canvas.offsetWidth || 1, h = canvas.offsetHeight || 1;
      const cx = p.left + canvas.offsetLeft + w / 2, cy = p.top + canvas.offsetTop + h / 2;
      // misma altura que la figura dibujada (la estatua ocupa fit·fitW del alto del canvas)
      const fit = innerWidth < 760 ? .94 : .78, fitW = Math.min(1, (w / h) / .52);
      const s = Math.min(1.5, Math.max(.4, r.height / 1.02 / (h * fit * fitW)));
      canvas.style.transition = 'none';
      canvas.style.transform = `translate(${r.left + r.width / 2 - cx}px,${r.top + r.height / 2 - cy}px) scale(${s})`;
    },
    // y después viaja suave a su lugar del hero
    release() {
      if (!canvas.style.transform) return;
      canvas.style.transition = 'transform 1.1s cubic-bezier(.65, 0, .25, 1)';
      canvas.style.transform = '';
      canvas.addEventListener('transitionend', () => { canvas.style.transition = ''; }, { once: true });
    },
  };
  if (!state.gl2) {
    canvas.hidden = true;
    $('.st-fallback', el).hidden = false;
    return api;
  }
  api.ready = new Promise(resolve => {
    requestAnimationFrame(() => setTimeout(async () => {
      const { Statue } = await import('../statue/statue.js');
      statue = api.statue = new Statue(canvas, {
        fit: .78, fitMobile: .94, shiftMobile: 0,
        // en el celular se gira deslizando en cualquier parte del lienzo; tocar al lado deja la gota en la mesa
        dragAnywhere: isMobile(),
        onTapEmpty: (x, y) => bg?.addDrop(x, y),
        onHover: (z, x, y) => setLabel(z, x, y),
        onHoverMove: (z, x, y) => setLabel(z, x, y),
        onSelect: (z, x, y) => pickZone(z, { x, y }),
        onReady: () => { svg.classList.add('draw'); resolve(statue); },
      });
      if (api.wantProfile) api.fromProfile();
      on('lite', () => statue.resize());
      mobileMQ.addEventListener('change', e => { statue.o.dragAnywhere = e.matches; });
      addTicker(dt => {
        if (!visible || document.hidden) { bg?.setFocus(0, 0, 0); return; }
        statue.frame(dt);
        if (!statue.hover && state.hoverZone) state.hoverZone = 0;
        const f = updateVit();
        bodyFocus += (((statue.hover || selZone) ? .3 : .2) - bodyFocus) * Math.min(1, dt * 3);
        bg?.setFocus(f.x, f.y, statue.ready ? bodyFocus * statue.fadeV : 0);
      });
    }, 0));
  });
  return api;
}
