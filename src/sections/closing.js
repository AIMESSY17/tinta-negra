/* Contacto (al final de Inicio): la lámina del estudio con dirección, horarios, WhatsApp copiable,
   Instagram y un mapa grabado en líneas finas. */
import config from '../config.js';
import { esc, $, state } from '../lib/state.js';
import { esquinas, cab, divisor } from '../lib/ui.js';
import { pathOf } from '../lib/router.js';
import { grabado, enlace } from '../lib/buttons.js';

const C = config.contacto;

// mapa estilizado: calles temblorosas, una avenida en diagonal, una plaza rayada y la cruz del estudio
function handMap() {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const wob = (x1, y1, x2, y2) => {
    const n = 5, pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push([x1 + (x2 - x1) * t + (i && i < n ? (rnd() - .5) * 3 : 0), y1 + (y2 - y1) * t + (i && i < n ? (rnd() - .5) * 3 : 0)]);
    }
    return 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(' ')).join(' L');
  };
  const streets = [];
  for (let x = 30; x < 400; x += 52) streets.push(wob(x + rnd() * 6, -10, x - 14 + rnd() * 6, 310));
  for (let y = 20; y < 300; y += 46) streets.push(wob(-10, y + rnd() * 6, 410, y + 10 + rnd() * 6));
  const hatch = [];
  for (let i = 0; i < 9; i++) hatch.push(wob(236 + i * 6, 112, 226 + i * 6, 152));
  return `<svg class="hmap" viewBox="0 0 400 300" aria-hidden="true">
    <path class="river" d="M-10 262 C 80 240, 150 290, 240 266 S 360 240, 410 254"/>
    ${streets.map((d, i) => `<path class="st" style="--d:${(i * .05).toFixed(2)}s" d="${d}"/>`).join('')}
    <path class="av" d="${wob(-10, 290, 410, 10)}"/>
    <path class="park" d="M228 108 Q 262 100 290 112 Q 296 136 284 156 Q 254 162 226 154 Q 220 130 228 108 Z"/>
    ${hatch.map(d => `<path class="hatch" d="${d}"/>`).join('')}
    <g class="pin" transform="translate(196 150)"><circle r="17"/><path d="M-8 -8 L8 8 M8 -8 L-8 8"/></g>
    <text class="here" x="220" y="186">acá estamos</text>
    <g class="rose" transform="translate(354 46)"><path d="M0 -20 L5 0 L0 20 L-5 0 Z"/><text y="-26">N</text></g>
  </svg>`;
}

export function buildClosing(el) {
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(C.mapaBusqueda || C.direccion)}`;
  el.innerHTML = `
  <div class="wrap"><div class="lamina contacto" data-calm>${esquinas()}
  ${cab(config.secciones.cierre, config.estudio.nombre, `${config.artista.nombre} · ${config.estudio.ciudad || ''}`)}
  <div class="closing-grid">
    <dl class="closing-info">
      <div><dt class="sc">Dirección</dt><dd>${esc(C.direccion)}</dd></div>
      <div><dt class="sc">Horarios</dt><dd>${C.horarios.map(h => `<span>${esc(h.dias)} · ${esc(h.horas)}</span>`).join('')}${C.nota ? `<span class="nota">${esc(C.nota)}</span>` : ''}</dd></div>
      <div><dt class="sc">Instagram</dt><dd><a href="https://instagram.com/${esc(C.instagram)}" target="_blank" rel="noopener">@${esc(C.instagram)}</a></dd></div>
      <div><dt class="sc">WhatsApp</dt><dd class="wa-line"><a href="https://wa.me/${esc(C.whatsapp)}" target="_blank" rel="noopener">${esc(C.whatsappVisible)}</a>
        ${enlace('copiar', { 'aria-label': 'Copiar el número de WhatsApp' }, { cls: 'copy-wa' })}<span class="copied" aria-live="polite"></span></dd></div>
    </dl>
    <a class="closing-map" href="${maps}" target="_blank" rel="noopener">
      ${handMap()}
      ${enlace('abrir en Google Maps', {}, { tag: 'span' })}
    </a>
  </div>
  ${divisor()}
  <footer class="foot"><span class="sc">© ${new Date().getFullYear()} ${esc(config.estudio.nombre)}</span>${enlace('volver arriba', {}, { cls: 'to-top' })}</footer>
  </div></div>`;
}

export function initClosing(el) {
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    el.classList.add('drawn');
  }, { threshold: .35 });
  io.observe($('.closing-grid', el));
  const msg = $('.wa-line .copied', el);
  $('.copy-wa', el).onclick = async () => {
    try { await navigator.clipboard.writeText('+' + C.whatsapp); msg.textContent = 'copiado'; }
    catch { msg.textContent = C.whatsapp; }
    setTimeout(() => { msg.textContent = ''; }, 2500);
  };
  $('.to-top', el).onclick = () => scrollTo({ top: 0, behavior: state.reduced ? 'auto' : 'smooth' });
}

export function buildReviews(el) {
  const R = config.resenas || [];
  if (!R.length) { el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = `
  <div class="wrap"><div class="lamina" data-calm>${esquinas()}${cab(config.secciones.resenas, 'Lo que dicen', '')}
  <div class="reviews-list">${R.map(r => `<blockquote><p>“${esc(r.texto)}”</p><footer class="sc">— ${esc(r.nombre)}${r.fuente ? ` · ${esc(r.fuente)}` : ''}</footer></blockquote>`).join('')}</div></div></div>`;
}

// cierre de las páginas Artista e Info: una lámina angosta con el botón grabado que lleva al taller de Inicio
export function buildCta(el, line) {
  el.innerHTML = `
  <div class="wrap"><div class="lamina cta-card" data-calm>${esquinas()}
    <p class="eti sc">${esc(line)}</p>
    ${grabado('Armá tu tatuaje', { href: pathOf('inicio'), 'data-go': 'inicio', 'data-to': 'pedido' })}
    ${divisor()}
    <p class="baj">Cinco pasos y me llega tu acta de stencil por WhatsApp.</p>
  </div></div>`;
}
