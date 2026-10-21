// Piezas de interfaz compartidas del grimorio: láminas con esquinas grabadas, cabeceras y divisores.
import { esc, state } from './state.js';

export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
export function roman(n) {
  if (n >= 1 && n <= 12) return ROMAN[n - 1];
  if (!(n > 0 && n < 4000)) return String(n);
  let r = '';
  for (const [v, s] of [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]) while (n >= v) { r += s; n -= v; }
  return r;
}

// las cuatro esquinas grabadas de una lámina
export const esquinas = () => ['tl', 'tr', 'bl', 'br'].map(c => `<svg class="esq ${c}" aria-hidden="true"><use href="#esquina"/></svg>`).join('');
// divisor con la hoja en el centro
export const divisor = (cls = '') => `<div class="divisor ${cls}" aria-hidden="true"><svg viewBox="0 0 46 18"><use href="#hoja"/></svg></div>`;

/* cabecera centrada de lámina: etiqueta en versalitas, título en Pirata One, divisor y bajada en itálica */
export const cab = (eti, titulo, baj, { tag = 'h2' } = {}) => `<header class="cab">
  ${eti ? `<p class="eti sc">${esc(eti)}</p>` : ''}
  <${tag}>${esc(titulo)}</${tag}>
  ${divisor()}
  ${baj ? `<p class="baj blot">${rich(baj)}</p>` : ''}
</header>`;

// texto de la config con palabras marcadas ==así== → subrayado fino hueso (máximo 3 por bloque)
export function rich(text) {
  let n = 0;
  return esc(text).replace(/==(.+?)==/g, (_, w) => (++n <= 3 ? `<span class="marcar">${w}</span>` : w));
}
export const plain = text => String(text ?? '').replace(/==(.+?)==/g, '$1');

// revelado con mancha de tinta: el bloque entero aparece por una máscara que se abre (~0,6 s)
export function blotIn(el, delay = 0) {
  if (!el) return;
  if (state.reduced) { el.classList.add('blot-on'); return; }
  el.classList.remove('blot-on');
  void el.offsetWidth;
  el.style.setProperty('--blot-d', delay + 's');
  el.classList.add('blot-on');
}
export function blotOnView(root = document) {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { io.unobserve(e.target); blotIn(e.target, .1); }
  }), { threshold: .35 });
  root.querySelectorAll('.blot:not([data-blot-manual])').forEach(el => io.observe(el));
}

/* arrastres de componentes (fichas, cuaderno, dial, regla, retrato): la mesa del fondo no se entera.
   Se llama en el pointerdown del componente; mientras dura, la mesa no recibe rastro ni gotas. */
export function grab(e, el = e.currentTarget) {
  e.stopPropagation();
  try { el.setPointerCapture(e.pointerId); } catch {}
  state.dragging = true;
  const end = ev => {
    if (ev.pointerId !== e.pointerId) return;
    state.dragging = false;
    removeEventListener('pointerup', end, true);
    removeEventListener('pointercancel', end, true);
  };
  addEventListener('pointerup', end, true);
  addEventListener('pointercancel', end, true);
}
