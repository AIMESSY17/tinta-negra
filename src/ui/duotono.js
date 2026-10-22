/* Duotono "flashero" para las fotos con piel: filtro SVG (grises + gradient map) armado con los tokens de color.
   Las fotos se ven en blanco y negro; el duotono es una segunda capa encima (img.duo) que aparece por opacidad
   al pasar el mouse o tocar. El filtro de esa capa nunca se anima.
   Día: el tatuaje queda en tinta y la piel y el fondo pasan a violeta stencil brillante.
   Noche: al revés, como el modo noche: el tatuaje en trazo claro (hueso) y la piel en violeta profundo.
   Los bocetos no lo usan. Si una imagen no tiene `tipo` en config.js, se detecta por su saturación. */
import { on } from '../lib/state.js';

const NS = 'http://www.w3.org/2000/svg';
let funcs = null;

const rgb = v => {
  const c = document.createElement('canvas').getContext('2d');
  c.fillStyle = v.trim(); const h = c.fillStyle; // normaliza a #rrggbb
  return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
};
const mezcla = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);

function pintar() {
  const cs = getComputedStyle(document.documentElement);
  const tinta = rgb(cs.getPropertyValue('--tinta')), stencil = rgb(cs.getPropertyValue('--stencil'));
  const negro = rgb(cs.getPropertyValue('--sobre-stencil'));
  const noche = document.documentElement.classList.contains('noche');
  // paradas del gradient map, de la sombra (0) a la luz (1)
  const paradas = noche
    ? [mezcla(mezcla(tinta, stencil, .35), [0, 0, 0], .18), mezcla(stencil, [0, 0, 0], .5), mezcla(stencil, [0, 0, 0], .68), mezcla(stencil, [0, 0, 0], .8), negro]
    : [tinta, mezcla(tinta, stencil, .45), stencil, mezcla(stencil, [1, 1, 1], .42), mezcla(stencil, [1, 1, 1], .68)];
  funcs.forEach((fn, k) => fn.setAttribute('tableValues', paradas.map(p => p[k].toFixed(3)).join(' ')));
}

export function initDuotono() {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  svg.innerHTML = `<filter id="duo" color-interpolation-filters="sRGB">
    <feColorMatrix type="matrix" values=".299 .587 .114 0 0  .299 .587 .114 0 0  .299 .587 .114 0 0  0 0 0 1 0"/>
    <feComponentTransfer><feFuncR type="linear" slope="1.15" intercept="-.05"/><feFuncG type="linear" slope="1.15" intercept="-.05"/><feFuncB type="linear" slope="1.15" intercept="-.05"/></feComponentTransfer>
    <feComponentTransfer><feFuncR type="table"/><feFuncG type="table"/><feFuncB type="table"/></feComponentTransfer>
  </filter>`;
  document.body.append(svg);
  funcs = [...svg.querySelectorAll('feComponentTransfer:last-child > *')];
  pintar();
  on('noche', pintar);

  // respaldo: si una foto no tiene tipo, se decide al cargarla por la saturación promedio
  document.addEventListener('load', e => {
    const im = e.target;
    if (im.tagName !== 'IMG' || !im.closest('[data-detectar]')) return;
    const cont = im.closest('[data-detectar]');
    cont.removeAttribute('data-detectar');
    if (esFoto(im)) { cont.classList.add('foto'); im.insertAdjacentHTML('afterend', capaDuo(im.currentSrc || im.src, 'eager')); }
  }, true);

  initToqueFotos();
}

/* Fotos: en reposo en blanco y negro; con el mouse encima (CSS :hover) o al tocarlas, el duotono.
   Táctil: el color aparece al apoyar el dedo y queda 1,5 s después de soltar. Si el dedo se desplaza
   (scroll), no se colorea. Nunca se llama a preventDefault: el toque sigue abriendo la obra o la hoja. */
const FOTO = '.obra.foto,.carrusel figure.foto';
function initToqueFotos() {
  let t = null;
  const prender = el => { clearTimeout(el._apagar); el.classList.add('color'); };
  const apagar = (el, ms = 0) => { clearTimeout(el._apagar); el._apagar = setTimeout(() => el.classList.remove('color'), ms); };
  const cortar = () => { if (!t) return; clearTimeout(t.tm); if (t.prendio) apagar(t.el); t = null; };
  document.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') return;
    const el = e.target.closest?.(FOTO); if (!el) return;
    cortar();
    // una espera muy corta antes de colorear: si en ese tiempo el dedo arranca un scroll, no pasa nada
    t = { el, id: e.pointerId, x: e.clientX, y: e.clientY, prendio: false };
    t.tm = setTimeout(() => { if (t?.el === el) { t.prendio = true; prender(el); } }, 90);
  }, { passive: true });
  document.addEventListener('pointermove', e => {
    if (t && e.pointerId === t.id && Math.hypot(e.clientX - t.x, e.clientY - t.y) > 10) cortar();
  }, { passive: true });
  // el navegador cancela el puntero cuando empieza un scroll
  document.addEventListener('pointercancel', e => { if (t && e.pointerId === t.id) cortar(); }, { passive: true });
  document.addEventListener('pointerup', e => {
    if (!t || e.pointerId !== t.id) return;
    const el = t.el; clearTimeout(t.tm); t = null;
    prender(el); apagar(el, 1500);
  }, { passive: true });
}

// segunda capa de una foto: la misma imagen con el duotono, encima y transparente
export const capaDuo = (url, carga = 'lazy') => `<img class="duo" src="${url}" alt="" aria-hidden="true" loading="${carga}" decoding="async">`;

export function esFoto(im) {
  try {
    const c = document.createElement('canvas'); c.width = c.height = 24;
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0, 24, 24);
    const d = x.getImageData(0, 0, 24, 24).data; let s = 0;
    for (let i = 0; i < d.length; i += 4) { const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]); s += mx ? (mx - mn) / mx : 0; }
    return s / (d.length / 4) > .12;
  } catch (_) { return false; }
}

// clase para una obra según su tipo (sin tipo: se detecta al cargar)
export const claseTipo = tipo => (tipo === 'foto' ? ' foto' : '');
export const attrTipo = tipo => (tipo ? '' : ' data-detectar');
