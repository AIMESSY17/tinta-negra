/* Portafolio (página del artista): una carpeta de láminas, abierta y con su contenido desde el primer momento.
   Al elegir un estilo, la carpeta muestra esos trabajos y, de paso, una ola de tinta re-puebla la mesa solo con ese estilo. */
import config from '../config.js';
import { $, esc, on, emit } from '../lib/state.js';
import { sketches, src } from '../lib/media.js';
import { openLightbox, registerWorks, workId } from '../lib/lightbox.js';
import { pointOf } from '../lib/vt.js';
import { esquinas, cab } from '../lib/ui.js';
import { enlace, chip } from '../lib/buttons.js';

// cada lámina tiene su link propio: #trabajo/lamina-05 (número fijo, no depende del filtro)
const work = s => ({ src: src(s.path), alt: `Lámina ${sketches.indexOf(s) + 1}`, id: workId('lamina', sketches.indexOf(s)) });
registerWorks('lamina', () => sketches.map(work), 'artista');

const SHOW = 10;
const ALL = 'Todo el cuaderno mezclado, como sale de la mesa de dibujo.';

export function buildStyles(el) {
  const count = id => sketches.filter(s => s.styles.includes(id)).length;
  el.innerHTML = `
  <div class="wrap">
    <div class="lamina carpeta" data-calm>${esquinas()}
      ${cab(config.secciones.estilos, 'La carpeta de láminas', 'Elegí un estilo: la carpeta muestra esos trabajos y la mesa se vuelve a poblar solo con ellos.')}
      <div class="chips chips-c" role="group" aria-label="Estilos">
        ${chip('Todos', { 'data-style': '', 'aria-pressed': 'true' }, ` <small>${sketches.length}</small>`)}
        ${config.estilos.map(s => chip(s.nombre, { 'data-style': s.id, 'aria-pressed': 'false' }, ` <small>${count(s.id)}</small>`)).join('')}
      </div>
      <p class="style-desc" aria-live="polite">${ALL}</p>
      <div class="masonry"></div>
      <div class="carpeta-pie">${enlace('Ver todas las láminas', {}, { cls: 'more' })}</div>
    </div>
  </div>`;
}

export function initStyles(el) {
  const desc = $('.style-desc', el), grid = $('.masonry', el), more = $('.more', el);
  let list = sketches;
  const items = () => list.map(work);
  function render(id) {
    list = id ? sketches.filter(s => s.styles.includes(id)) : sketches;
    grid.innerHTML = list.slice(0, SHOW).map((s, i) => `
      <button type="button" class="plate" data-i="${i}">
        <span class="ph" style="aspect-ratio:${s.w} / ${s.h}"><img src="${src(s.path, true)}" alt="Lámina ${i + 1}${id ? ' de ' + esc(config.estilos.find(x => x.id === id)?.nombre || '') : ''}" width="${s.w}" height="${s.h}" decoding="async"></span>
      </button>`).join('');
    // las que ya estaban en caché aparecen sin esperar
    grid.querySelectorAll('img').forEach(im => { if (im.complete && im.naturalWidth) im.classList.add('ok'); });
    more.hidden = list.length <= SHOW;
    more.querySelector('.t').textContent = `Ver las ${list.length} láminas`;
  }
  grid.addEventListener('click', e => { const b = e.target.closest('.plate'); if (b) openLightbox(items(), +b.dataset.i, pointOf(e, b)); });
  more.onclick = e => openLightbox(items(), SHOW, pointOf(e, more));
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-style]');
    if (b) emit('style', b.dataset.style || null);
  });
  on('style', id => {
    el.querySelectorAll('[data-style]').forEach(b => b.setAttribute('aria-pressed', (b.dataset.style || null) === id));
    const s = config.estilos.find(x => x.id === id);
    desc.textContent = s ? s.descripcion : ALL;
    render(id);
  });
  // mientras carga, cada lámina muestra un boceto en lápiz; la imagen aparece encima al llegar
  grid.addEventListener('load', e => { if (e.target.tagName === 'IMG') e.target.classList.add('ok'); }, true);
  render(null);
}
