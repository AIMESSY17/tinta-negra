/* Galería de una zona del cuerpo: se abre al tocar una zona de la estatua del hero (o su botón).
   Escritorio: lámina lateral que entra desde la izquierda. Celular: hoja inferior al 85 % con manija,
   que se cierra deslizando hacia abajo, y los trabajos en carrusel a pantalla completa con puntos.
   Al pie, "Quiero uno en …" es el único camino de la estatua al taller. */
import { state, $, $$, esc, isMobile, mobileMQ } from '../lib/state.js';
import { src } from '../lib/media.js';
import { ZONES, zoneWorks, count, unit } from '../lib/zones.js';
import { openLightbox } from '../lib/lightbox.js';
import { pointOf } from '../lib/vt.js';
import { esquinas, divisor, roman, grab } from '../lib/ui.js';
import { grabado } from '../lib/buttons.js';

const X = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5 L19 19 M19 5 L5 19"/></svg>';

export function createGallery({ onOpen, onClose, onWant } = {}) {
  const scrim = document.createElement('div');
  scrim.className = 'zg-scrim';
  const el = document.createElement('aside');
  el.className = 'zgal lamina placed';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-labelledby', 'zg-t');
  el.inert = true;
  el.innerHTML = `${esquinas()}
    <div class="zg-grip">
      <div class="zg-handle" aria-hidden="true"><span></span></div>
      <header class="cab zg-cab">
        <p class="eti sc">Zona</p>
        <h2 id="zg-t"></h2>
        ${divisor()}
        <p class="zg-n"></p>
      </header>
    </div>
    <button type="button" class="icon zg-x" aria-label="Cerrar la galería">${X}</button>
    <div class="zg-works" role="list"></div>
    <div class="zg-dots" aria-hidden="true"></div>
    <div class="zg-foot"></div>`;
  document.body.append(scrim, el);
  const works = $('.zg-works', el), dots = $('.zg-dots', el), foot = $('.zg-foot', el);
  let zone = 0, open = false, returnFocus = null;

  function fill(z) {
    const Z = ZONES[z], n = count(z), mob = isMobile();
    $('#zg-t', el).textContent = Z.nombre;
    $('.zg-n', el).innerHTML = `<span class="rn">${roman(n)}</span> <span class="sc">${Z.demo ? 'bocetos de muestra' : unit(z)}</span>`;
    // en el celular, la foto grande (el carrusel ocupa toda la hoja); en escritorio, la miniatura
    works.innerHTML = Z.items.map((it, i) => `<button type="button" class="zg-w" role="listitem" data-i="${i}" aria-label="Ver el trabajo ${i + 1} de ${n} en ${esc(Z.nombre.toLowerCase())}">
      <img src="${src(it.path, !mob)}" alt="Tatuaje en ${esc(Z.nombre.toLowerCase())}, trabajo ${i + 1}" loading="${i < 6 ? 'eager' : 'lazy'}" decoding="async"></button>`).join('');
    works.scrollTo({ left: 0, top: 0 });
    dots.innerHTML = Z.items.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('');
    foot.innerHTML = grabado(`Quiero uno en ${Z.nombre}`, { 'data-want': z }, { cls: 'zg-want' });
  }

  function show(z, point) {
    if (!ZONES[z]) return;
    const again = open && z === zone;
    zone = z;
    if (!again) fill(z);
    if (open) return;
    open = true;
    returnFocus = document.activeElement;
    el.inert = false;
    el.style.removeProperty('--drag');
    el.classList.add('open');
    scrim.classList.add('on');
    document.documentElement.classList.add('zg-on');
    onOpen?.(z, point);
    setTimeout(() => $('.zg-x', el).focus({ preventScroll: true }), state.reduced ? 0 : 380);
  }

  function hide({ instant = false } = {}) {
    if (!open) return;
    open = false;
    el.inert = true;
    el.style.removeProperty('--drag');
    if (instant) { el.classList.add('instant'); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('instant'))); }
    el.classList.remove('open');
    scrim.classList.remove('on');
    document.documentElement.classList.remove('zg-on');
    onClose?.(zone);
    if (returnFocus?.isConnected && !instant) returnFocus.focus({ preventScroll: true });
  }

  $('.zg-x', el).onclick = () => hide();
  scrim.addEventListener('click', () => hide());
  addEventListener('keydown', e => { if (e.key === 'Escape' && open && !document.querySelector('dialog[open]')) hide(); });
  // tocar fuera (escritorio): cualquier clic que no sea la galería, el visor, la banda o una zona la cierra.
  // La estatua decide por su cuenta: tocar el cuerpo cambia de zona, tocar al lado cierra.
  document.addEventListener('click', e => {
    if (!open || isMobile()) return;
    const t = e.target;
    if (el.contains(t) || t.closest?.('dialog,[data-z],.banda,#st')) return;
    hide();
  });

  works.addEventListener('click', e => {
    const b = e.target.closest('.zg-w');
    if (b) openLightbox(zoneWorks(ZONES[zone]), +b.dataset.i, pointOf(e, b));
  });
  foot.addEventListener('click', e => {
    if (!e.target.closest('[data-want]')) return;
    const z = zone;
    hide({ instant: isMobile() });
    onWant?.(z);
  });

  // carrusel del celular: los puntos siguen al trabajo a la vista
  works.addEventListener('scroll', () => {
    if (!isMobile()) return;
    const i = Math.round(works.scrollLeft / Math.max(1, works.clientWidth));
    $$('i', dots).forEach((d, k) => d.classList.toggle('on', k === i));
  }, { passive: true });

  // hoja inferior: se arrastra hacia abajo desde la manija (o la cabecera) para cerrarla
  const grip = $('.zg-grip', el);
  let drag = null;
  grip.addEventListener('pointerdown', e => {
    if (!isMobile() || e.button > 0) return;
    grab(e, grip);
    drag = { id: e.pointerId, y: e.clientY, t: performance.now(), dy: 0 };
    el.classList.add('dragging');
  });
  grip.addEventListener('pointermove', e => {
    if (!drag || drag.id !== e.pointerId) return;
    drag.dy = Math.max(0, e.clientY - drag.y);
    el.style.setProperty('--drag', drag.dy + 'px');
  });
  const release = e => {
    if (!drag || drag.id !== e.pointerId) return;
    const d = drag; drag = null;
    el.classList.remove('dragging');
    const v = d.dy / Math.max(1, performance.now() - d.t);
    if (e.type === 'pointerup' && (d.dy > 110 || v > .6)) hide();
    else el.style.removeProperty('--drag');
  };
  grip.addEventListener('pointerup', release);
  grip.addEventListener('pointercancel', release);

  // al pasar de escritorio a celular (o al revés) se rehace el contenido con el tamaño de imagen adecuado
  mobileMQ.addEventListener('change', () => { if (zone) fill(zone); });

  return { open: show, close: hide, isOpen: () => open, zone: () => zone };
}
