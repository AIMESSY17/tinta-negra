/* Hoja de trabajos: bottom sheet en celular (manija, título y cantidad, carrusel con scroll-snap,
   se cierra deslizando hacia abajo, con la ×, con Esc o tocando el velo) y panel lateral en escritorio.
   La usan la estatua (trabajos de una zona) y el portafolio (visor de una obra). */
import { $, esc } from '../lib/state.js';
import { capaDuo } from './duotono.js';

const hoja = $('#hoja'), velo = $('#velo'), carrusel = $('#carrusel'), quiero = $('#quiero');
let abiertaEn = 0, abierta = false, alCerrar = null, alQuiero = null, volverFoco = null;

/* opts: { titulo, cantidad, items: [{ src, alt, pie, tipo }], inicio, quiero: texto, onQuiero, onCerrar } */
export function abrirHoja(opts) {
  if (abierta) cerrarHoja({ silencio: true });
  $('#hojaT').textContent = opts.titulo;
  $('#hojaN').textContent = opts.cantidad;
  carrusel.innerHTML = opts.items.map((it, i) => {
    const carga = Math.abs(i - (opts.inicio || 0)) < 3 ? 'eager' : 'lazy';
    return `<figure class="${it.tipo === 'foto' ? 'foto' : ''}"${it.tipo ? '' : ' data-detectar'}><img src="${esc(it.src)}" alt="${esc(it.alt)}" loading="${carga}" decoding="async">${it.tipo === 'foto' ? capaDuo(it.src, carga) : ''}${it.pie ? `<figcaption>${esc(it.pie)}</figcaption>` : ''}</figure>`;
  }).join('');
  quiero.textContent = opts.quiero;
  quiero.hidden = !opts.quiero;
  alQuiero = opts.onQuiero || null;
  alCerrar = opts.onCerrar || null;
  volverFoco = document.activeElement;
  abierta = true;
  abiertaEn = performance.now();
  hoja.inert = false;
  hoja.setAttribute('aria-hidden', 'false');
  hoja.classList.add('on'); velo.classList.add('on');
  // arranca en la obra tocada
  const fig = carrusel.children[opts.inicio || 0];
  requestAnimationFrame(() => {
    if (fig) {
      const vertical = getComputedStyle(carrusel).flexDirection === 'column';
      if (vertical) carrusel.scrollTop = fig.offsetTop - carrusel.offsetTop - 12;
      else carrusel.scrollLeft = fig.offsetLeft - (carrusel.clientWidth - fig.offsetWidth) / 2;
    }
    $('#cerrarHoja').focus({ preventScroll: true });
  });
}

export function cerrarHoja({ silencio = false } = {}) {
  if (!abierta) return;
  abierta = false;
  hoja.classList.remove('on'); velo.classList.remove('on');
  hoja.setAttribute('aria-hidden', 'true');
  hoja.inert = true;
  const cb = alCerrar; alCerrar = null;
  cb?.();
  if (!silencio && volverFoco?.isConnected) volverFoco.focus({ preventScroll: true });
}

export const hojaAbierta = () => abierta;

export function initHoja() {
  // el click fantasma que sigue a un toque no cierra la hoja recién abierta
  velo.onclick = () => { if (performance.now() - abiertaEn > 400) cerrarHoja(); };
  $('#cerrarHoja').onclick = () => cerrarHoja();
  quiero.onclick = () => { const f = alQuiero; cerrarHoja({ silencio: true }); f?.(); };
  addEventListener('keydown', e => { if (e.key === 'Escape' && abierta) cerrarHoja(); });
  // arrastrar la hoja hacia abajo (desde la manija o la cabecera) para cerrar
  const tirador = $('.hoja-tirador', hoja);
  let y0 = null, dy = 0;
  tirador.addEventListener('touchstart', e => { if (e.target.closest('button')) return; y0 = e.touches[0].clientY; dy = 0; hoja.style.transition = 'none'; }, { passive: true });
  tirador.addEventListener('touchmove', e => { if (y0 === null) return; dy = Math.max(0, e.touches[0].clientY - y0); hoja.style.transform = `translateY(${dy}px)`; }, { passive: true });
  const fin = () => { if (y0 === null) return; hoja.style.transition = ''; hoja.style.transform = ''; if (dy > 90) cerrarHoja(); y0 = null; };
  tirador.addEventListener('touchend', fin);
  tirador.addEventListener('touchcancel', fin);
}
