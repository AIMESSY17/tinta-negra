/* Encabezado: logo, links, modo noche (luna/sol) y Reservar. */
import config from '../config.js';
import { state, $, emit } from '../lib/state.js';

const LUNA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>';
const SOL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>';

export function initCabecera() {
  $('.logo', $('#top')).textContent = config.estudio.nombre;
  // ancho real de la ventana (sin la barra de scroll) para el margen común del contenido
  const ancho = () => document.documentElement.style.setProperty('--ancho', document.documentElement.clientWidth + 'px');
  ancho(); addEventListener('resize', ancho);
  const raiz = document.documentElement, b = $('#noche'), meta = document.querySelector('meta[name="theme-color"]');
  function ponerNoche(on) {
    raiz.classList.toggle('noche', on); state.studio = on;
    b.setAttribute('aria-pressed', on);
    b.setAttribute('aria-label', on ? 'Modo día' : 'Modo noche');
    b.innerHTML = on ? SOL : LUNA;
    meta.content = getComputedStyle(raiz).getPropertyValue('--paper').trim();
    emit('noche', on);
  }
  // el script inline del <head> ya puso la clase antes del primer pintado
  ponerNoche(raiz.classList.contains('noche'));
  b.onclick = () => {
    const on = !raiz.classList.contains('noche');
    ponerNoche(on);
    try { localStorage.setItem('tn-noche', on ? '1' : '0'); } catch (_) { /* sin almacenamiento */ }
  };
}
