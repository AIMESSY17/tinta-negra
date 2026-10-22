// Tres páginas en el mismo documento: / (Inicio), /artista y /info, con History API.
// El fondo y la estatua nunca se recargan: solo se muestra otra .page dentro de <main>.
import config from '../config.js';
import { state, emit, $$ } from './state.js';
import { inkTransition, pointOf } from './vt.js';

export const PAGES = ['inicio', 'artista', 'info'];
// links viejos de una sola página (#preguntas, #artista…) → su página nueva
const LEGACY = { artista: 'artista', estilos: 'artista', portafolio: 'artista', proceso: 'info', cuidados: 'info', preguntas: 'info' };

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
const pageEl = p => document.querySelector(`.page[data-page="${p}"]`);

function setTitle(p) {
  const base = `${config.estudio.nombre} · ${config.estudio.bajada}`;
  document.title = p === 'inicio' ? base : `${config.paginas?.[p]?.nombre || p} · ${config.estudio.nombre}`;
}

function irA(id) {
  const el = id && document.getElementById(id);
  if (el) scrollTo({ top: el.getBoundingClientRect().top + scrollY - 70, behavior: 'instant' });
}

function swap(p, to) {
  for (const id of PAGES) pageEl(id).hidden = id !== p;
  state.page = p;
  document.documentElement.dataset.page = p;
  setTitle(p);
  $$('[data-nav]').forEach(a => {
    const on = a.dataset.nav === p;
    a.classList.toggle('on', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  scrollTo({ top: 0, behavior: 'instant' });
  if (to) irA(to);
  emit('page', p);
}

/* ir a una página (y opcionalmente a una sección), con la mancha de tinta desde el punto del clic */
export function go(p, { to, replace, point, sinTinta } = {}) {
  if (!PAGES.includes(p)) p = 'inicio';
  if (p === state.page) {
    if (to) return saltar(to, point);
    return sinTinta ? scrollTo({ top: 0, behavior: 'instant' }) : inkTransition(point, () => scrollTo({ top: 0, behavior: 'instant' }));
  }
  const url = pathOf(p);
  if (replace) history.replaceState({ page: p }, '', url); else history.pushState({ page: p }, '', url);
  if (sinTinta) swap(p, to); else inkTransition(point, () => swap(p, to));
}

/* saltar a una sección de la página actual: la mancha tapa el salto (sin scroll suave) */
export function saltar(id, point) {
  const el = document.getElementById(id); if (!el) return;
  inkTransition(point, () => irA(id));
}

export function initRouter() {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  $$('[data-go]').forEach(a => { if (a.tagName === 'A') a.href = pathOf(a.dataset.go) + (a.dataset.to ? '#' + a.dataset.to : ''); });
  let p = pageOfPath(location.pathname);
  const h = location.hash.slice(1);
  let to = null;
  if (h && LEGACY[h]) { p = LEGACY[h]; to = h; } else if (h && document.getElementById(h)) to = h;
  history.replaceState({ page: p }, '', pathOf(p) + (to && !LEGACY[h] ? '#' + to : ''));
  swap(p);
  if (to) requestAnimationFrame(() => irA(to));

  addEventListener('popstate', () => {
    const np = pageOfPath(location.pathname);
    if (np !== state.page) inkTransition(null, () => swap(np));
  });

  document.addEventListener('click', e => {
    const a = e.target.closest('[data-go]');
    if (!a || e.defaultPrevented || a.hasAttribute('data-taller')) return; // los botones del taller se manejan aparte
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button > 0) return; // pestaña nueva: link real
    e.preventDefault();
    go(a.dataset.go, { to: a.dataset.to, point: pointOf(e, a) });
  });
  // anclas dentro de la página (Ver trabajos): scroll nativo, sin cambiar la URL
  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-ancla]');
    if (!a || e.defaultPrevented) return;
    e.preventDefault();
    saltar(a.getAttribute('href').slice(1), pointOf(e, a));
  });
  return p;
}
