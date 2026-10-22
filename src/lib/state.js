// Estado compartido entre módulos, bus de eventos mínimo y bucle único de animación.
const listeners = {};

export const state = {
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  touch: matchMedia('(hover: none)').matches,
  studio: false, // modo noche
  time: 0,
  lastInput: -10,
  page: null,
};

export function on(ev, fn) { (listeners[ev] ||= []).push(fn); return () => { listeners[ev] = listeners[ev].filter(f => f !== fn); }; }
export function emit(ev, data) { (listeners[ev] || []).forEach(f => f(data)); }

// cada módulo registra su tick; un solo requestAnimationFrame para todo el sitio
const tickers = [];
export function addTicker(fn, order = 0) { tickers.push({ fn, order }); tickers.sort((a, b) => a.order - b.order); }
let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  state.time += dt;
  for (const t of tickers) t.fn(dt, now);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// título gótico gigante con su calco violeta; "\n" corta la línea
export function mega(tag, texto, attrs = '') {
  const t = esc(texto).replace(/\n/g, '&#10;');
  const pre = texto.includes('\n') ? ' style="white-space:pre"' : '';
  return `<${tag} class="mega" data-t="${t}"${pre}${attrs ? ' ' + attrs : ''}>${t}</${tag}>`;
}
