// Botones del grimorio. El violeta solo aparece como la salpicadura que deja un botón principal al tocarlo.
// - Principal (.grabado): filete doble con rombos a los costados, Pirata One; al hover se invierte.
// - Secundario (.enlace): versalitas y una raya que se alarga al pasar.
import { state, esc } from './state.js';

const FLECHA = '<svg viewBox="0 0 30 12" aria-hidden="true"><path d="M1 6 H27 M21 1 L28 6 L21 11"/></svg>';
const attrs = a => Object.entries(a || {}).filter(([, v]) => v != null && v !== false).map(([k, v]) => (v === true ? k : `${k}="${esc(v)}"`)).join(' ');
const tagOf = a => (a.href ? 'a' : 'button');
const typeOf = (tag, a) => (tag === 'button' && !a.type ? { type: 'button' } : {});

/* principal: <a> si lleva href, <button> si no */
export function grabado(label, a = {}, { arrow = true, chico = false, cls = '' } = {}) {
  const tag = tagOf(a);
  return `<${tag} class="grabado ${chico ? 'chico' : ''} ${cls}" data-golpe ${attrs({ ...typeOf(tag, a), ...a })}><span class="t">${esc(label)}</span>${arrow ? FLECHA : ''}</${tag}>`;
}

/* secundario: la raya va adelante (back) o atrás */
export function enlace(label, a = {}, { back = false, cls = '', tag } = {}) {
  const t = tag || tagOf(a);
  const raya = `<span class="regla${back ? ' atras' : ''}" aria-hidden="true"></span>`;
  return `<${t} class="enlace ${cls}" ${attrs({ ...(t === 'button' ? typeOf(t, a) : {}), ...a })}>${back ? raya : ''}<span class="t">${esc(label)}</span>${back ? '' : raya}</${t}>`;
}

/* chip: recuadro con filete fino; el activo, con outline doble */
export const chip = (label, a = {}, extra = '') => `<button type="button" class="chip" ${attrs(a)}><span class="t">${esc(label)}</span>${extra}</button>`;

/* salpicadura de tinta violeta que se seca a negro, en el punto del golpe */
export function salpicar(x, y) {
  if (state.reduced) return;
  const ns = 'http://www.w3.org/2000/svg', s = document.createElementNS(ns, 'svg');
  s.setAttribute('viewBox', '-60 -60 120 120');
  s.setAttribute('aria-hidden', 'true');
  s.classList.add('salpicadura');
  s.style.left = x + 'px';
  s.style.top = y + 'px';
  let d = '';
  const n = 11;
  for (let i = 0; i <= n; i++) {
    const a = i / n * Math.PI * 2, r = (i % 2 ? 12 : 19) + Math.random() * 9;
    d += (i ? 'L' : 'M') + (Math.cos(a) * r).toFixed(1) + ' ' + (Math.sin(a) * r).toFixed(1);
  }
  d += 'Z';
  for (let k = 0; k < 7; k++) {
    const a = Math.random() * Math.PI * 2, r = 28 + Math.random() * 22, rr = 2 + Math.random() * 3.5;
    d += `M${(Math.cos(a) * r + rr).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)} a${rr} ${rr} 0 1 0 ${-2 * rr} 0 a${rr} ${rr} 0 1 0 ${2 * rr} 0`;
  }
  const p = document.createElementNS(ns, 'path');
  p.setAttribute('d', d);
  s.appendChild(p);
  document.body.appendChild(s);
  s.animate([{ transform: 'scale(.2)', opacity: 1 }, { transform: 'scale(1) rotate(20deg)', opacity: .95, offset: .25 }, { transform: 'scale(1.05) rotate(24deg)', opacity: 0 }],
    { duration: 1300, easing: 'cubic-bezier(.2,.8,.3,1)' });
  setTimeout(() => { p.style.fill = '#141317'; }, 300);
  setTimeout(() => s.remove(), 1350);
}

export function initButtons() {
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-golpe]');
    if (!b) return;
    const r = b.getBoundingClientRect();
    salpicar(e.clientX || r.left + r.width / 2, e.clientY || r.top + r.height / 2);
    try { navigator.vibrate?.(16); } catch {}
  });
}
