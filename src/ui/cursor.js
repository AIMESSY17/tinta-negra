/* Cursor propio (recuperado de la versión anterior): anillo fino con un punto en el centro.
   Solo en escritorio con mouse. Se mueve en el mismo requestAnimationFrame que el fondo, con la última
   posición del pointermove y sin suavizado, así no queda atrás de la mano.
   Estados: normal sobre la mesa · más chico y relleno mientras se arrastra · más grande sobre links,
   botones, obras y zonas de la estatua · oculto sobre campos de texto (ahí vuelve el cursor de texto). */
import { addTicker } from '../lib/state.js';

const TEXTO = 'input,textarea,select,[contenteditable]';
const LINK = 'a,button,summary,label,[role=button],.obra,.retrato,.zona,.chip';
// sobre fondos de tinta el anillo pasa al color del papel
const OSCURO = '.btn.solido,.reservar-top,.cab .n,.pie-obra,figcaption,.zona[aria-pressed="true"],.chip[aria-pressed="true"],.tabbar .res';

export function initCursor() {
  if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  const c = document.createElement('div');
  c.id = 'cursor'; c.setAttribute('aria-hidden', 'true');
  document.body.append(c);
  document.documentElement.classList.add('has-cursor');

  let x = -100, y = -100, px = null, py = null, modo = '', claro = false, visible = false, objetivo = null;
  const ponerModo = t => {
    // la estatua marca sus zonas con cursor "pointer" en el propio canvas
    const m = t.closest?.(TEXTO) ? 'texto' : (t.closest?.(LINK) || (t.tagName === 'CANVAS' && t.style.cursor === 'pointer')) ? 'link' : '';
    if (m !== modo) { modo = m; c.dataset.modo = m; }
  };
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    if (!visible) { visible = true; c.classList.add('on'); }
    const t = objetivo = e.target;
    ponerModo(t);
    const k = !!t.closest?.(OSCURO);
    if (k !== claro) { claro = k; c.classList.toggle('claro', k); }
  }, { passive: true });
  addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') c.classList.add('down'); }, { passive: true });
  addEventListener('pointerup', () => c.classList.remove('down'), { passive: true });
  // fuera de la ventana se oculta
  document.addEventListener('mouseout', e => { if (!e.relatedTarget) { visible = false; c.classList.remove('on'); } });
  addEventListener('blur', () => { visible = false; c.classList.remove('on'); });

  addTicker(() => {
    // sobre la estatua, la zona se calcula en el frame: se vuelve a mirar aunque el mouse esté quieto
    if (objetivo?.tagName === 'CANVAS') ponerModo(objetivo);
    if (x === px && y === py) return;
    px = x; py = y;
    c.style.transform = `translate3d(${x}px,${y}px,0)`;
  }, 2);
}
