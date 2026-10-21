/* El artista: el retrato que se raspa y su cuaderno, uno al lado del otro.
   El cuaderno se pasa solo a mano: tocando o arrastrando la esquina, con las flechas o deslizando,
   y cada página nueva entra con la mancha de tinta (View Transitions). */
import config from '../config.js';
import { state, $, $$, esc, addTicker, whenNear, on, isMobile } from '../lib/state.js';
import { src, loadImage } from '../lib/media.js';
import { rich, blotIn, esquinas, divisor, roman, grab } from '../lib/ui.js';
import { completeHint } from '../lib/hints.js';
import { inkTransition, pointOf } from '../lib/vt.js';
import { pathOf } from '../lib/router.js';
import { grabado, enlace } from '../lib/buttons.js';

const A = config.artista;
const chapters = A.cuaderno || [];
const firma = A.firma || A.nombre;

const page = (cls, html, n) => `<div class="pg ${cls}">${html}${n ? `<span class="pg-n">${roman(n)}</span>` : ''}</div>`;
// tapa negra con marco grabado y título en hueso
const cover = () => page('cover', `
  <div class="cover-in">${esquinas()}
    <p class="sc">Cuaderno de bocetos</p>
    <h3>${esc(A.nombre)}</h3>
    ${divisor()}
    <p class="sc">${esc(config.estudio.nombre)} · ${esc(config.estudio.ciudad || '')}</p>
    <p class="cover-hint sc" data-hint="book">tocá la esquina →</p>
  </div>`);
const illus = (c, i) => page('illus', `
  <figure class="ink-draw"><img src="${src(c.imagen)}" alt="Boceto que ilustra «${esc(c.titulo)}»" loading="lazy"></figure>
  <p class="nota">${esc(c.nota)}</p>`, i * 2 + 2);
const text = (c, i) => page('text', `
  <p class="ch-n">${roman(i + 1)}</p>
  <h3 class="ink-in">${esc(c.titulo)}</h3>
  ${divisor('pg-div')}
  <p class="ch-t blot" data-blot-manual>${rich(c.texto)}</p>
  <p class="nota side">— ${esc(c.nota)}</p>`, i * 2 + 3);
const combined = (c, i) => page('combo', `
  <figure class="ink-draw"><img src="${src(c.imagen)}" alt="Boceto que ilustra «${esc(c.titulo)}»" loading="lazy"></figure>
  <p class="ch-n">${roman(i + 1)}</p>
  <h3 class="ink-in">${esc(c.titulo)}</h3>
  <p class="ch-t blot" data-blot-manual>${rich(c.texto)}</p>
  <p class="nota">— ${esc(c.nota)}</p>`, i + 2);
const signPage = () => page('sign', `
  <p class="nota">Gracias por leer hasta acá.</p>
  ${divisor('pg-div')}
  <p class="firma">${esc(firma)}</p>
  <p class="sign-s sc">${esc(A.oficio || '')}</p>
  ${grabado('Armá tu tatuaje', { href: pathOf('inicio'), 'data-go': 'inicio', 'data-to': 'pedido' }, { chico: true, cls: 'sign-cta' })}`);
const endpaper = () => page('endpaper', `<span class="ex-libris"><span class="sc">Ex libris</span><b>${esc(config.estudio.nombre)}</b></span>`);

export function buildArtist(el) {
  el.setAttribute('aria-label', `${A.nombre}: retrato y cuaderno`);
  el.innerHTML = `
  <div class="wrap artist-grid">
    <figure class="portrait lamina" data-calm data-no-mesa>${esquinas()}
      <canvas role="img" aria-label="Retrato de ${esc(A.nombre)}"></canvas>
      <figcaption><span class="scratch-hint sc" data-hint="scratch">raspá la tinta con el ${state.coarse ? 'dedo' : 'cursor'}</span>
        ${enlace('Ver retrato completo', {}, { cls: 'reveal-all' })}</figcaption>
    </figure>
    <div class="book-wrap" data-calm>
      <div class="book" data-no-mesa tabindex="0" aria-roledescription="cuaderno" aria-label="Cuaderno de ${esc(A.nombre)}: usá las flechas para pasar las páginas"></div>
      <div class="book-nav placa">
        ${enlace('anterior', { 'data-d': '-1', 'aria-label': 'Página anterior' }, { back: true })}
        <span class="book-pos" aria-live="polite"></span>
        ${enlace('siguiente', { 'data-d': '1', 'aria-label': 'Página siguiente' })}
      </div>
    </div>
  </div>`;
}

export function initArtist(el) {
  const book = $('.book', el), pos = $('.book-pos', el);
  let mobile = null, leaves = [], L = 0, f = 0, fTarget = 0, drag = null, cur = -1;

  function layout() {
    const m = innerWidth < 900;
    if (m === mobile) return;
    mobile = m;
    let fronts, backs, base;
    if (!m) {
      fronts = [cover(), ...chapters.map(text)];
      backs = [...chapters.map(illus), signPage()];
      base = `<div class="base base-l">${endpaper()}</div><div class="base base-r">${endpaper()}</div>`;
    } else {
      fronts = [cover(), ...chapters.map(combined)];
      backs = fronts.map(() => '');
      base = `<div class="base base-r">${signPage()}</div>`;
    }
    L = fronts.length;
    book.classList.toggle('single', m);
    book.innerHTML = base + fronts.map((fr, i) => `<div class="leaf" data-i="${i}"><div class="face front">${fr}</div><div class="face back">${backs[i] ? backs[i] : '<div class="pg blank"></div>'}</div></div>`).join('')
      + `<button type="button" class="corner nx" aria-label="Pasar la página"><span></span></button>`
      + `<button type="button" class="corner pv" aria-label="Volver una página"><span></span></button>`;
    leaves = $$('.leaf', book);
    // en escritorio el cuaderno arranca abierto en el primer capítulo (sin huecos al lado del retrato)
    const k = m ? Math.min(Math.round(f), L) : Math.max(1, Math.min(Math.round(f), L));
    fTarget = f = k;
    cur = -1;
    render();
  }
  layout();
  addEventListener('resize', layout);

  // pasa a la página k: con View Transitions, la página nueva entra con la mancha de tinta desde el punto del gesto;
  // sin ellas, en escritorio la hoja gira (opaca, de una sola vez) y en celular cambia directo
  function turn(k, point) {
    k = Math.max(0, Math.min(L, k));
    if (k === Math.round(fTarget) && f === fTarget) return;
    state.lastInput = state.time;
    // en el celular: una página por pantalla, que entra deslizándose de costado (sin giro 3D)
    if (isMobile()) {
      const dir = Math.sign(k - Math.round(fTarget));
      fTarget = f = k;
      render();
      const p = leaves[k]?.querySelector('.front .pg') || $('.base-r .pg', book);
      if (p && !state.reduced) p.animate([{ transform: `translateX(${dir * 38}%)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.2, .7, .2, 1)' });
      return;
    }
    const swap = () => { fTarget = f = k; render(); };
    const r = book.getBoundingClientRect();
    const t = inkTransition(point || { x: r.left + r.width / 2, y: r.top + r.height / 2 }, swap);
    if (t) return;
    if (mobile || state.reduced) swap(); else fTarget = k;
  }
  const step = (d, point) => turn(Math.round(fTarget) + d, point);
  $('.book-nav', el).addEventListener('click', e => {
    const b = e.target.closest('[data-d]');
    if (b) step(+b.dataset.d, pointOf(e, b));
  });
  book.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  });

  // la esquina: un toque pasa la página; en escritorio, arrastrarla gira la hoja con el gesto
  book.addEventListener('pointerdown', e => {
    if (e.button > 0) return;
    const c = e.target.closest('.corner');
    if (c) {
      const r = book.getBoundingClientRect();
      drag = { corner: c.classList.contains('nx') ? 1 : -1, x: e.clientX, y: e.clientY, f0: Math.round(f), pw: mobile ? r.width : r.width / 2, id: e.pointerId, moved: 0 };
      grab(e, c);
      e.preventDefault();
    } else if (e.pointerType !== 'mouse' && !e.target.closest('a,button')) {
      // deslizar con el dedo sobre la página
      drag = { swipe: true, x: e.clientX, y: e.clientY, id: e.pointerId, moved: 0 };
      grab(e, book);
    }
  });
  addEventListener('pointermove', e => {
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.x;
    drag.moved = Math.max(drag.moved, Math.abs(dx));
    if (drag.swipe || mobile || drag.moved <= 6) return;
    book.classList.add('dragging');
    // la hoja sigue al dedo, sin pasar de la página vecina
    const v = drag.f0 - dx / (drag.pw * 1.1);
    fTarget = f = Math.max(Math.max(0, drag.f0 - 1), Math.min(Math.min(L, drag.f0 + 1), v));
    state.lastInput = state.time;
    render();
  });
  const up = e => {
    if (!drag || drag.id !== e.pointerId) return;
    const d = drag; drag = null;
    book.classList.remove('dragging');
    if (e.type !== 'pointerup') { fTarget = Math.round(f); return; }
    const point = { x: e.clientX, y: e.clientY };
    if (d.swipe) {
      const dx = e.clientX - d.x, dy = e.clientY - d.y;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) { step(dx < 0 ? 1 : -1, point); completeHint('book'); }
      return;
    }
    completeHint('book');
    if (d.moved <= 6 || mobile) { turn(d.f0 + d.corner, point); return; }
    // al soltar, la hoja termina de girar hacia donde iba (o vuelve si casi no se movió)
    const done = f - d.f0;
    fTarget = Math.abs(done) > .25 ? d.f0 + Math.sign(done) : d.f0;
  };
  addEventListener('pointerup', up);
  addEventListener('pointercancel', up);

  // dibujo de las hojas: solo anima mientras una hoja está girando
  addTicker(dt => {
    if (drag && !drag.swipe || f === fTarget) return;
    f += (fTarget - f) * Math.min(1, dt * 9);
    if (Math.abs(f - fTarget) < .002) f = fTarget;
    render();
  });
  function render() {
    const phone = isMobile(), at = Math.round(f);
    leaves.forEach((lf, i) => {
      const t = Math.max(0, Math.min(1, f - i));
      lf.style.transform = phone ? '' : `rotateY(${-180 * t}deg)`;
      lf.style.zIndex = t > 0 && t < 1 ? 3 * L : t >= 1 ? i + 1 : 2 * L - i;
      lf.style.setProperty('--t', phone ? 0 : t);
      // en celular (una sola página) la hoja ya pasada no queda a la vista; en el teléfono, solo la actual
      lf.style.visibility = phone ? (i === at ? '' : 'hidden') : mobile && t >= 1 ? 'hidden' : '';
    });
    const s = Math.round(f);
    book.classList.toggle('at-start', fTarget <= 0);
    book.classList.toggle('at-end', fTarget >= L);
    $$('.book-nav [data-d]', el).forEach(b => { b.disabled = +b.dataset.d < 0 ? fTarget <= 0 : fTarget >= L; });
    if (s === cur || f !== fTarget) return;
    cur = s;
    $$('.pg', book).forEach(p => p.classList.remove('inked'));
    const show = [];
    if (mobile) show.push(leaves[s]?.querySelector('.front .pg') || $('.base-r .pg', book));
    else {
      show.push(s > 0 ? leaves[s - 1].querySelector('.back .pg') : $('.base-l .pg', book));
      show.push(s < L ? leaves[s].querySelector('.front .pg') : $('.base-r .pg', book));
    }
    show.forEach(p => {
      if (!p) return;
      p.classList.add('inked');
      const t = $('.ch-t', p);
      if (t) blotIn(t, .25);
    });
    pos.textContent = s === 0 ? 'tapa' : s >= L ? 'fin' : `${s} de ${L - 1}`;
  }

  // al llegar a la página, la tinta de las páginas abiertas se vuelve a dibujar
  on('page', p => { if (p === 'artista') { cur = -1; render(); } });
  whenNear($('.portrait', el), () => initPortrait($('.portrait', el)), '300px');
}

/* ---- retrato que se revela raspando la tinta ---- */
function initPortrait(fig) {
  const canvas = $('canvas', fig);
  const ctx = canvas.getContext('2d');
  let W, H, dpr, photo = null;
  const mask = document.createElement('canvas'), fresh = document.createElement('canvas'), ink = document.createElement('canvas'), tmp = document.createElement('canvas');
  const mc = mask.getContext('2d'), fc = fresh.getContext('2d'), ic = ink.getContext('2d'), tc = tmp.getContext('2d');
  let dirty = true, last = null, revealedAll = false;

  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    const nw = Math.round(r.width * dpr), nh = Math.round(r.height * dpr);
    if (nw === W && nh === H) return;
    const old = W ? mask : null;
    let keep = null;
    if (old) { keep = document.createElement('canvas'); keep.width = W; keep.height = H; keep.getContext('2d').drawImage(mask, 0, 0); }
    W = nw; H = nh;
    for (const c of [canvas, mask, fresh, ink, tmp]) { c.width = W; c.height = H; }
    if (keep) mc.drawImage(keep, 0, 0, W, H);
    paintInk();
    dirty = true;
  }

  // capa de tinta: negro con manchas, vetas y algún trazo suelto
  function paintInk() {
    ic.fillStyle = '#141317';
    ic.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * W, y = Math.random() * H, r = (20 + Math.random() * 90) * dpr;
      const g = ic.createRadialGradient(x, y, 0, x, y, r);
      const a = Math.random() * .08;
      g.addColorStop(0, Math.random() > .5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a * 3})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ic.fillStyle = g;
      ic.fillRect(0, 0, W, H);
    }
    ic.strokeStyle = 'rgba(236,232,225,.08)';
    ic.lineWidth = dpr;
    for (let i = 0; i < 26; i++) {
      ic.beginPath();
      let x = Math.random() * W, y = Math.random() * H;
      ic.moveTo(x, y);
      for (let k = 0; k < 4; k++) { x += (Math.random() - .5) * 120 * dpr; y += (Math.random() - .3) * 80 * dpr; ic.quadraticCurveTo(x + 20 * dpr, y - 20 * dpr, x, y); }
      ic.stroke();
    }
  }

  function stamp(x, y, r) {
    // borde orgánico: un círculo grande y varios chicos alrededor
    for (const [c, col, rr] of [[mc, '255,255,255', r], [fc, '236,230,216', r * 1.9]]) {
      for (let k = 0; k < 5; k++) {
        const a = Math.random() * Math.PI * 2, d = k ? rr * (.35 + Math.random() * .45) : 0, s = k ? rr * (.35 + Math.random() * .35) : rr;
        const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
        const g = c.createRadialGradient(px, py, 0, px, py, s);
        g.addColorStop(0, `rgba(${col},${c === mc ? .95 : .5})`);
        g.addColorStop(.6, `rgba(${col},${c === mc ? .7 : .25})`);
        g.addColorStop(1, `rgba(${col},0)`);
        c.fillStyle = g;
        c.beginPath(); c.arc(px, py, s, 0, Math.PI * 2); c.fill();
      }
    }
    dirty = true;
  }
  function stroke(x, y) {
    const r = Math.max(18, Math.min(W, H) * .07);
    if (!last) { stamp(x, y, r); last = [x, y]; return; }
    const d = Math.hypot(x - last[0], y - last[1]), n = Math.max(1, Math.ceil(d / (r * .3)));
    for (let i = 1; i <= n; i++) stamp(last[0] + (x - last[0]) * i / n, last[1] + (y - last[1]) * i / n, r);
    last = [x, y];
  }

  const local = e => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr]; };
  let down = false;
  let scraped = 0;
  canvas.addEventListener('pointerdown', e => { grab(e, canvas); down = true; last = null; if (++scraped > 1) completeHint('scratch'); stroke(...local(e)); try { canvas.setPointerCapture(e.pointerId); } catch {} });
  canvas.addEventListener('pointermove', e => {
    if (e.pointerType === 'mouse' || down) { stroke(...local(e)); state.lastInput = state.time; if (++scraped > 40) completeHint('scratch'); }
  });
  const end = () => { down = false; last = null; };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('pointerleave', end);
  $('.reveal-all', fig).onclick = () => { revealedAll = true; mc.fillStyle = '#fff'; mc.fillRect(0, 0, W, H); dirty = true; };

  // trazo fantasma que invita a raspar (sobre los ojos)
  let hint = state.reduced ? -1 : 0;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (photo) {
      const s = Math.max(W / photo.width, H / photo.height), w = photo.width * s, h = photo.height * s;
      ctx.filter = 'grayscale(1) contrast(1.1)';
      ctx.drawImage(photo, (W - w) / 2, (H - h) / 2 * .6, w, h);
      ctx.filter = 'none';
    } else samplePortrait(ctx, W, H, dpr);
    tc.globalCompositeOperation = 'source-over';
    tc.clearRect(0, 0, W, H);
    tc.drawImage(ink, 0, 0);
    tc.globalCompositeOperation = 'source-atop';
    tc.drawImage(fresh, 0, 0); // la tinta recién movida brilla en hueso y se seca a negro
    tc.globalCompositeOperation = 'destination-out';
    tc.drawImage(mask, 0, 0);
    ctx.drawImage(tmp, 0, 0);
  }

  let freshLeft = 0;
  const vis = { on: false };
  new IntersectionObserver(([e]) => { vis.on = e.isIntersecting; }, { threshold: .3 }).observe(canvas);
  addTicker(dt => {
    if (!vis.on || !W) return;
    if (hint >= 0 && hint < 1.6) {
      hint += dt;
      const t = Math.min(1, hint / 1.6);
      stroke(W * (.25 + .5 * t), H * (.36 + .05 * Math.sin(t * 9)));
      if (hint >= 1.6) { last = null; hint = -1; }
    }
    // la tinta fresca se seca
    fc.globalCompositeOperation = 'destination-out';
    fc.fillStyle = `rgba(0,0,0,${Math.min(1, dt * 1.1)})`;
    fc.fillRect(0, 0, W, H);
    fc.globalCompositeOperation = 'source-over';
    if (dirty) freshLeft = 2.5;
    if (freshLeft > 0) { freshLeft -= dt; draw(); dirty = false; }
  });

  size();
  new ResizeObserver(size).observe(canvas);
  if (A.retrato) loadImage(src(A.retrato)).then(im => { photo = im; dirty = true; }).catch(() => { dirty = true; });
}

// retrato dibujado de muestra (estudio de proporciones a lo Leonardo) cuando no hay foto
function samplePortrait(c, W, H, dpr) {
  c.fillStyle = '#efede8'; c.fillRect(0, 0, W, H);
  c.strokeStyle = '#141317'; c.lineCap = 'round';
  const cx = W / 2, cy = H * .45, rx = W * .26, ry = H * .3;
  const wob = (fn, n = 60) => { c.beginPath(); for (let i = 0; i <= n; i++) { const [x, y] = fn(i / n); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); };
  c.lineWidth = 1.2 * dpr;
  wob(t => { const a = t * Math.PI * 2; return [cx + Math.cos(a) * rx * (1 + .03 * Math.sin(a * 5)), cy + Math.sin(a) * ry * (a > 0 && a < Math.PI ? 1.05 : .95)]; }, 90);
  c.lineWidth = .6 * dpr; c.globalAlpha = .5;
  [[cx - rx * 1.3, cy, cx + rx * 1.3, cy], [cx, cy - ry * 1.3, cx, cy + ry * 1.3], [cx - rx, cy + ry * .35, cx + rx, cy + ry * .35], [cx - rx, cy - ry * .4, cx + rx, cy - ry * .4]]
    .forEach(([a, b, d, e]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke(); });
  c.globalAlpha = 1; c.lineWidth = 1.4 * dpr;
  for (const s of [-1, 1]) {
    wob(t => [cx + s * rx * .42 + Math.cos(t * Math.PI * 2) * rx * .2, cy - ry * .02 + Math.sin(t * Math.PI * 2) * ry * .06]);
    c.beginPath(); c.arc(cx + s * rx * .42, cy - ry * .02, rx * .06, 0, Math.PI * 2); c.fill();
    wob(t => [cx + s * rx * (.2 + t * .45), cy - ry * .18 - Math.sin(t * Math.PI) * ry * .06]);
  }
  wob(t => [cx - rx * .06 + Math.sin(t * Math.PI) * rx * .08, cy + ry * (.02 + t * .33)]);
  wob(t => [cx - rx * .3 + t * rx * .6, cy + ry * .58 + Math.sin(t * Math.PI) * ry * .05]);
  c.font = `italic ${14 * dpr}px "EB Garamond", Georgia, serif`; c.fillStyle = '#4a4752';
  c.fillText('retrato de muestra', W * .08, H * .94);
}
