// Estado compartido entre módulos + un bus de eventos mínimo.
const listeners = {};

export const state = {
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  coarse: matchMedia('(hover: none)').matches,
  studio: false,
  lite: false,
  gl2: false,
  time: 0,
  lastInput: -10,
  hoverZone: 0, // zona de la estatua bajo el cursor (apaga el rastro del fondo)
  dragging: false, // un componente se está arrastrando: la mesa no recibe rastro ni gotas
  order: { zone: null, size: null, style: null, idea: '', name: '', ref: null, days: [], slots: [] },
};

export function on(ev, fn) { (listeners[ev] ||= []).push(fn); return () => off(ev, fn); }
export function off(ev, fn) { listeners[ev] = (listeners[ev] || []).filter(f => f !== fn); }
export function emit(ev, data) { (listeners[ev] || []).forEach(f => f(data)); }

// bucle único de animación: cada módulo registra su tick
const tickers = new Set();
export function addTicker(fn) { tickers.add(fn); return () => tickers.delete(fn); }
let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  state.time += dt;
  for (const t of tickers) t(dt, now);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// celular: en 760 px o menos el sitio se usa como una app (barra abajo, hojas inferiores, flujo a pantalla completa)
export const mobileMQ = matchMedia('(max-width: 760px)');
export const isMobile = () => mobileMQ.matches;

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// devuelve true mientras el elemento esté cerca del viewport
export function visibility(el, margin = '200px') {
  const v = { on: false };
  new IntersectionObserver(([e]) => { v.on = e.isIntersecting; }, { rootMargin: margin }).observe(el);
  return v;
}

// ejecuta fn una sola vez cuando el elemento se acerca al viewport
export function whenNear(el, fn, margin = '600px') {
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); fn(); } }, { rootMargin: margin });
  io.observe(el);
}
