/* Armá tu tatuaje: la lámina principal. Taller en cinco pasos → acta de stencil → mensaje de WhatsApp.
   El paso I es el David (la misma estatua del hero, en chico y con pedestal): se gira arrastrando y tocar una zona la elige.
   La zona elegida en la galería del hero ("Quiero uno en …") llega ya marcada.
   En el celular el taller es un flujo a pantalla completa: una pregunta por pantalla, Anterior/Siguiente al pulgar,
   el acta en una hoja inferior y, al final, el resumen con "Enviar por WhatsApp". En Inicio queda una lámina-invitación. */
import config from '../config.js';
import { state, $, esc, on, emit, addTicker, whenNear, visibility, isMobile, mobileMQ } from '../lib/state.js';
import { src } from '../lib/media.js';
import { ZONES, zoneWorks, unit } from '../lib/zones.js';
import { openLightbox } from '../lib/lightbox.js';
import { pointOf } from '../lib/vt.js';
import { esquinas, cab, ROMAN, roman, grab } from '../lib/ui.js';
import { bodyMapMarkup, initBodyMap } from '../lib/bodymap.js';
import { grabado, enlace, chip } from '../lib/buttons.js';

const P = config.pedido;
const O = state.order;
const STEPS = ['Zona', 'Tamaño', 'Estilo', 'Idea', 'Disponibilidad'];
// nombres cortos para que los cinco pasos entren en el ancho de un celular
const SHORT = ['Zona', 'Tamaño', 'Estilo', 'Idea', 'Cuándo'];
const LAST = STEPS.length - 1, SUMMARY = STEPS.length; // el resumen es una pantalla más, solo en el flujo del celular
const zoneName = z => config.zonas.find(x => x.zona3d === z)?.nombre;
const sizeHint = cm => cm <= 5 ? 'como una moneda grande' : cm <= 10 ? 'como la palma de la mano' : cm <= 18 ? 'medio antebrazo' : cm <= 28 ? 'un antebrazo entero' : 'pieza grande, por sesiones';
const X = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5 L19 19 M19 5 L5 19"/></svg>';
const CAP = 'arrastrá para girar · tocá una zona';

// el David del paso I, en un marco grabado (sin WebGL 2 queda la silueta dibujada)
const davidMarkup = () => `
  <div class="david-marco" data-no-mesa>${esquinas()}
    <canvas class="st-mini" aria-label="El David: arrastrá para girarlo y tocá una zona del cuerpo para elegirla"></canvas>
    <p class="dm-cap sc" aria-live="polite">${CAP}</p>
  </div>`;

export function buildOrder(el) {
  O.size = P.tamanoInicial;
  const marks = [];
  for (let c = 0; c <= P.tamanoMax; c++) marks.push(c);
  el.innerHTML = `
  <div class="wrap"><div class="lamina taller" data-calm>${esquinas()}
  ${cab(config.secciones.pedido, 'Armá tu tatuaje', 'Cinco pasos y te queda el acta de stencil lista para mandar por WhatsApp.')}
  <div class="taller-inv">${grabado('Armá tu tatuaje', { 'data-flow': '' })}</div>
  <div class="order-grid">
    <div class="workshop">
      <div class="steps-nav" role="tablist" aria-label="Pasos del pedido">
        ${STEPS.map((s, i) => `<button type="button" role="tab" id="ot${i}" aria-controls="op${i}" aria-selected="${i === 0}" data-step="${i}"><span class="rn">${ROMAN[i]}</span><span class="sc sl">${s}</span><span class="sc ss" aria-hidden="true">${SHORT[i]}</span></button>`).join('')}
      </div>
      <div class="steps-rule" aria-hidden="true"><span></span></div>
      <p class="step-count sc" aria-live="polite"></p>

      <section class="step" role="tabpanel" id="op0" aria-labelledby="ot0">
        <h3>¿En qué parte del cuerpo?</h3>
        ${state.gl2 ? davidMarkup() : bodyMapMarkup()}
        <div class="chips" role="group" aria-label="Zona">
          ${config.zonas.map(z => chip(z.nombre, { 'data-zone': z.zona3d, 'aria-pressed': 'false' })).join('')}
        </div>
        <div class="zone-works" hidden>
          <p class="zw-t"></p>
          <div class="zw-row"></div>
        </div>
      </section>

      <section class="step" role="tabpanel" id="op1" aria-labelledby="ot1" hidden>
        <h3>¿De qué tamaño, más o menos?</h3>
        <div class="ruler-box">
          <svg class="ruler" viewBox="0 0 ${P.tamanoMax * 20 + 40} 110" role="slider" tabindex="0" aria-label="Tamaño en centímetros"
            aria-valuemin="${P.tamanoMin}" aria-valuemax="${P.tamanoMax}" aria-valuenow="${O.size}" data-no-mesa>
            <rect class="ruler-body" x="8" y="30" width="${P.tamanoMax * 20 + 24}" height="62"/>
            <rect class="ruler-in" x="13" y="35" width="${P.tamanoMax * 20 + 14}" height="52"/>
            ${marks.map(c => `<line x1="${20 + c * 20}" y1="35" x2="${20 + c * 20}" y2="${c % 5 ? 46 : 58}"/>${c % 5 ? '' : `<text x="${20 + c * 20}" y="80">${c}</text>`}`).join('')}
            <rect class="ruler-fill" x="20" y="35" height="4" width="0"/>
            <g class="ruler-handle"><line x1="0" y1="18" x2="0" y2="96"/><path d="M0 6 L7 14 L0 22 L-7 14 Z"/></g>
          </svg>
        </div>
        <p class="size-read"><b>${O.size} cm</b> <span>${sizeHint(O.size)}</span></p>
      </section>

      <section class="step" role="tabpanel" id="op2" aria-labelledby="ot2" hidden>
        <h3>¿Qué estilo te tira?</h3>
        <div class="chips" role="group" aria-label="Estilo">
          ${config.estilos.map(s => chip(s.nombre, { 'data-ostyle': s.nombre, 'aria-pressed': 'false' })).join('')}
          ${chip('No sé, aconsejame', { 'data-ostyle': 'No sé, aconsejame', 'aria-pressed': 'false' })}
        </div>
      </section>

      <section class="step" role="tabpanel" id="op3" aria-labelledby="ot3" hidden>
        <h3>Contame la idea</h3>
        <label class="field"><span class="sc">Tu nombre</span><input type="text" name="name" autocomplete="given-name" maxlength="60"></label>
        <label class="field"><span class="sc">La idea</span><textarea name="idea" rows="4" maxlength="600" placeholder="Ej.: una calavera con velo y flores, que siga la forma del antebrazo"></textarea></label>
        <div class="ref">
          <label class="drop" data-no-mesa>
            <input type="file" accept="image/*" class="sr-only">
            <span class="drop-txt">Arrastrá una imagen de referencia o tocá para elegirla</span>
            <img class="drop-img" alt="Tu imagen de referencia" hidden>
          </label>
          <p class="note-wa">WhatsApp no recibe imágenes por link: cuando se abra el chat, adjuntá la referencia ahí.</p>
        </div>
      </section>

      <section class="step" role="tabpanel" id="op4" aria-labelledby="ot4" hidden>
        <h3>¿Cuándo podés venir?</h3>
        <p class="field-t sc">Días</p>
        <div class="chips" role="group" aria-label="Días">${P.dias.map(d => chip(d, { 'data-day': d, 'aria-pressed': 'false' })).join('')}</div>
        <p class="field-t sc">Franja</p>
        <div class="chips" role="group" aria-label="Franja horaria">${P.franjas.map(d => chip(d, { 'data-slot': d, 'aria-pressed': 'false' })).join('')}</div>
      </section>

      <div class="step-nav">
        ${enlace('Anterior', {}, { back: true, cls: 'prev' })}
        ${grabado('Siguiente', {}, { chico: true, cls: 'next' })}
      </div>
    </div>

    <aside class="acta" id="acta" aria-label="Acta de pedido">
      <button type="button" class="acta-manija" aria-label="Cerrar el acta"><span aria-hidden="true"></span></button>
      <header class="acta-h"><span class="sc">Acta de stencil</span><span class="acta-n">N.º ${String(Math.floor(Math.random() * 900) + 100)}</span></header>
      <dl>
        ${[['zone', 'Zona'], ['size', 'Tamaño'], ['style', 'Estilo'], ['idea', 'Idea'], ['ref', 'Referencia'], ['avail', 'Disponibilidad']]
          .map(([k, t], i) => `<div><dt><span class="rn">${ROMAN[i]}</span><span class="sc">${t}</span></dt><dd data-f="${k}">—</dd></div>`).join('')}
      </dl>
      <div class="acta-firma"><span class="acta-name" data-f="name"></span><span class="acta-line sc">firma</span></div>
      ${grabado('Enviar por WhatsApp', { href: `https://wa.me/${config.contacto.whatsapp}`, target: '_blank', rel: 'noopener' }, { chico: true, cls: 'wa-btn' })}
      <p class="wa-num">Si no se abre, escribime al ${esc(config.contacto.whatsappVisible)} ${enlace('copiar', { 'aria-label': 'Copiar el número de WhatsApp' }, { cls: 'copy' })} <span class="copied" aria-live="polite"></span></p>
    </aside>
  </div>
  </div></div>`;
}

export function initOrder(el) {
  /* ---- el flujo del celular: un panel a pantalla completa al que se mudan el taller y el acta ---- */
  const flow = document.createElement('div');
  flow.className = 'flujo';
  flow.setAttribute('role', 'dialog');
  flow.setAttribute('aria-modal', 'true');
  flow.setAttribute('aria-label', 'Armá tu tatuaje');
  flow.inert = true;
  flow.innerHTML = `<div class="fl-marco" aria-hidden="true">${esquinas()}</div>
    <header class="fl-top"><span class="fl-t">Armá tu tatuaje</span><button type="button" class="icon fl-x" aria-label="Salir del taller (lo elegido queda guardado)">${X}</button></header>
    <div class="fl-slot"></div>
    <button type="button" class="fl-acta-btn" aria-controls="acta" aria-expanded="false"><span class="fl-manija" aria-hidden="true"></span><span class="sc">ver acta</span> <span class="fl-acta-n"></span></button>
    <div class="fl-scrim"></div>`;
  document.body.append(flow);
  // los nodos del taller se mudan entre la lámina y el flujo: se buscan en los dos lados
  const Q = sel => el.querySelector(sel) || flow.querySelector(sel);
  const QQ = sel => [...el.querySelectorAll(sel), ...flow.querySelectorAll(sel)];

  const grid = Q('.order-grid'), work = Q('.workshop'), acta = Q('.acta'), slot = Q('.fl-slot');
  const steps = QQ('.step'), tabs = QQ('[data-step]'), prevB = Q('.prev'), nextB = Q('.next'), count = Q('.step-count');
  const actaBtn = Q('.fl-acta-btn');
  let step = 0, flowOn = false, mini = null;

  const slideIn = (node, dir) => {
    if (state.reduced || !node || !dir) return;
    node.animate([{ transform: `translateX(${dir * 56}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 360, easing: 'cubic-bezier(.2, .7, .2, 1)' });
  };
  const go = i => {
    const before = step;
    step = Math.max(0, Math.min(flowOn ? SUMMARY : LAST, i));
    steps.forEach((s, k) => { s.hidden = k !== step; });
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', k === step); t.classList.toggle('done', k < step); });
    // progreso: un filete que avanza con cada paso
    Q('.steps-rule span').style.width = (Math.min(step + 1, STEPS.length) / STEPS.length * 100) + '%';
    count.innerHTML = step === SUMMARY ? 'Resumen · <span class="sn">el acta completa</span>'
      : `Paso <b class="rn">${ROMAN[step]}</b> de ${ROMAN[LAST]} · <span class="sn">${STEPS[step]}</span>`;
    prevB.disabled = step === 0;
    Q('.next .t').textContent = step === SUMMARY ? 'Enviar por WhatsApp' : step === LAST ? (flowOn ? 'Ver el resumen' : 'Ver el acta') : 'Siguiente';
    Q('.step-nav').classList.toggle('first', step === 0);
    flow.dataset.step = step;
    if (flowOn && before !== step) {
      flow.classList.remove('acta-open');
      slot.scrollTo({ top: 0 });
      slideIn(step === SUMMARY ? acta : steps[step], step > before ? 1 : -1);
    }
  };
  tabs.forEach(t => t.addEventListener('click', () => go(+t.dataset.step)));
  prevB.onclick = () => go(step - 1);
  nextB.onclick = () => {
    if (step === SUMMARY) { open(Q('.wa-btn').href, '_blank', 'noopener'); return; }
    if (step === LAST && !flowOn) { acta.scrollIntoView({ behavior: state.reduced ? 'auto' : 'smooth', block: 'center' }); return; }
    go(step + 1);
  };

  /* ---- abrir y cerrar el flujo (lo elegido queda guardado) ---- */
  let returnFocus = null;
  function openFlow({ step: s } = {}) {
    if (!flowOn) return;
    if (s != null) go(s);
    returnFocus = document.activeElement;
    flow.inert = false;
    flow.classList.add('open');
    document.documentElement.classList.add('flow-on');
    setTimeout(() => Q('.fl-x').focus({ preventScroll: true }), state.reduced ? 0 : 420);
  }
  function closeFlow() {
    if (!flow.classList.contains('open')) return;
    flow.classList.remove('open', 'acta-open');
    actaBtn.setAttribute('aria-expanded', 'false');
    flow.inert = true;
    document.documentElement.classList.remove('flow-on');
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  }
  const setActa = v => { flow.classList.toggle('acta-open', v); actaBtn.setAttribute('aria-expanded', v); };
  Q('.fl-x').onclick = closeFlow;
  actaBtn.onclick = () => setActa(!flow.classList.contains('acta-open'));
  Q('.fl-scrim').onclick = () => setActa(false);
  Q('.acta-manija').onclick = () => setActa(false);
  addEventListener('keydown', e => {
    if (e.key !== 'Escape' || !flow.classList.contains('open')) return;
    if (flow.classList.contains('acta-open')) setActa(false); else closeFlow();
  });
  on('flow-open', o => openFlow(o || {}));
  el.addEventListener('click', e => { if (e.target.closest('[data-flow]')) openFlow(); });

  // deslizar de costado también cambia de paso (salvo sobre la regla, el David, los campos o la fila de trabajos)
  let sw = null;
  slot.addEventListener('pointerdown', e => {
    if (!flowOn) return;
    if (e.target.closest('[data-no-mesa],input,textarea,.zw-row,.ruler-box')) return;
    sw = { id: e.pointerId, x: e.clientX, y: e.clientY };
  });
  slot.addEventListener('pointerup', e => {
    if (!sw || sw.id !== e.pointerId) return;
    const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
    sw = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(step + (dx < 0 ? 1 : -1));
  });
  slot.addEventListener('pointercancel', () => { sw = null; });

  // en el celular el taller vive en el flujo; en escritorio, en la lámina
  function mount(m) {
    flowOn = m;
    if (m) slot.append(work, acta);
    else { closeFlow(); grid.append(work, acta); }
    go(step);
  }

  /* ---- zona: el David (o la silueta) + los trabajos que ya hay en esa zona ---- */
  const zw = Q('.zone-works'), zwRow = Q('.zw-row'), cap = Q('.dm-cap');
  const setZone = (z, from) => {
    O.zone = z;
    QQ('.chip[data-zone]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.zone === z));
    if (from !== 'map') body?.set(z);
    if (mini) {
      mini.sel = z;
      // la espalda se ve de atrás: el David gira solo cuando la zona llega desde un botón
      if (from !== 'statue') mini.face(z === 4 ? Math.PI : 0);
    }
    if (cap) cap.textContent = z ? `zona elegida: ${zoneName(z).toLowerCase()}` : CAP;
    const Z = ZONES[z];
    zw.hidden = !Z?.items.length;
    if (Z) {
      Q('.zw-t').innerHTML = `${Z.demo ? 'Bocetos de muestra' : 'Trabajos'} en ${esc(Z.nombre.toLowerCase())} <small class="sc">${Z.items.length} ${unit(z)}</small>`;
      zwRow.innerHTML = Z.items.slice(0, 8).map((it, i) => `<button type="button" class="zw" data-i="${i}"><img src="${src(it.path, true)}" alt="Tatuaje en ${esc(Z.nombre.toLowerCase())}, trabajo ${i + 1}" loading="lazy"></button>`).join('');
    }
    update();
  };
  const body = state.gl2 ? null : initBodyMap(work, { onSelect: z => setZone(z, 'map') });
  QQ('.chip[data-zone]').forEach(b => b.addEventListener('click', () => setZone(+b.dataset.zone)));
  zwRow.addEventListener('click', e => { const b = e.target.closest('.zw'); if (b && O.zone) openLightbox(zoneWorks(ZONES[O.zone]), +b.dataset.i, pointOf(e, b)); });
  // zona elegida en la galería del hero: llega marcada al paso I y cae una gota al aterrizar
  on('pick-zone', z => { setZone(z); go(0); });
  on('zone-arrived', z => {
    const c = Q(`.chip[data-zone="${z}"]`);
    if (!c || state.reduced) return;
    c.classList.remove('landed'); void c.offsetWidth; c.classList.add('landed');
    const r = c.getBoundingClientRect();
    emit('drop', { x: r.left + r.width / 2, y: r.top + r.height / 2, s: .8 });
  });

  // el David del paso I: misma clase que el hero, sin volver a cargar el modelo (geometría y material compartidos)
  const marco = Q('.david-marco');
  if (marco) whenNear(marco, async () => {
    const { Statue } = await import('../statue/statue.js');
    const canvas = $('canvas', marco);
    mini = new Statue(canvas, {
      fit: .96, fitMobile: .96, shiftMobile: 0, dragAnywhere: true,
      onSelect: z => setZone(z, 'statue'),
      onHover: z => { cap.textContent = z ? zoneName(z).toLowerCase() : (O.zone ? `zona elegida: ${zoneName(O.zone).toLowerCase()}` : CAP); },
    });
    mini.sel = O.zone || 0;
    if (O.zone === 4) mini.rotY = Math.PI;
    const vis = visibility(canvas, '0px');
    addTicker(dt => { if (vis.on && step === 0 && !document.hidden) mini.frame(dt); });
    on('lite', () => mini.resize());
  }, '500px');

  /* ---- tamaño ---- */
  const ruler = Q('.ruler'), handle = Q('.ruler-handle'), fill = Q('.ruler-fill');
  const setSize = cm => {
    cm = Math.round(Math.max(P.tamanoMin, Math.min(P.tamanoMax, cm)));
    O.size = cm;
    handle.setAttribute('transform', `translate(${20 + cm * 20} 0)`);
    fill.setAttribute('width', cm * 20);
    ruler.setAttribute('aria-valuenow', cm);
    ruler.setAttribute('aria-valuetext', `${cm} centímetros`);
    Q('.size-read').innerHTML = `<b>${cm} cm</b> <span>${sizeHint(cm)}</span>`;
    update();
  };
  let rdrag = false;
  const fromEvent = e => {
    const r = ruler.getBoundingClientRect(), vb = ruler.viewBox.baseVal;
    return ((e.clientX - r.left) / r.width * vb.width - 20) / 20;
  };
  ruler.addEventListener('pointerdown', e => { rdrag = true; grab(e, ruler); setSize(fromEvent(e)); });
  ruler.addEventListener('pointermove', e => { if (rdrag) setSize(fromEvent(e)); });
  ruler.addEventListener('pointerup', () => { rdrag = false; });
  ruler.addEventListener('pointercancel', () => { rdrag = false; });
  ruler.addEventListener('keydown', e => {
    const k = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 5, PageDown: -5 }[e.key];
    if (k) { e.preventDefault(); setSize(O.size + k); }
  });

  /* ---- estilo, días, franjas ---- */
  const single = (attr, key) => QQ(`[data-${attr}]`).forEach(b => b.addEventListener('click', () => {
    const v = b.getAttribute('aria-pressed') !== 'true';
    QQ(`[data-${attr}]`).forEach(x => x.setAttribute('aria-pressed', 'false'));
    b.setAttribute('aria-pressed', v);
    O[key] = v ? b.dataset[attr] : null;
    update();
  }));
  const multi = (attr, key) => QQ(`[data-${attr}]`).forEach(b => b.addEventListener('click', () => {
    b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true');
    O[key] = QQ(`[data-${attr}][aria-pressed="true"]`).map(x => x.dataset[attr]);
    update();
  }));
  single('ostyle', 'style');
  multi('day', 'days');
  multi('slot', 'slots');

  /* ---- idea, nombre, referencia ---- */
  Q('[name="idea"]').addEventListener('input', e => { O.idea = e.target.value.trim(); update(); });
  Q('[name="name"]').addEventListener('input', e => { O.name = e.target.value.trim(); update(); });
  const drop = Q('.drop'), file = Q('input[type="file"]'), dimg = Q('.drop-img');
  const setRef = f => {
    if (!f || !f.type.startsWith('image/')) return;
    O.ref = f.name;
    dimg.src = URL.createObjectURL(f);
    dimg.hidden = false;
    Q('.drop-txt').textContent = f.name;
    update();
  };
  file.addEventListener('change', () => setRef(file.files[0]));
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('over'); setRef(e.dataTransfer.files[0]); });

  /* ---- ficha + mensaje ---- */
  const wa = Q('.wa-btn');
  const field = k => Q(`[data-f="${k}"]`);
  const avail = () => [O.days.join(', '), O.slots.join(', ').toLowerCase()].filter(Boolean).join(' · ');
  function message() {
    const L = [P.saludo || `¡Hola! Quiero pedir un turno en ${config.estudio.nombre}.`];
    if (O.name) L.push(`• Nombre: ${O.name}`);
    L.push(`• Zona: ${zoneName(O.zone) || 'a definir'}`);
    L.push(`• Tamaño: ~${O.size} cm`);
    L.push(`• Estilo: ${O.style || 'a definir'}`);
    if (O.idea) L.push(`• Idea: ${O.idea}`);
    if (O.ref) L.push('• Referencia: la adjunto en este chat');
    L.push(`• Disponibilidad: ${avail() || 'a coordinar'}`);
    return L.join('\n');
  }
  let lastName = null;
  function update() {
    field('zone').textContent = zoneName(O.zone) || '—';
    field('size').textContent = O.size ? `~${O.size} cm · ${sizeHint(O.size)}` : '—';
    field('style').textContent = O.style || '—';
    field('idea').textContent = O.idea || '—';
    field('ref').textContent = O.ref ? 'la adjuntás en el chat' : '—';
    field('avail').textContent = avail() || '—';
    // el nombre firma el acta
    if (O.name !== lastName) { lastName = O.name; field('name').textContent = O.name || ''; }
    wa.href = `https://wa.me/${config.contacto.whatsapp}?text=${encodeURIComponent(message())}`;
    // manija del flujo: cuántos de los cinco pasos ya tienen algo
    const done = [O.zone, O.size, O.style, O.idea || O.name || O.ref, avail()].filter(Boolean).length;
    Q('.fl-acta-n').innerHTML = `(<span class="rn">${roman(done)}</span> de <span class="rn">${ROMAN[LAST]}</span>)`;
  }
  Q('.copy').onclick = async () => {
    const msg = Q('.copied');
    try { await navigator.clipboard.writeText('+' + config.contacto.whatsapp); msg.textContent = 'copiado'; }
    catch { msg.textContent = config.contacto.whatsapp; }
    setTimeout(() => { msg.textContent = ''; }, 2500);
  };
  setSize(O.size);
  update();
  mount(isMobile());
  mobileMQ.addEventListener('change', e => mount(e.matches));
}
