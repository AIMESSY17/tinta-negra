/* Info: portada → Preguntas (acordeón) → Proceso (etapas numeradas) → Cuidados → Armá tu tatuaje → contacto compacto */
import config from '../config.js';
import { $, esc, mega, state } from '../lib/state.js';
import { src } from '../lib/media.js';
import { htmlCta, htmlContacto } from '../ui/comunes.js';

const dos = n => String(n).padStart(2, '0');

export function construirInfo(el) {
  const P = config.paginas.info;
  el.innerHTML = `
  <section class="panel portada" data-mesa>
    <div class="in">
      <div class="cab isla">${mega('h2', P.titulo)}<span class="n">${esc(P.etiqueta)}</span></div>
    </div>
  </section>

  <section class="panel" data-mesa id="preguntas" style="padding-top:0">
    <div class="in">
      <div class="cab isla">${mega('h2', 'Preguntas')}</div>
      <div class="isla"><div class="faq" id="faq">
        ${config.preguntas.map((q, i) => `<details><summary><span class="num">${dos(i + 1)}</span><span class="q">${esc(q.p)}</span><span class="mas" aria-hidden="true"></span></summary><p class="r">${esc(q.r)}</p></details>`).join('')}
      </div></div>
    </div>
  </section>

  <section class="ventana respiro" data-mesa aria-label="Mesa de bocetos"></section>

  <section class="panel" data-mesa id="proceso">
    <div class="in">
      <div class="cab isla">${mega('h2', 'Proceso')}<span class="n">${config.proceso.map(e => esc(e.titulo)).join(' → ')}</span></div>
      <div class="proceso">
        ${config.proceso.map((e, i) => `<div class="etapa">
          <figure class="obra" tabindex="0"><img src="${src(e.imagen, true)}" alt="" loading="lazy" decoding="async"><figcaption>${esc(e.titulo)}</figcaption></figure>
          <div class="tx isla"><span class="num">${dos(i + 1)}</span><h3>${esc(e.titulo)}</h3><p>${esc(e.texto)}</p></div>
        </div>`).join('')}
      </div>
    </div>
  </section>

  <section class="panel" data-mesa id="cuidados" style="padding-top:0">
    <div class="in">
      <div class="cab isla">${mega('h2', 'Cuidados')}</div>
      <div class="cuidados">
        ${config.cuidados.map(c => `<div class="cuidado isla"><span class="dias">${esc(c.dias)}</span><h3>${esc(c.titulo)}</h3>
          <ul>${c.consejos.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>`).join('')}
      </div>
    </div>
  </section>

  ${htmlCta({ irAInicio: true })}
  ${htmlContacto({ id: 'contacto-info' })}`;

  // tocar una etapa la pasa a stencil
  el.addEventListener('click', e => { const f = e.target.closest('.etapa .obra'); if (f) f.classList.toggle('toque'); });

  // acordeón: abre y cierra suave
  const faq = $('#faq', el);
  faq.addEventListener('click', e => {
    const s = e.target.closest('summary'); if (!s) return;
    const d = s.parentElement;
    if (state.reduced || !d.animate) return;
    e.preventDefault();
    const borde = d.offsetHeight - d.clientHeight;
    const desde = d.offsetHeight;
    d.getAnimations().forEach(a => a.cancel());
    const anim = (a, b) => d.animate({ height: [a + 'px', b + 'px'] }, { duration: 320, easing: 'cubic-bezier(.3,.9,.3,1)' });
    if (!d.open) { d.open = true; anim(desde, d.offsetHeight); }
    else { anim(desde, s.offsetHeight + borde).onfinish = () => { d.open = false; }; }
  });
}
