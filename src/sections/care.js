/* Cuidados: una tarjeta con un dial de fuente de máquina de tatuar, del día 1 al 30. El tatuaje sobre piel evoluciona.
   En el celular el dial se cambia por un deslizador horizontal grabado (más cómodo con el pulgar). */
import config from '../config.js';
import { state, $, esc, whenNear } from '../lib/state.js';

// deslizador del celular: día d → x en el viewBox
const SX = d => 30 + (d - 1) * 20;
const slider = () => `
  <svg class="dia" viewBox="0 0 640 120" role="slider" tabindex="0" aria-label="Día de curación"
    aria-valuemin="${MIN}" aria-valuemax="${MAX}" aria-valuenow="1" aria-valuetext="Día 1" data-no-mesa>
    <rect class="dia-body" x="12" y="36" width="616" height="64"/>
    <rect class="dia-in" x="18" y="42" width="604" height="52"/>
    ${Array.from({ length: MAX }, (_, i) => {
      const d = i + 1, big = [1, 7, 14, 21, 30].includes(d);
      return `<line x1="${SX(d)}" y1="42" x2="${SX(d)}" y2="${big ? 62 : 52}" class="${big ? 'big' : ''}"/>${big ? `<text x="${SX(d)}" y="88">${d}</text>` : ''}`;
    }).join('')}
    <rect class="dia-fill" x="${SX(1)}" y="42" height="4" width="0"/>
    <g class="dia-handle"><line x1="0" y1="24" x2="0" y2="108"/><path d="M0 8 L9 18 L0 28 L-9 18 Z"/></g>
  </svg>`;
import { src } from '../lib/media.js';
import { fallbackSkin } from '../skin/fallback.js';
import { createSkin } from '../skin/skin.js';
import { toneButtons, bindTones } from './process.js';
import { esquinas, cab, rich, blotIn, grab } from '../lib/ui.js';

const MIN = 1, MAX = 30, A0 = -135, A1 = 135;
const bell = (x, a, b, c) => x <= a || x >= c ? 0 : x < b ? (x - a) / (b - a) : (c - x) / (c - b);
const clamp = x => Math.max(0, Math.min(1, x));

// día → parámetros del shader de piel
function paramsAt(d) {
  return {
    uIdea: 0, uPencil: 0, uLine: 0, uStencil: 0, uSkin: 1, uInk: 1,
    uRed: clamp(1 - (d - 2) / 5) * .95,
    uSwell: clamp(1 - (d - 1) / 3) * .8,
    uGloss: clamp(1 - (d - 1) / 3),
    uPeel: bell(d, 4, 9, 16),
    uCloud: bell(d, 9, 15, 25) * .9,
    uHeal: clamp((d - 16) / 14),
  };
}

export function buildCare(el) {
  const ticks = Array.from({ length: MAX }, (_, i) => {
    const d = i + 1, a = (A0 + (A1 - A0) * i / (MAX - 1)) * Math.PI / 180, big = [1, 7, 14, 21, 30].includes(d);
    const r1 = 112, r2 = big ? 98 : 104;
    const x1 = 130 + Math.sin(a) * r1, y1 = 130 - Math.cos(a) * r1, x2 = 130 + Math.sin(a) * r2, y2 = 130 - Math.cos(a) * r2;
    const lab = big ? `<text x="${(130 + Math.sin(a) * 125).toFixed(1)}" y="${(135 - Math.cos(a) * 125).toFixed(1)}">${d}</text>` : '';
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="${big ? 'big' : ''}"/>${lab}`;
  }).join('');
  el.innerHTML = `
  <div class="lamina" data-calm>${esquinas()}
  ${cab(config.secciones.cuidados, 'Tarjeta de cuidados', 'Girá la perilla como en la fuente de la máquina: del día 1 al 30, mirá cómo cambia la piel y qué hacer.')}
  <div class="care-body">
  <div class="pair-body">
    <figure class="care-skin">
      <canvas role="img" aria-label="El tatuaje sobre la piel en el día elegido"></canvas>
      <figcaption>${toneButtons()}<span class="sc">tono de piel</span></figcaption>
    </figure>
    <div class="dial-box">
      <svg class="dial" viewBox="-10 -10 280 280" role="slider" tabindex="0" aria-label="Día de curación"
        aria-valuemin="${MIN}" aria-valuemax="${MAX}" aria-valuenow="1" aria-valuetext="Día 1" data-no-mesa>
        <g class="ticks">${ticks}</g>
        <circle cx="130" cy="130" r="86" class="knob-shadow"/>
        <g class="knob">
          <circle cx="130" cy="130" r="80" class="knob-body"/>
          ${Array.from({ length: 24 }, (_, i) => `<line x1="130" y1="54" x2="130" y2="62" transform="rotate(${i * 15} 130 130)" class="grip"/>`).join('')}
          <circle cx="130" cy="130" r="58" class="knob-face"/>
          <line x1="130" y1="78" x2="130" y2="104" class="pointer"/>
        </g>
      </svg>
      ${slider()}
      <p class="dial-day"><span class="sc">día</span> <b>1</b></p>
    </div>
  </div>
  <div class="care-tips" aria-live="polite"></div>
  </div>
  </div>`;
}

export function initCare(el) {
  const dial = $('.dial', el), knob = $('.knob', dial), dayEl = $('.dial-day b', el), tips = $('.care-tips', el);
  const sl = $('.dia', el), sHandle = $('.dia-handle', sl), sFill = $('.dia-fill', sl);
  let day = 1, shown = -1, skin = null;
  const stageOf = d => config.cuidados.find(s => d >= s.desde && d <= s.hasta) || config.cuidados[config.cuidados.length - 1];

  function set(d, fromDrag) {
    d = Math.max(MIN, Math.min(MAX, d));
    day = d;
    const k = Math.round(d);
    const ang = A0 + (A1 - A0) * (d - MIN) / (MAX - MIN);
    knob.style.transform = `rotate(${ang}deg)`;
    sHandle.setAttribute('transform', `translate(${SX(d)} 0)`);
    sFill.setAttribute('width', SX(d) - SX(MIN));
    dayEl.textContent = k;
    for (const s of [dial, sl]) { s.setAttribute('aria-valuenow', k); s.setAttribute('aria-valuetext', `Día ${k}`); }
    skin?.set(paramsAt(d));
    el.dataset.phase = config.cuidados.indexOf(stageOf(Math.round(d)));
    const s = stageOf(k);
    if (s !== shown) {
      shown = s;
      tips.innerHTML = `<h3>${esc(s.titulo)} <small class="sc">días ${s.desde} a ${s.hasta}</small></h3>
        <ul class="blot" data-blot-manual>${s.consejos.map(c => `<li><b class="sc">${esc(c.tema)}</b><span>${rich(c.texto)}</span></li>`).join('')}</ul>`;
      blotIn($('ul', tips), .05);
    }
    if (!fromDrag) state.lastInput = state.time;
  }

  // arrastre circular
  let drag = null;
  const angleAt = e => {
    const r = dial.getBoundingClientRect();
    return Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180 / Math.PI;
  };
  dial.addEventListener('pointerdown', e => {
    drag = { id: e.pointerId, a: angleAt(e), d: day };
    grab(e, dial);
    dial.classList.add('grab');
  });
  dial.addEventListener('pointermove', e => {
    if (!drag || drag.id !== e.pointerId) return;
    const a = angleAt(e);
    let da = a - drag.a;
    if (da > 180) da -= 360;
    if (da < -180) da += 360;
    drag.a = a;
    drag.d = Math.max(MIN, Math.min(MAX, drag.d + da / (A1 - A0) * (MAX - MIN)));
    set(drag.d, true);
    state.lastInput = state.time;
  });
  const up = () => { drag = null; dial.classList.remove('grab'); };
  dial.addEventListener('pointerup', up);
  dial.addEventListener('pointercancel', up);
  dial.addEventListener('wheel', e => { e.preventDefault(); set(Math.round(day) + (e.deltaY > 0 ? 1 : -1)); }, { passive: false });
  const keys = e => {
    const k = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 7, PageDown: -7 }[e.key];
    if (k) { e.preventDefault(); set(Math.round(day) + k); }
    if (e.key === 'Home') { e.preventDefault(); set(MIN); }
    if (e.key === 'End') { e.preventDefault(); set(MAX); }
  };
  dial.addEventListener('keydown', keys);

  // deslizador horizontal (celular): solo toma el gesto de costado, el scroll vertical sigue siendo de la página
  let sdrag = null;
  const dayAt = e => {
    const r = sl.getBoundingClientRect(), vb = sl.viewBox.baseVal;
    return MIN + ((e.clientX - r.left) / r.width * vb.width - SX(MIN)) / 20;
  };
  sl.addEventListener('pointerdown', e => { sdrag = e.pointerId; grab(e, sl); set(dayAt(e)); });
  sl.addEventListener('pointermove', e => { if (sdrag === e.pointerId) { set(dayAt(e), true); state.lastInput = state.time; } });
  const sup = e => { if (sdrag === e.pointerId) { sdrag = null; set(Math.round(day)); } };
  sl.addEventListener('pointerup', sup);
  sl.addEventListener('pointercancel', sup);
  sl.addEventListener('keydown', keys);

  whenNear(el, () => {
    skin = createSkin($('canvas', el), src(config.proceso.boceto));
    if (!skin) fallbackSkin(el);
    bindTones(el, skin);
    set(day, true);
  });
  set(1, true);
}
