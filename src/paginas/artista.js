/* Artista: portada → retrato + bio → portafolio completo (filtros por zona y estilo) → Armá tu tatuaje */
import config from '../config.js';
import { $, $$, esc, mega } from '../lib/state.js';
import { obras, src } from '../lib/media.js';
import { htmlObra, chips, piezas, htmlCta, htmlPie } from '../ui/comunes.js';
import { abrirHoja } from '../ui/hoja.js';
import { abrirTaller } from '../ui/taller.js';

export function construirArtista(el) {
  const A = config.artista;
  const foto = A.retrato ? `<img src="${src(A.retrato)}" alt="Retrato de ${esc(A.nombre)}" loading="lazy" decoding="async">` : '';
  el.innerHTML = `
  <section class="panel portada" data-mesa>
    <div class="in">
      <div class="cab isla">${mega('h2', 'El artista')}<span class="n">${esc(A.nombre)} · ${A.anos} años</span></div>
      <div class="artista">
        <figure class="retrato" tabindex="0">${foto}</figure>
        <div class="bio isla">
          ${A.bio.map((p, i) => `<p${i ? ' class="chica"' : ''}>${esc(p)}</p>`).join('')}
          <div class="datos">${A.datos.map(d => `<div><b>${esc(d.n)}</b><span>${esc(d.t)}</span></div>`).join('')}</div>
        </div>
      </div>
    </div>
  </section>

  <section class="panel" data-mesa id="portafolio">
    <div class="in">
      <div class="cab isla">${mega('h2', 'Portafolio')}<span class="n" id="cuentaP"></span></div>
      ${chips([['todas', 'Todas las zonas'], ...config.zonas.map(z => [z.id, z.nombre])], 'todas', 'data-fz', 'Filtrar por zona')}
      ${chips([['todos', 'Todos los estilos'], ...config.estilos.map(s => [s.id, s.nombre])], 'todos', 'data-fe', 'Filtrar por estilo')}
      <div class="grilla" id="grillaP"></div>
      <p class="vacio isla" id="vacioP" hidden>No hay trabajos con esa combinación.</p>
    </div>
  </section>

  <section class="ventana respiro" data-mesa aria-label="Mesa de bocetos"></section>
  ${htmlCta({ irAInicio: true })}
  <section class="panel" data-mesa style="padding-top:0"><div class="in">${htmlPie()}</div></section>`;

  // el retrato se vuelve stencil al pasar o tocar
  const ret = $('.retrato', el);
  ret.addEventListener('click', () => ret.classList.toggle('toque'));

  // portafolio
  const grilla = $('#grillaP', el), cuenta = $('#cuentaP', el), vacio = $('#vacioP', el);
  let fz = 'todas', fe = 'todos', lista = [];
  function pintar() {
    lista = obras.filter(o => (fz === 'todas' || o.zona === fz) && (fe === 'todos' || o.estilos.includes(fe)));
    grilla.innerHTML = lista.map(htmlObra).join('');
    cuenta.textContent = piezas(lista.length);
    vacio.hidden = lista.length > 0;
  }
  el.addEventListener('click', e => {
    const z = e.target.closest('[data-fz]'), s = e.target.closest('[data-fe]');
    if (z) { fz = z.dataset.fz; $$('[data-fz]', el).forEach(c => c.setAttribute('aria-pressed', c === z)); pintar(); }
    if (s) { fe = s.dataset.fe; $$('[data-fe]', el).forEach(c => c.setAttribute('aria-pressed', c === s)); pintar(); }
  });
  // tocar una obra la pasa a stencil y abre el visor en la misma hoja que usa la estatua
  grilla.addEventListener('click', e => {
    const b = e.target.closest('.obra'); if (!b) return;
    const i = +b.dataset.i, o = lista[i];
    b.classList.add('toque');
    const nombre = fz === 'todas' ? 'Portafolio' : o.zonaNombre;
    abrirHoja({
      titulo: nombre,
      cantidad: lista.length + (lista.length === 1 ? ' trabajo' : ' trabajos'),
      items: lista.map(x => ({ src: src(x.path), alt: `Tatuaje en ${x.zonaNombre.toLowerCase()}`, pie: x.zonaNombre, tipo: x.tipo })),
      inicio: i,
      quiero: `Quiero uno en ${o.zonaNombre.toLowerCase()}`,
      onQuiero: () => abrirTaller(o.zona),
      onCerrar: () => b.classList.remove('toque'),
    });
  });
  pintar();
}
