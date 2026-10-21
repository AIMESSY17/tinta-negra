// Tres páginas en el mismo documento: / (Inicio), /artista y /info, con History API.
// El fondo (mesa y estatua) nunca se recarga: solo se muestra otra .page dentro de <main>.
// El cambio usa la mancha de tinta de las View Transitions desde el punto del clic;
// sin soporte, la pincelada del fondo barre la mesa.
import config from '../config.js';
import { state, emit, isMobile } from './state.js';
import { inkTransition, pointOf } from './vt.js';

export const PAGES = ['inicio', 'artista', 'info'];
// links viejos de una sola página (#estilos, #preguntas…) → su página nueva
const LEGACY = { hero: 'inicio', pedido: 'inicio', cierre: 'inicio', artista: 'artista', estilos: 'artista', proceso: 'info', cuidados: 'info', preguntas: 'info', resenas: 'info' };

// raíz del sitio (funciona también publicado en una subcarpeta)
const ROOT = (() => {
  const p = location.pathname.replace(/index\.html$/, '').replace(/\/(artista|info)\/?$/, '/');
  return p.endsWith('/') ? p : p + '/';
})();
export const pathOf = page => ROOT + (page === 'inicio' ? '' : page);
const pageOfPath = path => {
  const seg = path.slice(ROOT.length).replace(/index\.html$/, '').replace(/\/+$/, '');
  return PAGES.includes(seg) ? seg : 'inicio';
};

let current = null, bg = null;
const pageEl = p => document.querySelector(`.page[data-page="${p}"]`);
export const currentPage = () => current;

function setTitle(p) {
  const base = `${config.estudio.nombre} · ${config.estudio.bajada}`;
  document.title = p === 'inicio' ? base : `${config.paginas?.[p]?.nombre || p} · ${config.estudio.nombre}`;
}

// muestra la página (sin transición) y la deja arriba de todo
function swap(p, to) {
  for (const id of PAGES) pageEl(id).hidden = id !== p;
  current = p;
  document.documentElement.dataset.page = p;
  setTitle(p);
  scrollTo({ top: 0, behavior: 'instant' });
  if (to) jumpTo(to, true);
  bg?.syncScroll?.();
  emit('page', p);
}

// deja lugar para la cinta de arriba (vuelve a aparecer al quedarse quieto)
const targetY = el => el.getBoundingClientRect().top + scrollY - (isMobile() ? 70 : 84);
function jumpTo(id, instant) {
  const el = typeof id === 'string' ? document.getElementById(id) : id;
  if (!el) return Promise.resolve();
  const head = el.querySelector('.lamina') || el;
  const y = Math.max(0, targetY(head));
  if (instant || state.reduced) { scrollTo({ top: y, behavior: 'instant' }); return Promise.resolve(); }
  scrollTo({ top: y, behavior: 'smooth' });
  // avisa cuando termina el scroll suave (scrollend o, si no existe, cuando se queda quieto)
  return new Promise(res => {
    let t = 0, done = false;
    const end = () => { if (done) return; done = true; removeEventListener('scrollend', end); removeEventListener('scroll', still); res(); };
    const still = () => { clearTimeout(t); t = setTimeout(end, 140); };
    addEventListener('scrollend', end, { once: true });
    addEventListener('scroll', still, { passive: true });
    still();
    setTimeout(end, 2200);
  });
}

/* Ir a una página (y opcionalmente a una sección de esa página).
   opts: point (origen de la mancha), to (id de sección), before (se ejecuta dentro del cambio), replace */
export function go(p, opts = {}) {
  if (!PAGES.includes(p)) p = 'inicio';
  if (p === current) {
    opts.before?.();
    return opts.to ? jumpTo(opts.to) : (scrollTo({ top: 0, behavior: state.reduced ? 'instant' : 'smooth' }), Promise.resolve());
  }
  const url = pathOf(p) + (opts.keepHash ? location.hash : '');
  if (opts.replace) history.replaceState({ page: p }, '', url); else history.pushState({ page: p }, '', url);
  return show(p, opts);
}

function show(p, { point, to, before } = {}) {
  const t = inkTransition(point, () => { before?.(); swap(p, to); });
  if (!t) { bg?.sweep(); return Promise.resolve(); }
  return t.finished.catch(() => {});
}

// el visor de trabajos pide su página antes de abrirse (p. ej. #trabajo/lamina-05 en /)
export function ensurePage(p) {
  if (!p || p === current) return;
  history.replaceState({ page: p }, '', pathOf(p) + location.hash);
  swap(p);
}

export function goSection(id) { return jumpTo(id); }

export function initRouter(background) {
  bg = background;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  let p = pageOfPath(location.pathname);
  // /#preguntas (link viejo) → /info#preguntas
  const h = location.hash.slice(1);
  let to = null;
  if (h && LEGACY[h]) { p = LEGACY[h]; to = h === 'hero' ? null : h; }
  // normaliza la URL (/artista/ → /artista) sin recargar
  history.replaceState({ page: p }, '', pathOf(p) + (to ? '' : location.hash));
  swap(p);
  if (to) setTimeout(() => jumpTo(to, true), 60);

  addEventListener('popstate', () => {
    const np = pageOfPath(location.pathname);
    if (np !== current) show(np);
  });

  // cualquier link o botón con data-go="pagina" (y data-to="seccion")
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-go]');
    if (!a || e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button > 0) return; // pestaña nueva: link real
    e.preventDefault();
    // en el celular, "Armá tu tatuaje" abre el flujo del taller a pantalla completa (desde cualquier página)
    if (a.dataset.to === 'pedido' && isMobile()) { emit('flow-open'); return; }
    go(a.dataset.go, { to: a.dataset.to, point: pointOf(e, a) });
  });
  return p;
}
