/* Taller "Armá tu tatuaje": pantalla completa que sube desde abajo, 5 pasos y resumen con el link de WhatsApp.
   Paso 1: el mismo David del hero, mudado acá (sin crear otro contexto WebGL). */
import config from '../config.js';
import { $, esc, emit } from '../lib/state.js';
import { zonaPorId, zonaPor3d } from '../lib/media.js';
import { PEDESTAL } from './comunes.js';

const C = config.taller;
const T = { zona: null, cm: C.tamanoInicial, estilo: null, idea: '', cuando: null };
let paso = 0, abierto = false, volverFoco = null, estatua = null, pedirEstatua = null;
const taller = $('#taller'), cuerpo = $('#tCuerpo');
const nombreZona = id => zonaPorId(id)?.nombre || '—';

const PASOS = [
  () => `<h2>¿En qué parte del cuerpo?</h2><div class="t-estatua" id="tEstatua" data-nomesa><div class="estatua-ph" aria-hidden="true">${PEDESTAL}</div></div>
    <div class="opciones" role="group" aria-label="Zona">${config.zonas.map(z => `<button type="button" class="chip" data-v="${z.id}" aria-pressed="${T.zona === z.id}">${esc(z.nombre)}</button>`).join('')}</div>`,
  () => `<h2>¿De qué tamaño?</h2><div class="cm" id="cmv">${T.cm} cm</div><p class="nota">Aproximado, de punta a punta.</p><input type="range" min="${C.tamanoMin}" max="${C.tamanoMax}" value="${T.cm}" id="cmr" aria-label="Tamaño en centímetros">`,
  () => `<h2>¿Qué estilo?</h2><div class="opciones" role="group" aria-label="Estilo">${C.estilos.map(s => `<button type="button" class="chip" data-v="${esc(s)}" aria-pressed="${T.estilo === s}">${esc(s)}</button>`).join('')}</div>`,
  () => `<h2>Contame la idea.</h2><textarea id="idea" aria-label="Tu idea" placeholder="Qué querés, qué te gustaría que transmita, referencias…">${esc(T.idea)}</textarea>`,
  () => `<h2>¿Cuándo podés?</h2><div class="opciones" role="group" aria-label="Cuándo">${C.cuando.map(s => `<button type="button" class="chip" data-v="${esc(s)}" aria-pressed="${T.cuando === s}">${esc(s)}</button>`).join('')}</div>`,
  () => `<h2>Listo. Revisalo.</h2><div class="resumen">${[['Zona', T.zona ? nombreZona(T.zona) : '—'], ['Tamaño', T.cm + ' cm'], ['Estilo', T.estilo || '—'], ['Idea', T.idea || '—'], ['Cuándo', T.cuando || '—']]
    .map(([a, b]) => `<div><span>${a}</span><p>${esc(b)}</p></div>`).join('')}</div>
    <p class="nota" style="font-size:15px;margin-top:20px">Si WhatsApp no se abre, escribí al ${esc(config.contacto.whatsappVisible)}.</p>`,
];
const claves = ['zona', null, 'estilo', null, 'cuando'];

function elegirZona(id) {
  T.zona = id;
  cuerpo.querySelectorAll('.chip').forEach(o => o.setAttribute('aria-pressed', o.dataset.v === id));
  const z = zonaPorId(id);
  if (estatua && z) { estatua.sel(z.zona3d); estatua.mirar(z.zona3d); }
}

function ponerEstatua() {
  const caja = $('#tEstatua'); if (!caja) return;
  pedirEstatua?.().then(e => {
    if (!e || !abierto || paso !== 0 || !caja.isConnected) return;
    estatua = e;
    e.mudar(caja);
    e.activar(true);
    const z = zonaPorId(T.zona);
    e.sel(z?.zona3d || 0); e.mirar(z?.zona3d || 0);
  });
}

function devolverEstatua() {
  if (!estatua) return;
  emit('estatua-volver');
  estatua = null;
}

function pintarPaso() {
  if (paso !== 0) devolverEstatua();
  cuerpo.innerHTML = PASOS[paso]();
  cuerpo.classList.toggle('paso-zona', paso === 0);
  [...$('#barras').children].forEach((b, i) => b.classList.toggle('on', i <= Math.min(paso, 4)));
  $('#tPaso').textContent = paso < 5 ? `Paso ${paso + 1} de 5` : 'Resumen';
  $('#tAtras').disabled = paso === 0;
  $('#tSig').textContent = paso < 4 ? 'Siguiente' : paso === 4 ? 'Ver resumen' : 'Enviar por WhatsApp';
  cuerpo.querySelectorAll('.chip').forEach(b => b.onclick = () => {
    if (paso === 0) { elegirZona(b.dataset.v); return; }
    T[claves[paso]] = b.dataset.v; cuerpo.querySelectorAll('.chip').forEach(o => o.setAttribute('aria-pressed', o === b));
  });
  const r = $('#cmr'); if (r) r.oninput = () => { T.cm = +r.value; $('#cmv').textContent = T.cm + ' cm'; };
  const t = $('#idea'); if (t) t.oninput = () => { T.idea = t.value; };
  cuerpo.scrollTop = 0;
  if (paso === 0) ponerEstatua();
}

export function linkWhatsApp() {
  const msg = `${C.saludo}\n• Zona: ${T.zona ? nombreZona(T.zona) : '-'}\n• Tamaño: ${T.cm} cm\n• Estilo: ${T.estilo || '-'}\n• Idea: ${T.idea || '-'}\n• Cuándo: ${T.cuando || '-'}`;
  return `https://wa.me/${config.contacto.whatsapp}?text=${encodeURIComponent(msg)}`;
}

export function abrirTaller(zonaId) {
  if (zonaId) T.zona = zonaId;
  paso = 0;
  volverFoco = document.activeElement;
  abierto = true;
  taller.inert = false;
  taller.setAttribute('aria-hidden', 'false');
  taller.classList.add('on');
  document.body.style.overflow = 'hidden';
  emit('taller', true);
  pintarPaso();
  setTimeout(() => $('#tCerrar').focus({ preventScroll: true }), 60);
}

export function cerrarTaller() {
  if (!abierto) return;
  abierto = false;
  devolverEstatua();
  taller.classList.remove('on');
  taller.setAttribute('aria-hidden', 'true');
  taller.inert = true;
  document.body.style.overflow = '';
  emit('taller', false);
  if (volverFoco?.isConnected) volverFoco.focus({ preventScroll: true });
}

export const tallerAbierto = () => abierto;

/* tocar una zona del David dentro del taller la elige */
export function tocarZonaTaller(z3d) {
  const z = zonaPor3d(z3d);
  if (z) elegirZona(z.id);
}

export function initTaller({ estatua: getEstatua }) {
  pedirEstatua = getEstatua;
  $('#tCerrar').onclick = cerrarTaller;
  $('#tAtras').onclick = () => { if (paso > 0) { paso--; pintarPaso(); } };
  $('#tSig').onclick = () => {
    if (paso < 5) { paso++; pintarPaso(); return; }
    window.open(linkWhatsApp(), '_blank', 'noopener');
  };
  addEventListener('keydown', e => { if (e.key === 'Escape' && abierto) cerrarTaller(); });
  // el teclado del celular no tapa "Siguiente": el taller se ajusta al alto visible
  const vv = window.visualViewport;
  if (vv) {
    const ajustar = () => {
      if (!abierto) { taller.style.height = ''; taller.style.top = ''; return; }
      const tecl = innerHeight - vv.height > 120;
      taller.style.height = tecl ? vv.height + 'px' : '';
      taller.style.top = tecl ? vv.offsetTop + 'px' : '';
    };
    vv.addEventListener('resize', ajustar);
    vv.addEventListener('scroll', ajustar);
  }
}
