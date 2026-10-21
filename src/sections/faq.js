/* Preguntas: un fichero de láminas negras 5:3 (4:5 en celular).
   Frente: número romano, tema, la pregunta en Garamond itálica y la hoja; dorso (giro 3D): la pregunta arriba y la respuesta.
   Detrás asoman las siguientes. Arriba, los temas: tocar uno lleva a esa lámina. Se pasa deslizando (aparece el sello
   "Vista" o "Anterior" con doble filete), con los enlaces de abajo o con las flechas; Enter o Espacio la dan vuelta. */
import config from '../config.js';
import { state, $, $$, esc } from '../lib/state.js';
import { esquinas, cab, rich, blotIn, ROMAN, grab } from '../lib/ui.js';
import { completeHint } from '../lib/hints.js';
import { grabado, enlace } from '../lib/buttons.js';

const Q = config.preguntas;
const N = Q.length;
const ORN = '<svg class="orn" viewBox="0 0 46 18" aria-hidden="true"><use href="#hoja"/></svg>';
const ROTS = [0, -2.4, 2, -1.2];

const ficha = (q, i) => `
  <div class="ficha" data-i="${i}" role="group" aria-roledescription="lámina" aria-label="Pregunta ${ROMAN[i]} de ${ROMAN[N - 1]}: ${esc(q.p)}">
    <div class="giro">
      <div class="cara">
        <div class="num"><span class="n">${ROMAN[i]}</span><span class="sc">${esc(q.tema || '')}</span></div>
        <p class="preg">${esc(q.p)}</p>${ORN}<p class="toca">tocá para leer la respuesta</p>
      </div>
      <div class="cara dorso" aria-hidden="true">
        <div class="num"><span class="n">${ROMAN[i]}</span><span class="sc">Respuesta</span></div>
        <p class="pq">${esc(q.p)}</p><p class="resp blot" data-blot-manual>${rich(q.r)}</p>
      </div>
    </div>
    <span class="sello-arr izq" aria-hidden="true">Vista</span><span class="sello-arr der" aria-hidden="true">Anterior</span>
  </div>`;

const final = () => `
  <div class="ficha final" data-i="${N}" role="group" aria-roledescription="lámina" aria-label="Última lámina">
    <div class="giro"><div class="cara">${ORN}<p class="preg">¿Te quedó otra duda?</p>
      ${grabado('Escribime por WhatsApp', { href: `https://wa.me/${config.contacto.whatsapp}`, target: '_blank', rel: 'noopener' }, { chico: true, arrow: false })}
      ${enlace('Volver al principio', { 'data-rein': '' })}
    </div></div>
  </div>`;

export function buildFaq(el) {
  el.innerHTML = `
  <div class="wrap"><div class="lamina" data-calm>${esquinas()}
    ${cab(config.secciones.preguntas, 'Lo que siempre me preguntan', 'Elegí un tema, deslizá la lámina o tocala para darla vuelta.')}
    <div class="fichero">
      <div class="temas" role="group" aria-label="Temas">
        ${Q.map((q, i) => `<button type="button" class="tema" data-i="${i}"><span class="t">${esc(q.tema || ROMAN[i])}</span></button>`).join('')}
      </div>
      <div class="taco" tabindex="0" data-no-mesa aria-label="Preguntas. Flechas para pasar, Enter para dar vuelta">
        ${Q.map(ficha).join('')}${final()}
      </div>
      <div class="controles">
        ${enlace('Anterior', { 'data-fx': 'prev', 'aria-label': 'Pregunta anterior' }, { back: true })}
        <span class="cont" aria-live="polite"></span>
        ${enlace('Siguiente', { 'data-fx': 'next', 'aria-label': 'Pregunta siguiente' })}
        <p class="pista" data-hint="fichero">deslizá la lámina o elegí un tema</p>
      </div>
    </div>
  </div></div>`;
}

export function initFaq(el) {
  const taco = $('.taco', el), fichas = $$('.ficha', el), temas = $$('.tema', el), cont = $('.cont', el);
  const prevB = $('[data-fx="prev"]', el), nextB = $('[data-fx="next"]', el);
  let idx = 0;

  const flip = (f, open) => {
    if (!f || f.classList.contains('final')) return;
    f.classList.toggle('vuelta', open);
    $('.dorso', f).setAttribute('aria-hidden', !open);
    if (open) blotIn($('.resp', f), state.reduced ? 0 : .3);
  };
  function layout() {
    fichas.forEach((f, i) => {
      const d = i - idx;
      f.inert = d !== 0;
      f.classList.toggle('front', d === 0);
      if (d < 0) { f.style.opacity = 0; f.style.pointerEvents = 'none'; f.style.transform = 'translate(-140%, -6%) rotate(-20deg)'; flip(f, false); return; }
      f.style.pointerEvents = d === 0 ? 'auto' : 'none';
      f.style.zIndex = 100 - d;
      f.style.opacity = d <= 3 ? 1 : 0;
      const k = Math.min(d, 3);
      f.style.transform = `translate(${k * (d % 2 ? 9 : -7)}px,${-k * 8}px) rotate(${d === 0 ? 0 : ROTS[k]}deg) scale(${1 - k * .02})`;
      if (d !== 0) flip(f, false);
    });
    temas.forEach((b, i) => b.setAttribute('aria-current', i === idx));
    // en el celular los temas son una fila deslizable: el actual queda centrado
    const row = temas[0]?.parentElement, cur = temas[Math.min(idx, N - 1)];
    if (row && cur && row.scrollWidth > row.clientWidth) row.scrollTo({ left: cur.offsetLeft - (row.clientWidth - cur.offsetWidth) / 2, behavior: state.reduced ? 'auto' : 'smooth' });
    cont.textContent = idx < N ? `${ROMAN[idx]} / ${ROMAN[N - 1]}` : 'fin';
    prevB.disabled = idx === 0;
    nextB.disabled = idx >= N;
  }
  const irA = i => { idx = Math.max(0, Math.min(N, i)); layout(); };
  // la lámina sale volando hacia el costado (con la inercia del gesto) y entra la siguiente, o vuelve la anterior
  function volar(dir, v = 0) {
    const f = fichas[idx];
    if (dir < 0 && idx >= N) { layout(); return; }
    if (dir > 0 && idx === 0) { layout(); return; }
    const fuerza = 1 + Math.min(2, Math.abs(v));
    f.style.transform = `translate(${(dir < 0 ? -140 : 140) * fuerza}%,-6%) rotate(${(dir < 0 ? -20 : 20) * fuerza}deg)`;
    f.style.opacity = 0;
    completeHint('fichero');
    setTimeout(() => irA(idx + (dir < 0 ? 1 : -1)), state.reduced ? 0 : 260);
  }
  temas.forEach(b => b.addEventListener('click', () => { completeHint('fichero'); irA(+b.dataset.i); }));
  nextB.onclick = () => volar(-1);
  prevB.onclick = () => volar(1);
  el.addEventListener('click', e => { if (e.target.closest('[data-rein]')) { irA(0); taco.focus({ preventScroll: true }); } });

  // arrastre: la lámina se inclina con el gesto y se marca el sello; la mesa del fondo no se entera
  let drag = null;
  taco.addEventListener('pointerdown', e => {
    const f = fichas[idx];
    if (e.button > 0 || !f.contains(e.target) || e.target.closest('a,button')) return;
    grab(e, taco);
    drag = { x: e.clientX, y: e.clientY, t: performance.now(), m: 0, dx: 0, f, id: e.pointerId };
    f.style.transition = 'none';
  });
  taco.addEventListener('pointermove', e => {
    if (!drag || drag.id !== e.pointerId) return;
    e.stopPropagation();
    const dx = e.clientX - drag.x, dy = (e.clientY - drag.y) * .2;
    drag.m = Math.max(drag.m, Math.abs(dx));
    drag.dx = dx;
    drag.f.style.transform = `translate(${dx}px,${dy}px) rotate(${dx * .045}deg)`;
    const iz = drag.f.querySelector('.sello-arr.izq'), de = drag.f.querySelector('.sello-arr.der');
    if (iz) { iz.style.opacity = Math.min(1, Math.max(0, -dx - 20) / 100); de.style.opacity = idx > 0 ? Math.min(1, Math.max(0, dx - 20) / 100) : 0; }
  });
  const soltar = e => {
    if (!drag || drag.id !== e.pointerId) return;
    e.stopPropagation();
    const d = drag; drag = null;
    d.f.style.transition = '';
    d.f.querySelectorAll('.sello-arr').forEach(s => { s.style.opacity = 0; });
    const v = d.dx / Math.max(1, performance.now() - d.t);
    if (d.m < 6) {
      if (e.type === 'pointerup' && idx < N) { flip(d.f, !d.f.classList.contains('vuelta')); completeHint('fichero'); }
      layout();
      return;
    }
    if (e.type === 'pointerup' && (Math.abs(d.dx) > 110 || Math.abs(v) > .6)) volar(d.dx < 0 ? -1 : 1, v);
    else layout();
  };
  taco.addEventListener('pointerup', soltar);
  taco.addEventListener('pointercancel', soltar);
  taco.addEventListener('keydown', e => {
    if (e.target !== taco) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); volar(-1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); volar(1); }
    if ((e.key === 'Enter' || e.key === ' ') && idx < N) { e.preventDefault(); flip(fichas[idx], !fichas[idx].classList.contains('vuelta')); }
  });
  layout();
}
