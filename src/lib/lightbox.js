// Visor de trabajos: cada trabajo tiene su URL (#trabajo/brazos-03), botón Compartir,
// Atrás del navegador lo cierra y se abre/cierra con una mancha de tinta (View Transitions).
import { state } from './state.js';
import { inkTransition } from './vt.js';
import { ensurePage } from './router.js';
import { enlace } from './buttons.js';
import { esquinas } from './ui.js';

let dlg, img, cap, shareBtn, list = [], idx = 0, pushed = false, lastPoint = null;
const collections = {}, pageOf = {};
const PREFIX = '#trabajo/';

// cada colección (zonas del cuerpo, láminas) se registra con su prefijo y la página donde vive
export function registerWorks(prefix, getItems, page) { collections[prefix] = getItems; pageOf[prefix] = page; }
export const workId = (prefix, i) => `${prefix}-${String(i + 1).padStart(2, '0')}`;

function build() {
  dlg = document.createElement('dialog');
  dlg.className = 'lightbox';
  dlg.innerHTML = `<figure>${esquinas()}<img alt=""><figcaption></figcaption></figure>
    <div class="lb-nav">
      ${enlace('anterior', { 'data-d': '-1', 'aria-label': 'Trabajo anterior' }, { back: true })}
      ${enlace('Compartir', { 'data-share': '' })}
      ${enlace('Cerrar', { 'data-close': '' })}
      ${enlace('siguiente', { 'data-d': '1', 'aria-label': 'Trabajo siguiente' })}
    </div>`;
  document.body.appendChild(dlg);
  img = dlg.querySelector('img');
  cap = dlg.querySelector('figcaption');
  shareBtn = dlg.querySelector('[data-share]');
  dlg.addEventListener('click', e => {
    if (e.target === dlg || e.target.closest('[data-close]')) close(e);
    const d = e.target.closest('[data-d]');
    if (d) show(idx + +d.dataset.d);
    if (e.target.closest('[data-share]')) share();
  });
  dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });
  dlg.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') show(idx - 1); if (e.key === 'ArrowRight') show(idx + 1); });
  // deslizar de costado en celular, en cualquier parte del trabajo; la imagen nueva entra desde ese lado
  const fig = dlg.querySelector('figure');
  let sw = null;
  fig.addEventListener('pointerdown', e => { sw = { x: e.clientX, y: e.clientY, id: e.pointerId }; });
  fig.addEventListener('pointerup', e => {
    if (!sw || sw.id !== e.pointerId) return;
    const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
    sw = null;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    const d = dx < 0 ? 1 : -1;
    show(idx + d);
    if (!state.reduced) img.animate([{ transform: `translateX(${d * 40}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 300, easing: 'cubic-bezier(.2, .7, .2, 1)' });
  });
  fig.addEventListener('pointercancel', () => { sw = null; });
}

function show(i) {
  idx = (i + list.length) % list.length;
  const it = list[idx];
  img.src = it.src;
  img.alt = it.alt;
  cap.textContent = `${it.alt} · ${idx + 1} de ${list.length}`;
  shareBtn.querySelector('.t').textContent = 'Compartir';
  if (it.id) history.replaceState(history.state, '', PREFIX + it.id);
}

export function openLightbox(items, i = 0, point = null) {
  if (!dlg) build();
  list = items;
  lastPoint = point;
  const id = items[i]?.id;
  if (id && location.hash !== PREFIX + id) { history.pushState({ lb: 1 }, '', PREFIX + id); pushed = true; }
  inkTransition(point, () => { show(i); if (!dlg.open) dlg.showModal(); });
}

function closeNow() {
  if (!dlg?.open) return;
  inkTransition(lastPoint, () => dlg.close(), { close: true });
}

function close() {
  if (pushed) { pushed = false; history.back(); return; } // popstate cierra
  closeNow();
  if (location.hash.startsWith(PREFIX)) history.replaceState(history.state, '', location.pathname + location.search);
}

async function share() {
  const url = location.href;
  const it = list[idx];
  try {
    if (navigator.share && state.coarse) { await navigator.share({ title: document.title, text: it.alt, url }); return; }
    await navigator.clipboard.writeText(url);
    shareBtn.querySelector('.t').textContent = 'Link copiado';
  } catch {
    shareBtn.querySelector('.t').textContent = 'No se pudo copiar';
  }
}

// abre un trabajo por su id (p. ej. "brazos-03")
export function openWork(id) {
  const m = /^(.+)-(\d+)$/.exec(id || '');
  if (!m || !collections[m[1]]) return false;
  const items = collections[m[1]]();
  const i = +m[2] - 1;
  if (!items[i]) return false;
  ensurePage(pageOf[m[1]]);
  openLightbox(items, i);
  return true;
}

addEventListener('popstate', () => {
  if (location.hash.startsWith(PREFIX)) {
    if (!dlg?.open) { pushed = false; openWork(location.hash.slice(PREFIX.length)); }
  } else { pushed = false; closeNow(); }
});

// al abrir el sitio con un link a un trabajo
export function openFromHash() {
  if (!location.hash.startsWith(PREFIX)) return false;
  const ok = openWork(decodeURIComponent(location.hash.slice(PREFIX.length)));
  if (!ok) history.replaceState(history.state, '', location.pathname + location.search);
  return ok;
}
