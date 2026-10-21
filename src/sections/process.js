/* El proceso: una lámina de papel de calco. Un mismo boceto pasa por las seis etapas;
   se eligen tocando cada etapa (o con anterior/siguiente) y el shader de piel pasa de una a otra.
   En el celular las etapas se pasan deslizando el visual (scroll-snap) y la piel sigue al dedo. */
import config from '../config.js';
import { state, $, $$, esc, whenNear, addTicker, isMobile } from '../lib/state.js';
import { src } from '../lib/media.js';
import { fallbackSkin } from '../skin/fallback.js';
import { createSkin, TONES } from '../skin/skin.js';
import { esquinas, cab, rich, blotIn, ROMAN } from '../lib/ui.js';
import { enlace } from '../lib/buttons.js';

const ST = config.proceso.etapas;

export const toneButtons = () => `<div class="tones" role="group" aria-label="Tono de piel">
  ${TONES.map((t, i) => `<button type="button" data-tone="${i}" aria-pressed="${i === 0}" aria-label="Piel ${t.name.toLowerCase()}" style="--tone:rgb(${t.rgb.map(c => Math.round(c * 255)).join(',')})"></button>`).join('')}
</div>`;

export function bindTones(root, skin) {
  root.querySelector('.tones')?.addEventListener('click', e => {
    const b = e.target.closest('[data-tone]');
    if (!b) return;
    $$('[data-tone]', root).forEach(x => x.setAttribute('aria-pressed', x === b));
    skin?.setTone(TONES[+b.dataset.tone].rgb);
  });
}

export function buildProcess(el) {
  el.innerHTML = `
  <div class="lamina" data-calm>${esquinas()}
    ${cab(config.secciones.proceso, 'Un diseño, todas las etapas', 'Tocá cada etapa: el mismo boceto pasa de la idea a la piel curada.')}
    <div class="proc-body">
      <div class="etapas" role="group" aria-label="Etapas">
        ${ST.map((s, i) => `<button type="button" class="etapa" data-i="${i}" aria-pressed="${i === 0}" aria-label="${ROMAN[i]}. ${esc(s.titulo)}">${ROMAN[i]}</button>`).join('')}
      </div>
      <figure class="proc-canvas">
        <canvas role="img" aria-label="El diseño en la etapa actual"></canvas>
        <div class="proc-snap" data-no-mesa aria-hidden="true">${ST.map((s, i) => `<div class="ps"><span class="ps-n placa"><span class="rn">${ROMAN[i]}</span> <span class="sc">${esc(s.titulo)}</span></span></div>`).join('')}</div>
      </figure>
      <div class="proc-notes" aria-live="polite">
        ${ST.map((s, i) => `<div class="proc-note etapa-tx" data-i="${i}"><b>${esc(s.titulo)}</b><p class="blot" data-blot-manual>${rich(s.nota)}</p></div>`).join('')}
      </div>
      <div class="proc-foot">
        <div class="proc-nav">
          ${enlace('anterior', { 'data-d': '-1', 'aria-label': 'Etapa anterior' }, { back: true })}
          ${enlace('siguiente etapa', { 'data-d': '1' })}
        </div>
        <div class="tone-pick">${toneButtons()}<span class="sc">tono de piel</span></div>
      </div>
    </div>
  </div>`;
}

// etapa continua (0..5) → parámetros del shader
function paramsAt(s) {
  const w = i => Math.max(0, 1 - Math.abs(s - i));
  const c = (a, b) => Math.max(0, Math.min(1, (s - a) / (b - a)));
  return {
    uIdea: w(0), uPencil: w(1), uLine: w(2), uSkin: c(2, 3), uStencil: w(3),
    uInk: c(3, 4), uRed: w(4) * .9, uSwell: w(4) * .5, uGloss: w(4) * .9, uPeel: 0, uCloud: 0, uHeal: c(4, 5),
  };
}

export function initProcess(el) {
  const btns = $$('.etapa', el), notes = $$('.proc-note', el);
  let skin = null, cur = -1, s = 0, target = 0;
  const n = ST.length - 1;
  const show = v => {
    skin?.set(paramsAt(v));
    const i = Math.round(v);
    el.dataset.stage = i;
    if (i === cur) return;
    cur = i;
    btns.forEach((b, k) => { b.classList.toggle('on', k === i); b.setAttribute('aria-pressed', k === i); });
    notes.forEach((p, k) => { p.classList.toggle('on', k === i); if (k === i) blotIn(p.querySelector('p')); });
  };
  // celular: una franja de seis paneles sobre el visual; el desplazamiento define la etapa (continua)
  const snap = $('.proc-snap', el);
  const snapOn = () => isMobile() && snap.clientWidth > 0;
  snap.addEventListener('scroll', () => {
    if (!snapOn()) return;
    s = target = Math.max(0, Math.min(n, snap.scrollLeft / snap.clientWidth));
    show(s);
    state.lastInput = state.time;
  }, { passive: true });
  const goTo = i => {
    target = Math.max(0, Math.min(n, i));
    state.lastInput = state.time;
    if (snapOn()) { snap.scrollTo({ left: target * snap.clientWidth, behavior: state.reduced ? 'auto' : 'smooth' }); return; }
    if (state.reduced) show(s = target);
  };
  $('.etapas', el).addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) goTo(+b.dataset.i); });
  $('.proc-nav', el).addEventListener('click', e => {
    const b = e.target.closest('[data-d]');
    if (!b) return;
    const k = Math.round(target) + +b.dataset.d;
    goTo(k > n ? 0 : k < 0 ? n : k);
  });
  // de una etapa a otra con una transición suave (≈0,7 s por etapa)
  addTicker(dt => {
    if (Math.abs(target - s) < .001) return;
    const d = target - s, step = Math.min(Math.abs(d), dt * 1.6);
    s += Math.sign(d) * step;
    const i = Math.floor(s), f = s - i;
    show(Math.min(n, i + smooth(.15, .85, f)));
    if (Math.abs(target - s) < .001) show(s = target);
  });
  whenNear(el, () => {
    skin = createSkin($('canvas', el), src(config.proceso.boceto));
    if (!skin) fallbackSkin(el);
    bindTones(el, skin);
    show(s);
  });
  show(0);
}
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
