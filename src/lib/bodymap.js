// Silueta del cuerpo dibujada a tinta (frente y espalda) para el paso 1 del taller.
// Cada zona se pinta con tinta hueso al tocarla: se expande desde el punto del toque, dentro de la zona.
// Zonas con los mismos números que la estatua: 1 cabeza, 2 brazos, 3 torso, 4 espalda, 5 piernas.
import { state } from './state.js';

const W = 240;
// espeja un path en x (solo comandos absolutos M, C, L, S)
const mirror = d => d.replace(/([MCLS])([^MCLSZ]*)/g, (_, c, args) =>
  c + args.trim().split(/[\s,]+/).filter(Boolean).map((v, i) => (i % 2 ? v : String(W - +v))).join(' ') + ' ');
const both = d => [d, mirror(d)];

const HEAD = 'M120 14 C136 14 143 28 142 44 C141 56 136 64 130 69 L131 84 L109 84 L110 69 C104 64 99 56 98 44 C97 28 104 14 120 14 Z';
const TRUNK = 'M109 84 C96 88 80 90 72 98 C68 104 70 116 74 128 L80 150 C82 172 82 196 80 214 C80 224 84 232 92 236 L148 236 C156 232 160 224 160 214 C158 196 158 172 160 150 L166 128 C170 116 172 104 168 98 C160 90 144 88 131 84 Z';
const ARM = 'M72 98 C62 104 58 120 56 140 C54 162 50 182 48 204 C46 220 44 236 42 250 C40 262 46 270 52 268 C58 266 58 256 58 248 C60 230 64 212 68 196 C72 178 76 160 80 150 L74 128 C70 116 68 104 72 98 Z';
const LEG = 'M92 236 C88 262 88 290 90 318 C92 344 92 372 94 400 C95 416 92 428 88 436 C86 442 96 446 108 444 C114 443 114 436 112 428 C110 404 112 376 114 350 C116 320 118 290 119 256 L120 236 Z';

const ZONES = {
  front: [[1, [HEAD]], [2, both(ARM)], [3, [TRUNK]], [5, both(LEG)]],
  back: [[1, [HEAD]], [2, both(ARM)], [4, [TRUNK]], [5, both(LEG)]],
};
// trazos interiores: anatomía mínima, como un estudio a pluma
const DETAIL = {
  front: [
    ...both('M84 128 C96 142 110 142 118 132'), ...both('M96 96 C104 100 112 99 118 96'), 'M120 140 C119 160 121 178 120 190',
    ...both('M96 340 C100 346 108 346 112 340'), ...both('M108 42 C110 40.5 113 40.5 115 42'), 'M120 46 C119 51 121 54 118.5 56', 'M114 62 C118 64 122 64 126 62',
    ...both('M60 170 C62 176 64 180 66 182'),
  ],
  back: [
    'M120 92 C118 130 122 170 120 228', ...both('M88 112 C92 130 100 142 112 138'), ...both('M98 262 C104 270 114 269 120 258'),
    ...both('M98 352 C103 347 108 347 112 352'), 'M103 30 C110 21 130 21 137 30', 'M101 40 C108 32 132 32 139 40', ...both('M100 198 C106 206 112 210 118 210'),
  ],
};
const DOTS = { front: [[120, 196]], back: [[111, 219], [129, 219]] };
// centro de cada zona, para cuando se elige con los botones
const CENTER = { 1: [120, 44], 2: [56, 190], 3: [120, 160], 4: [120, 160], 5: [104, 340] };

function face(side) {
  const id = n => `bm-${side}-${n}`;
  const zones = ZONES[side];
  return `<svg class="bm-face bm-${side}" viewBox="0 0 ${W} 460" aria-hidden="true">
    <defs>
      <pattern id="${id('hatch')}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><line x1="0" y1="0" x2="0" y2="5" class="bm-hl"/></pattern>
      <clipPath id="${id('body')}">${zones.flatMap(([, ds]) => ds).map(d => `<path d="${d}"/>`).join('')}</clipPath>
      ${zones.map(([z, ds]) => `<clipPath id="${id('z' + z)}">${ds.map(d => `<path d="${d}"/>`).join('')}</clipPath>`).join('')}
    </defs>
    <ellipse class="bm-floor" cx="120" cy="446" rx="54" ry="7"/>
    ${zones.map(([z]) => `<g clip-path="url(#${id('z' + z)})"><circle class="bm-ink" data-ink="${z}" cx="${CENTER[z][0]}" cy="${CENTER[z][1]}" r="300"/></g>`).join('')}
    <g clip-path="url(#${id('body')})"><rect class="bm-shade" x="${side === 'front' ? 128 : 0}" y="0" width="112" height="460" fill="url(#${id('hatch')})"/></g>
    ${zones.map(([z, ds]) => `<g class="bm-zone" data-zone="${z}">${ds.map(d => `<path d="${d}"/>`).join('')}</g>`).join('')}
    <g class="bm-detail">${DETAIL[side].map(d => `<path d="${d}"/>`).join('')}${DOTS[side].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.5"/>`).join('')}</g>
  </svg>`;
}

export const bodyMapMarkup = () => `
  <div class="body-map" data-no-mesa>
    <div class="bm-flip" role="img" aria-label="Silueta del cuerpo: tocá la zona donde va el tatuaje">${face('front')}${face('back')}</div>
    <p class="bm-side sc" aria-hidden="true">de frente</p>
    <button type="button" class="enlace bm-turn" aria-pressed="false" aria-label="Girar la silueta: ver la espalda"><span class="t">girar</span><span class="regla" aria-hidden="true"></span></button>
  </div>`;

export function initBodyMap(root, { onSelect }) {
  const box = root.querySelector('.body-map'), flipEl = box.querySelector('.bm-flip'), turnB = box.querySelector('.bm-turn');
  let back = false, sel = 0;

  function setFace(b) {
    back = b;
    box.classList.toggle('back-on', b);
    turnB.setAttribute('aria-pressed', b);
    turnB.setAttribute('aria-label', b ? 'Girar la silueta: ver el frente' : 'Girar la silueta: ver la espalda');
    box.querySelector('.bm-side').textContent = b ? 'de espalda' : 'de frente';
  }
  // la tinta de la zona se expande desde el punto tocado (en coordenadas del dibujo)
  function paint(z, pt) {
    box.querySelectorAll('.bm-zone').forEach(g => g.classList.toggle('on', +g.dataset.zone === z));
    box.querySelectorAll('.bm-ink').forEach(c => {
      const mine = +c.dataset.ink === z;
      if (!mine) { c.classList.remove('on'); return; }
      const [x, y] = pt && c.ownerSVGElement.classList.contains(back ? 'bm-back' : 'bm-front') ? pt : CENTER[z];
      c.classList.remove('on');
      c.setAttribute('cx', x.toFixed(1));
      c.setAttribute('cy', y.toFixed(1));
      void c.getBoundingClientRect();
      if (state.reduced) c.classList.add('on'); else requestAnimationFrame(() => c.classList.add('on'));
    });
  }
  function set(z, pt) {
    if (z === sel && !pt) return;
    sel = z;
    // la espalda se ve de atrás y el torso de frente: la silueta gira sola
    if (z === 4 && !back) setFace(true);
    if (z === 3 && back) setFace(false);
    paint(z, pt);
  }

  turnB.addEventListener('click', () => setFace(!back));
  flipEl.addEventListener('click', e => {
    const g = e.target.closest('.bm-zone');
    if (!g) return;
    const svg = g.ownerSVGElement, m = svg.getScreenCTM();
    let pt = null;
    if (m && e.clientX) {
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
      pt = [p.x, p.y];
    }
    const z = +g.dataset.zone;
    sel = -1;
    set(z, pt);
    onSelect?.(z);
  });
  return { set: z => set(z), face: setFace };
}
