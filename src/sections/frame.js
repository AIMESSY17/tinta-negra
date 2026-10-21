/* Portadas de capítulo (Artista e Info) y pie de esas dos páginas, como láminas del grimorio.
   La portada es una lámina angosta y centrada: "Capítulo II", el título que se tatúa, el divisor con la hoja,
   la bajada y una flecha que invita a bajar. Detrás, la mesa a pleno. */
import config from '../config.js';
import { $, $$, esc, on } from '../lib/state.js';
import { tattooize } from '../lib/tattoo.js';
import { PAGES, pathOf, goSection } from '../lib/router.js';
import { esquinas, divisor, ROMAN } from '../lib/ui.js';
import { chapterLink } from './chrome.js';
import { grabado, enlace } from '../lib/buttons.js';

const C = config.contacto;

export function buildChapter(el) {
  const p = el.dataset.chapter, P = config.paginas?.[p] || {}, cover = P.portada || {};
  el.setAttribute('aria-labelledby', `ch-${p}`);
  el.innerHTML = `
  <div class="lamina portada">${esquinas()}
    <span class="cap">Capítulo ${ROMAN[PAGES.indexOf(p)]}</span>
    <h1 id="ch-${p}"><span class="ch-word">${esc(cover.titulo || P.nombre || p)}</span></h1>
    ${divisor()}
    ${cover.bajada ? `<p class="baj">${esc(cover.bajada)}</p>` : ''}
    <button type="button" class="bajar" aria-label="Bajar al contenido">
      <svg viewBox="0 0 22 40" aria-hidden="true"><path d="M11 2 V36 M4 29 L11 37 L18 29"/></svg>
    </button>
  </div>`;
}

export function initChapter(el) {
  const p = el.dataset.chapter, h = $('.ch-word', el);
  tattooize(h, { delay: .3, step: .06 });
  // el título se vuelve a tatuar cada vez que se entra al capítulo
  on('page', cur => {
    if (cur !== p) return;
    h.classList.remove('inked');
    void h.offsetWidth;
    requestAnimationFrame(() => h.classList.add('inked'));
  });
  $('.bajar', el).onclick = () => goSection(el.nextElementSibling);
}

/* ---- pie: una lámina baja con nombre, capítulos, contacto y el botón al taller ---- */
export function buildMiniFoot(el) {
  el.innerHTML = `
  <div class="lamina pie">${esquinas()}
    <div class="pie-in">
      <div class="pie-marca">
        <a class="marca" href="${pathOf('inicio')}" data-go="inicio">${esc(config.estudio.nombre)}</a>
        <nav class="pie-caps" aria-label="Capítulos">${PAGES.map(p => chapterLink(p)).join('')}</nav>
      </div>
      <dl class="pie-datos">
        <div><dt class="sc">WhatsApp</dt><dd><a href="https://wa.me/${esc(C.whatsapp)}" target="_blank" rel="noopener">${esc(C.whatsappVisible)}</a>
          ${enlace('copiar', { 'aria-label': 'Copiar el número de WhatsApp' }, { cls: 'pie-copy' })}<span class="pie-copied" aria-live="polite"></span></dd></div>
        <div><dt class="sc">Instagram</dt><dd><a href="https://instagram.com/${esc(C.instagram)}" target="_blank" rel="noopener">@${esc(C.instagram)}</a></dd></div>
        <div><dt class="sc">Dirección</dt><dd>${esc(C.direccion)}</dd></div>
      </dl>
      ${grabado('Armá tu tatuaje', { href: pathOf('inicio'), 'data-go': 'inicio', 'data-to': 'pedido' }, { chico: true, cls: 'pie-cta' })}
    </div>
    ${divisor('pie-div')}
    <p class="pie-legal sc">© ${new Date().getFullYear()} ${esc(config.estudio.nombre)} · ${esc(config.estudio.ciudad || '')}</p>
  </div>`;
}

export function initMiniFoot(el) {
  const msg = $('.pie-copied', el);
  $('.pie-copy', el).onclick = async () => {
    try { await navigator.clipboard.writeText('+' + C.whatsapp); msg.textContent = 'copiado'; }
    catch { msg.textContent = '+' + C.whatsapp; }
    setTimeout(() => { msg.textContent = ''; }, 2500);
  };
  on('page', p => $$('.pie-caps a', el).forEach(a => { if (a.dataset.go === p) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }));
}
