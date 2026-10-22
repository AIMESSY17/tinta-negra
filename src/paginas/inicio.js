/* Inicio: hero (Tinta / Negra + David) → Trabajos → ventana de mesa → Armá tu tatuaje → Contacto */
import config from '../config.js';
import { $, $$, esc, mega } from '../lib/state.js';
import { obras } from '../lib/media.js';
import { htmlObra, chips, piezas, htmlCta, htmlContacto, PEDESTAL } from '../ui/comunes.js';

export function construirInicio(el) {
  const I = config.inicio;
  el.innerHTML = `
  <section class="hero" id="inicio" data-mesa>
    <div class="hero-col">
    <div class="hero-titulo">${mega('h1', I.titulo)}</div>
    <div class="hero-tx isla">
      <p class="kicker">${I.kicker.map(esc).join(' <b>·</b> ')}</p>
      <p>${esc(I.bajada)}</p>
      <div class="acciones">
        <a class="btn solido" href="#reservar" data-taller>Reservar turno</a>
        <a class="link" href="#trabajos" data-ancla>Ver trabajos</a>
      </div>
    </div>
    </div>
    <div class="estatua" id="estatua">
      <svg class="vit" id="vit" aria-hidden="true"><circle id="vCircle"/><rect id="vSquare"/><line id="vAxis"/><line id="vNavel"/></svg>
      <div class="estatua-ph" aria-hidden="true">${PEDESTAL}</div>
    </div>
    <p class="pista" id="pista">${esc(I.pista)}</p>
    <button type="button" class="mov" id="mov" hidden>Activar movimiento</button>
    <div class="zonas" id="zonas" role="group" aria-label="Zonas del cuerpo">
      ${config.zonas.map(z => `<button type="button" class="zona" data-zona="${z.id}" aria-pressed="false">${esc(z.nombre)}</button>`).join('')}
    </div>
  </section>

  <section class="panel" data-mesa id="trabajos">
    <div class="in">
      <div class="cab isla">${mega('h2', 'Trabajos')}<span class="n" id="cuenta"></span></div>
      ${chips([['todas', 'Todas'], ...config.zonas.map(z => [z.id, z.nombre])], 'todas', 'data-filtro', 'Filtrar por zona')}
      <div class="grilla" id="grilla"></div>
      <div class="mas-obras isla" style="width:fit-content"><a class="link" href="./artista" data-go="artista" data-to="portafolio">Ver el portafolio completo</a></div>
    </div>
  </section>

  <section class="ventana" data-mesa aria-label="Mesa de bocetos">
    <div class="cita isla"><p>${esc(I.cita.texto)}</p><small>${esc(I.cita.firma)}</small></div>
  </section>

  ${htmlCta()}
  ${htmlContacto()}`;

  // trabajos: filtro por zona; en celular tocar una obra la pasa a stencil
  const grilla = $('#grilla', el), cuenta = $('#cuenta', el), max = I.trabajosVisibles || 8;
  function pintar(f) {
    const lista = obras.filter(o => f === 'todas' || o.zona === f);
    grilla.innerHTML = lista.slice(0, max).map(htmlObra).join('');
    cuenta.textContent = piezas(lista.length);
  }
  el.querySelector('[data-filtro]').parentElement.addEventListener('click', e => {
    const b = e.target.closest('[data-filtro]'); if (!b) return;
    $$('[data-filtro]', el).forEach(c => c.setAttribute('aria-pressed', c === b));
    pintar(b.dataset.filtro);
  });
  grilla.addEventListener('click', e => { const f = e.target.closest('.obra'); if (f) f.classList.toggle('toque'); });
  pintar('todas');
  ajustarTitulo(el);
  // alto del bloque de texto del hero: la estatua termina arriba de él en celular
  const tx = $('.hero-tx', el), hero = $('.hero', el);
  new ResizeObserver(() => hero.style.setProperty('--tx-alto', tx.offsetHeight + 'px')).observe(tx);
}

/* "Tinta / Negra": el tamaño sale del ancho y el alto libres de su columna (con el calco violeta incluido) */
function ajustarTitulo(el) {
  const caja = $('.hero-titulo', el), h1 = $('h1', caja);
  const medir = () => {
    const r = caja.getBoundingClientRect(); if (!r.width || !r.height) return;
    h1.style.fontSize = '100px';
    const w = h1.scrollWidth / 100 + .06; // ancho de la línea más larga, en em, más el calco
    const lineas = h1.textContent.split(String.fromCharCode(10)).length;
    const alto = lineas * .82 + .3;      // las dos líneas, el descendente de la g y el calco
    const aire = 32;
    h1.style.fontSize = Math.max(48, Math.min(r.width / w, (r.height - aire) / alto)) + 'px';
  };
  medir();
  document.fonts?.ready.then(medir);
  new ResizeObserver(medir).observe(caja);
}
