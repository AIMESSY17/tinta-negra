import './styles/crudo.css';
import config from './config.js';
import { state, on, $, $$ } from './lib/state.js';
import { obrasDe, zonaPorId, zonaPor3d, src } from './lib/media.js';
import { initRouter, go } from './lib/router.js';
import { initFondo } from './fondo/fondo.js';
import { initCabecera } from './ui/cabecera.js';
import { initDuotono } from './ui/duotono.js';
import { initCursor } from './ui/cursor.js';
import { initHoja, abrirHoja, cerrarHoja, hojaAbierta } from './ui/hoja.js';
import { correrCarga, token } from './ui/carga.js';
import { initTaller, abrirTaller, tallerAbierto, tocarZonaTaller } from './ui/taller.js';
import { construirInicio } from './paginas/inicio.js';
import { construirArtista } from './paginas/artista.js';
import { construirInfo } from './paginas/info.js';

document.querySelector('meta[name="description"]').content = config.estudio.descripcion || '';

// las tres páginas (solo DOM)
construirInicio($('.page[data-page="inicio"]'));
construirArtista($('.page[data-page="artista"]'));
construirInfo($('.page[data-page="info"]'));

initCabecera();
initDuotono();
initCursor();
initHoja();
const fondo = initFondo();
initRouter();

/* ---------------- estatua: un solo contexto WebGL, cargado después del primer pintado ---------------- */
const IS_TOUCH = state.touch;
const caja = $('#estatua'), etq = $('#etq');
let estatua = null, cargando = null, heroVisible = false, heroGiro = false, zonaActual = null, tocadaEnTaller = false;
let avisarModelo = null;
const modeloListo = new Promise(r => { avisarModelo = r; });
// si la medición muestra frames largos al arrastrar la mesa con la estatua girando, pasar a true
const PAUSA_AL_ARRASTRAR = false;

/* proporciones de Vitruvio: fijas detrás del David. Se recalculan solo cuando cambia el tamaño de la caja */
const vit = $('#vit');
function proporciones(cont) {
  if (!estatua || !vit || cont !== caja) return;
  const p = (x, y) => estatua.proyectar(x, y);
  const navel = p(0, 1.12), top = p(0, 2.0), foot = p(0, .18), side = p(.92, 1.12);
  const r = Math.abs(side.x - navel.x) * 1.12, half = (foot.y - top.y) / 2;
  if (!Number.isFinite(r + half + navel.x + navel.y) || half <= 0) return;
  const set = (id, a) => { const n = vit.getElementById(id); for (const k in a) n.setAttribute(k, a[k]); n.style.setProperty('--len', a.len); };
  set('vCircle', { cx: navel.x, cy: navel.y, r, len: 2 * Math.PI * r });
  set('vSquare', { x: navel.x - half, y: top.y, width: half * 2, height: half * 2, len: 8 * half });
  set('vAxis', { x1: navel.x, y1: top.y - 30, x2: navel.x, y2: foot.y + 70, len: foot.y - top.y + 100 });
  set('vNavel', { x1: navel.x - r - 18, y1: navel.y, x2: navel.x + r + 18, y2: navel.y, len: 2 * r + 36 });
}

function mostrarEtiqueta(texto, x, y) {
  if (!texto) { etq.style.opacity = 0; return; }
  etq.textContent = texto;
  etq.style.transform = `translate(${Math.min(x + 18, innerWidth - etq.offsetWidth - 8)}px,${y + 14}px)`;
  etq.style.opacity = 1;
}

function obtenerEstatua() {
  if (cargando) return cargando;
  cargando = import('./estatua/estatua.js').then(({ crearEstatua }) => {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-label', 'Estatua: tocá una zona del cuerpo para ver los trabajos');
    canvas.setAttribute('role', 'img');
    caja.prepend(canvas);
    estatua = crearEstatua(canvas, {
      reduced: state.reduced, IS_TOUCH,
      onResize: proporciones,
      onToque: () => { if (tallerAbierto()) tocadaEnTaller = true; },
      // gira sola solo a la vista (≥ 25 %) y sin la hoja abierta; en el taller, hasta que la tocan
      puedeGirar: () => tallerAbierto()
        ? !tocadaEnTaller
        : heroGiro && !hojaAbierta() && !(PAUSA_AL_ARRASTRAR && fondo.arrastrando()),
      onHover: (z, x, y) => {
        const Z = zonaPor3d(z);
        mostrarEtiqueta(Z && (tallerAbierto() ? Z.nombre : `${Z.nombre} · ver trabajos`), x, y);
      },
      onGiro: () => {
        if (!IS_TOUCH) return;
        apagarPista();
        try { localStorage.setItem('tn-giro', '1'); } catch (_) { /* nada */ }
      },
      onTap: (z, x, y) => {
        const Z = zonaPor3d(z); if (!Z) return;
        if (tallerAbierto()) { tocarZonaTaller(z); return; }
        // al tocar, la zona se ilumina y aparece su nombre; después se abre la hoja de trabajos
        estatua.hover(z);
        mostrarEtiqueta(Z.nombre, x, y);
        setTimeout(() => { estatua.hover(0); if (IS_TOUCH) mostrarEtiqueta(null); }, IS_TOUCH ? 650 : 0);
        abrirZona(Z.id);
      },
    });
    canvas.addEventListener('estatua-lista', () => avisarModelo(estatua), { once: true });
    actualizarEstatua();
    return estatua;
  }).catch(err => { console.error(err); avisarModelo(null); return null; });
  return cargando;
}

function actualizarEstatua() {
  if (!estatua) return;
  if (tallerAbierto() && estatua.canvas.parentElement !== caja) { estatua.activar(true); return; }
  estatua.activar(heroVisible && state.page === 'inicio');
}

new IntersectionObserver(([e]) => {
  heroVisible = e.isIntersecting; heroGiro = e.intersectionRatio >= .25;
  if (!heroGiro) estatua?.quieta();
  actualizarEstatua();
}, { threshold: [0, .25] }).observe(caja);
on('page', actualizarEstatua);
on('estatua-volver', () => {
  if (!estatua) return;
  estatua.mudar(caja);
  estatua.sel(zonaActual ? zonaPorId(zonaActual).zona3d : 0);
  mostrarEtiqueta(null);
  actualizarEstatua();
});
on('taller', v => { fondo.setTaller(v); if (v) tocadaEnTaller = false; estatua?.quieta(); actualizarEstatua(); });

/* ---------------- pantalla de carga (primera carga de la sesión) ---------------- */
const conCarga = !!$('#carga') && !document.documentElement.classList.contains('sin-carga');
// con la pantalla de carga, el David se pide enseguida (la pantalla lo espera); si no, después del primer pintado
const diferir = fn => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 300));
if (conCarga) obtenerEstatua();
else if (document.readyState === 'complete') diferir(obtenerEstatua);
else addEventListener('load', () => diferir(obtenerEstatua), { once: true });

const fuentes = document.fonts?.ready || Promise.resolve();
const enInicio = state.page === 'inicio';
let modeloLlego = false;
modeloListo.then(() => { modeloLlego = true; });
correrCarga({
  esperas: [fuentes, fondo.lista, enInicio ? modeloListo : null].filter(Boolean),
  // en Inicio, el David se materializa desde el dibujo y viaja a su lugar del hero
  estatua: enInicio ? modeloListo : null, caja,
}).then(mostrada => {
  // si el modelo llegó tarde (después del tope), aparece en el hero con la misma materialización
  if (mostrada && enInicio && !modeloLlego && !state.reduced) {
    modeloListo.then(e => { if (e && state.page === 'inicio') e.materializar(.8, token('--stencil')); });
  }
  // las proporciones se dibujan cuando la estatua ya está y la pantalla de carga se fue
  modeloListo.then(e => { if (e) vit?.classList.add('draw'); });
});

/* ---------------- zonas: la hoja de trabajos (no el taller) ---------------- */
const botonesZona = $$('#zonas .zona');
function abrirZona(id) {
  const Z = zonaPorId(id); if (!Z) return;
  zonaActual = id;
  const lista = obrasDe(id);
  botonesZona.forEach(b => b.setAttribute('aria-pressed', b.dataset.zona === id));
  estatua?.sel(Z.zona3d); estatua?.mirar(Z.zona3d);
  apagarPista();
  abrirHoja({
    titulo: Z.nombre,
    cantidad: lista.length + (lista.length === 1 ? ' trabajo' : ' trabajos'),
    items: lista.map(o => ({ src: src(o.path), alt: `Tatuaje en ${Z.nombre.toLowerCase()}`, tipo: o.tipo })),
    quiero: `Quiero uno en ${Z.nombre.toLowerCase()}`,
    onQuiero: () => abrirTaller(id),
    onCerrar: () => {
      zonaActual = null;
      estatua?.sel(0);
      botonesZona.forEach(b => b.setAttribute('aria-pressed', 'false'));
    },
  });
}
botonesZona.forEach(b => b.addEventListener('click', () => abrirZona(b.dataset.zona)));

// en celular, la primera vez la pista también avisa que se puede girar
if (IS_TOUCH) {
  let giro = null; try { giro = localStorage.getItem('tn-giro'); } catch (_) { /* nada */ }
  if (!giro && $('#pista')) $('#pista').textContent = 'Tocá o deslizá para girar';
}
let pistaOff = false;
function apagarPista() { if (pistaOff) return; pistaOff = true; const p = $('#pista'); if (p) p.style.opacity = 0; }
on('pista-off', apagarPista);

/* ---------------- taller ---------------- */
initTaller({ estatua: obtenerEstatua });
document.addEventListener('click', e => {
  const b = e.target.closest('[data-taller]'); if (!b) return;
  e.preventDefault();
  cerrarHoja({ silencio: true });
  // desde Artista o Info, el CTA lleva a Inicio y abre el taller
  if (b.dataset.go && state.page !== b.dataset.go) go(b.dataset.go, { sinTinta: true });
  abrirTaller();
});

/* ---------------- copiar el número (el texto del sitio no se puede seleccionar) ---------------- */
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-copiar]'); if (!b) return;
  const texto = b.dataset.copiar;
  // el portapapeles puede quedar esperando un permiso: si no responde enseguida, se copia a la vieja usanza
  try { await Promise.race([navigator.clipboard.writeText(texto), new Promise((_, no) => setTimeout(no, 500))]); }
  catch (_) {
    const t = document.createElement('textarea'); t.value = texto; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.append(t); t.select();
    try { document.execCommand('copy'); } catch (__) { /* nada */ } t.remove();
  }
  b.textContent = 'Copiado';
  clearTimeout(b._t); b._t = setTimeout(() => { b.textContent = 'Copiar'; }, 1000);
});
