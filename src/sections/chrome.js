/* Marco del grimorio: la banda grabada de arriba (nombre, capítulos y lámpara), el menú de pantalla completa
   en celular, el lacre "Reservar", la línea de progreso, el cursor y las láminas que aparecen al entrar. */
import config from '../config.js';
import { state, $, $$, esc, emit, on, isMobile } from '../lib/state.js';
import { tattooOnView } from '../lib/tattoo.js';
import { inkTransition, vtSupported, pointOf } from '../lib/vt.js';
import { blotOnView, esquinas, ROMAN } from '../lib/ui.js';
import { PAGES, pathOf, go, currentPage } from '../lib/router.js';

const pageName = p => config.paginas?.[p]?.nombre || p;
export const chapterName = p => config.paginas?.[p]?.pestana || pageName(p);
// número romano + nombre en versalitas
export const chapterLink = (p, attrs = '') => `<a href="${pathOf(p)}" data-go="${p}" ${attrs}><span class="rn">${ROMAN[PAGES.indexOf(p)]}</span><span class="sc">${esc(chapterName(p))}</span></a>`;

/* ---- interruptor de lámpara ---- */
export function initLamp() {
  const set = v => {
    state.studio = v;
    document.documentElement.classList.toggle('studio', v);
    $$('[data-lamp]').forEach(b => {
      b.setAttribute('aria-pressed', v);
      b.setAttribute('aria-label', v ? 'Prender la luz de la mesa' : 'Apagar la luz de la mesa (modo estudio)');
    });
    document.querySelector('meta[name="theme-color"]').content = v ? '#0b0a0c' : '#121114';
    try { localStorage.setItem('tn-studio', v ? '1' : '0'); } catch {}
    emit('studio', v);
  };
  let saved = null;
  try { saved = localStorage.getItem('tn-studio'); } catch {}
  document.addEventListener('click', e => { if (e.target.closest('[data-lamp]')) set(!state.studio); });
  set(saved === '1');
}

/* ---- banda grabada: se esconde al bajar y vuelve al subir o a los 0,9 s de quedarse quieto ---- */
export function initBanda(bg) {
  const bar = $('#banda'), reserve = $('#reserve');
  const marca = $('.marca', bar);
  marca.textContent = config.estudio.nombre;
  marca.href = pathOf('inicio');
  const caps = $('.caps', bar);
  caps.innerHTML = PAGES.map(p => chapterLink(p)).join('');
  on('page', p => caps.querySelectorAll('a').forEach(a => { if (a.dataset.go === p) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }));

  let prev = scrollY, idle = 0;
  addEventListener('scroll', () => {
    const y = scrollY, d = y - prev;
    if (Math.abs(d) < 4) return;
    prev = y;
    const away = d > 0 && y > 90;
    bar.classList.toggle('oculta', away);
    reserve?.classList.toggle('away', away);
    clearTimeout(idle);
    idle = setTimeout(() => { bar.classList.remove('oculta'); reserve?.classList.remove('away'); }, 900);
  }, { passive: true });
  on('page', () => { prev = 0; bar.classList.remove('oculta'); });

  // Reservar (lacre, link del menú y barra de abajo): desde cualquier página lleva al taller de Inicio, con una gota
  // en la mesa; en el celular abre directo el flujo del taller
  $$('[data-reserve]').forEach(a => { if (a.tagName === 'A') a.href = pathOf('inicio') + '#pedido'; });
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-reserve]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;
    e.preventDefault();
    const point = pointOf(e, a);
    bg?.addDrop(point.x, point.y, .7);
    if (isMobile()) { emit('flow-open'); return; }
    const menuOpen = !$('#inkMenu').hidden;
    go('inicio', { to: 'pedido', point, before: menuOpen ? () => document.dispatchEvent(new Event('menu-shut')) : null });
  });
}

/* ---- lacre "Reservar": flota abajo a la derecha y lleva al taller; se oculta mientras el taller está en pantalla ---- */
export function initReserve() {
  const b = $('#reserve');
  b.innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true">
    <defs><radialGradient id="lg" cx="40%" cy="35%"><stop offset="0" stop-color="#8a5ae6"/><stop offset=".6" stop-color="#5b2db0"/><stop offset="1" stop-color="#3a1a78"/></radialGradient>
    <path id="anillo" d="M50 50 m-29 0 a29 29 0 1 1 58 0 a29 29 0 1 1 -58 0"/></defs>
    <path fill="url(#lg)" d="M50 4 C 64 3, 76 9, 86 18 C 97 28, 99 42, 97 54 C 96 67, 90 79, 79 88 C 68 97, 54 99, 41 97 C 28 95, 16 87, 9 75 C 2 63, 2 49, 6 36 C 10 23, 20 12, 32 7 C 37 5, 44 4, 50 4 Z"/>
    <circle cx="50" cy="50" r="37" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="1"/>
    <text font-family="EB Garamond, Georgia, serif" font-size="10" fill="rgba(255,255,255,.9)"><textPath href="#anillo" textLength="178" lengthAdjust="spacing">RESERVAR · TURNO · </textPath></text>
    <path fill="rgba(255,255,255,.9)" d="M50 37 C 47 43, 43 46, 43 51 A 7 7 0 0 0 57 51 C 57 46, 53 43, 50 37 Z"/>
  </svg>`;
  b.setAttribute('data-reserve', '');
  b.setAttribute('data-golpe', '');
  new IntersectionObserver(([e]) => b.classList.toggle('gone', e.isIntersecting), { rootMargin: '-15% 0px -15% 0px' }).observe(document.getElementById('pedido'));
  on('page', p => { if (p !== 'inicio') b.classList.remove('gone'); });
}

/* ---- barra de abajo (celular): lámina negra con filete arriba, los tres capítulos y el lacre chico de Reservar ---- */
const TAB_ICONS = {
  // portada con frontón: Inicio
  inicio: '<path d="M4 9.5 L12 4 L20 9.5 Z M5 20 H19 M6 18 H18 M7.5 18 V10.5 M12 18 V10.5 M16.5 18 V10.5"/>',
  // plumín: el artista
  artista: '<path d="M12 3 L17.5 10.5 L12 21 L6.5 10.5 Z M12 10.5 V15.5"/><circle cx="12" cy="10.5" r="1.3"/>',
  // libro abierto: info
  info: '<path d="M3 6.5 C7 4.6 10 5 12 7 C14 5 17 4.6 21 6.5 V19 C17 17.2 14 17.6 12 19.6 C10 17.6 7 17.2 3 19 Z M12 7 V19.6"/>',
};
export function initTabbar() {
  const bar = $('#tabbar');
  bar.innerHTML = PAGES.map((p, i) => `<a href="${pathOf(p)}" data-go="${p}" class="tb">
      <svg viewBox="0 0 24 24" aria-hidden="true">${TAB_ICONS[p] || ''}</svg>
      <span class="tb-l"><span class="rn">${ROMAN[i]}</span> <span class="sc">${esc(chapterName(p).replace(/^el\s+/i, ''))}</span></span></a>`).join('')
    + `<button type="button" class="tb tb-reserve" data-reserve data-golpe aria-label="Reservar turno: armá tu tatuaje">
      <svg class="lacre" viewBox="0 0 100 100" aria-hidden="true">
        <defs><radialGradient id="lg-tb" cx="40%" cy="35%"><stop offset="0" stop-color="#8a5ae6"/><stop offset=".6" stop-color="#5b2db0"/><stop offset="1" stop-color="#3a1a78"/></radialGradient></defs>
        <path fill="url(#lg-tb)" d="M50 4 C 64 3, 76 9, 86 18 C 97 28, 99 42, 97 54 C 96 67, 90 79, 79 88 C 68 97, 54 99, 41 97 C 28 95, 16 87, 9 75 C 2 63, 2 49, 6 36 C 10 23, 20 12, 32 7 C 37 5, 44 4, 50 4 Z"/>
        <circle cx="50" cy="50" r="36" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="2"/>
        <path fill="rgba(255,255,255,.92)" d="M50 30 C 45 40, 38 45, 38 53 A 12 12 0 0 0 62 53 C 62 45, 55 40, 50 30 Z"/>
      </svg>
      <span class="tb-l"><span class="sc">reservar</span></span></button>`;
  on('page', p => $$('[data-go]', bar).forEach(a => { if (a.dataset.go === p) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }));
}

/* ---- giroscopio (celular): la mesa se mueve al inclinar el teléfono. En iOS hace falta pedir permiso
   con un gesto, así que aparece un botón discreto en la banda ---- */
export function initTilt(bg) {
  if (!bg || state.reduced || typeof DeviceOrientationEvent === 'undefined') return;
  const btn = $('#tiltBtn');
  const needsPermission = typeof DeviceOrientationEvent.requestPermission === 'function';
  if (!needsPermission) { if (state.coarse) bg.enableTilt(); return; }
  if (!state.coarse) return;
  btn.hidden = false;
  btn.onclick = async () => {
    try {
      if (await DeviceOrientationEvent.requestPermission() === 'granted') { bg.enableTilt(); btn.setAttribute('aria-pressed', 'true'); }
    } catch {}
    btn.hidden = true;
  };
}

/* ---- menú de pantalla completa (celular): marco grabado y capítulos grandes ---- */
export function initMenu() {
  const btn = $('#menuBtn'), menu = $('#inkMenu');
  menu.innerHTML = `<div class="menu-marco">${esquinas()}
    <ol>${PAGES.map((p, i) => `<li style="--i:${i}"><a href="${pathOf(p)}" data-page="${p}"><span class="rn">${ROMAN[i]}</span><span class="pn">${esc(pageName(p))}<small class="sc">${esc(config.paginas?.[p]?.resumen || '')}</small></span></a></li>`).join('')}</ol>
    <a class="enlace ink-reserve" href="${pathOf('inicio')}#pedido" data-reserve><span class="t">Reservar turno</span><span class="regla" aria-hidden="true"></span></a>
  </div>`;
  const ICON_OPEN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7 H20 M4 12 H20 M4 17 H20"/></svg>';
  const ICON_CLOSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5 L19 19 M19 5 L5 19"/></svg>';
  const label = v => {
    btn.setAttribute('aria-expanded', v);
    btn.setAttribute('aria-label', v ? 'Cerrar el menú' : 'Abrir el menú de páginas');
    btn.innerHTML = v ? ICON_CLOSE : ICON_OPEN;
  };
  // cierre instantáneo (cuando el cambio de página ya lleva su propia mancha)
  const shut = () => {
    menu.hidden = true;
    menu.classList.remove('open');
    document.documentElement.classList.remove('menu-on');
    label(false);
  };
  document.addEventListener('menu-shut', shut);
  const open = (v, point) => {
    const r = btn.getBoundingClientRect();
    point = point || { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    // con View Transitions, la tinta se abre/cierra desde el punto del clic con forma de mancha
    if (vtSupported()) {
      inkTransition(point, () => {
        menu.hidden = !v;
        menu.classList.toggle('open', v);
        document.documentElement.classList.toggle('menu-on', v);
      }, { close: !v });
      if (v) setTimeout(() => menu.querySelector('a')?.focus({ preventScroll: true }), 450);
    } else if (v) {
      menu.style.setProperty('--cx', point.x + 'px');
      menu.style.setProperty('--cy', point.y + 'px');
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add('open'));
      document.documentElement.classList.add('menu-on');
      setTimeout(() => menu.querySelector('a')?.focus({ preventScroll: true }), 350);
    } else {
      menu.classList.remove('open');
      document.documentElement.classList.remove('menu-on');
      setTimeout(() => { if (!menu.classList.contains('open')) menu.hidden = true; }, state.reduced ? 0 : 600);
    }
    label(v);
  };
  btn.onclick = e => open(menu.hidden || !menu.classList.contains('open'), pointOf(e, btn));
  menu.addEventListener('click', e => {
    const a = e.target.closest('a[data-page]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    const p = a.dataset.page, point = pointOf(e, a);
    // misma página: se cierra el menú y vuelve arriba; otra página: el menú se va dentro de la misma mancha
    if (p === currentPage()) { open(false, point); setTimeout(() => go(p), vtSupported() ? 80 : 250); }
    else go(p, { point, before: shut });
  });
  on('page', p => menu.querySelectorAll('a[data-page]').forEach(a => a.toggleAttribute('aria-current', a.dataset.page === p)));
  // en escritorio los capítulos están en la banda: si se agranda la ventana con el menú abierto, se cierra
  matchMedia('(min-width: 761px)').addEventListener('change', e => { if (e.matches && !menu.hidden) shut(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('open')) { open(false); btn.focus(); } });
}

/* ---- línea de progreso: trazo de tinta vertical que se llena con el scroll de la página actual ---- */
export function initProgress() {
  const svg = $('.progress svg');
  let d = 'M6 0';
  for (let y = 40; y <= 1000; y += 40) d += ` Q ${6 + Math.sin(y * .07) * 2.2} ${y - 20} ${6 + Math.sin(y * .13) * 1.4} ${y}`;
  $('.track', svg).setAttribute('d', d);
  const fill = $('.fill', svg);
  fill.setAttribute('d', d);
  const len = fill.getTotalLength();
  fill.style.strokeDasharray = len;
  const prog = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    fill.style.strokeDashoffset = len * (1 - (max > 0 ? scrollY / max : 0));
  };
  addEventListener('scroll', prog, { passive: true });
  addEventListener('resize', prog);
  on('page', prog);
  prog();
}

/* ---- cursor: punto de tinta sobre la mesa, aro punteado sobre lo arrastrable, aro lleno sobre botones.
   Sobre las láminas negras se vuelve hueso. ---- */
export function initCursor() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const c = $('#cursor');
  document.documentElement.classList.add('has-cursor');
  let x = -100, y = -100, tx = -100, ty = -100, shown = false;
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    tx = e.clientX; ty = e.clientY;
    if (!shown) { shown = true; x = tx; y = ty; c.classList.add('on'); }
    const t = e.target;
    const mode = t.closest?.('input,textarea') ? 'text'
      : t.closest?.('#st,.st-mini,.book,.body-map svg,.portrait canvas,.dial,.dia,.ruler,.ficha.front') ? 'hand'
      : t.closest?.('a,button,[role="slider"],label,summary') ? 'seal' : 'ink';
    if (c.dataset.mode !== mode) c.dataset.mode = mode;
    c.classList.toggle('light', !!t.closest?.('.lamina,.banda,.ink-menu,.placa,dialog') && !t.closest?.('.pg:not(.cover)'));
  }, { passive: true });
  addEventListener('pointerdown', () => c.classList.add('down'));
  addEventListener('pointerup', () => c.classList.remove('down'));
  document.addEventListener('pointerleave', () => { c.classList.remove('on'); shown = false; });
  const loop = () => { x += (tx - x) * .35; y += (ty - y) * .35; c.style.transform = `translate(${x}px,${y}px)`; requestAnimationFrame(loop); };
  loop();
}

/* ---- láminas que aparecen al entrar + títulos tatuados + pincelada entre secciones ---- */
export function initObjects(bg) {
  const objs = $$('.lamina:not(.portada)');
  if (state.reduced) objs.forEach(o => o.classList.add('placed'));
  else {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('placed'); io.unobserve(e.target); } }), { threshold: .08 });
    objs.forEach(o => io.observe(o));
  }
  $$('.cab h2').forEach(h => tattooOnView(h));
  blotOnView();
  // una pincelada barre la mesa cada vez que se entra en una sección nueva bajando
  let last = 0, prev = scrollY, down = true;
  addEventListener('scroll', () => { down = scrollY >= prev; prev = scrollY; }, { passive: true });
  const io2 = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting && down && performance.now() - last > 1400) { last = performance.now(); bg?.sweep(); }
  }), { rootMargin: '0px 0px -55% 0px' });
  $$('main .page > section').filter(s => s.id !== 'hero' && !s.classList.contains('chapter')).forEach(s => io2.observe(s));
}

/* ---- títulos con tinta corrida: al pasar el mouse la tinta se expande apenas ---- */
export function initInkTitles() {
  const f = document.getElementById('inkbleed-hover');
  if (!f) return;
  const disp = f.querySelector('feDisplacementMap'), morph = f.querySelector('feMorphology');
  let cur = 0, target = 0, raf = 0, el = null;
  const tick = () => {
    cur += (target - cur) * .16;
    disp.setAttribute('scale', (2.2 + cur * 3.2).toFixed(2));
    morph.setAttribute('radius', (.3 + cur * .55).toFixed(2));
    if (Math.abs(target - cur) > .01) raf = requestAnimationFrame(tick);
    else { raf = 0; if (!target && el) { el.classList.remove('ink-hover'); el = null; } }
  };
  const go = (node, v) => {
    if (v) { if (el && el !== node) el.classList.remove('ink-hover'); el = node; node.classList.add('ink-hover'); }
    target = v;
    if (!raf) raf = requestAnimationFrame(tick);
  };
  document.querySelectorAll('.cab h2, .hero-placa h1, .portada h1').forEach(h => {
    h.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && !state.reduced) go(h, 1); });
    h.addEventListener('pointerleave', () => go(h, 0));
  });
}
