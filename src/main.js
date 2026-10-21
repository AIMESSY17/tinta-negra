import './styles/base.css';
import './styles/grimorio.css';
import './styles/hero.css';
import './styles/taller.css';
import './styles/artista.css';
import './styles/info.css';
import './styles/contacto.css';
import './styles/app.css';
import config from './config.js';
import { state, $, $$, on } from './lib/state.js';
import { initPerf } from './lib/perf.js';
import { sketches, src } from './lib/media.js';
import { createBackground } from './bg/background.js';
import { initInkTitles, initBanda, initLamp, initMenu, initReserve, initTabbar, initTilt, initProgress, initCursor, initObjects } from './sections/chrome.js';
import { buildChapter, initChapter, buildMiniFoot, initMiniFoot } from './sections/frame.js';
import { initButtons } from './lib/buttons.js';
import { buildHero, initHero } from './sections/hero.js';
import { runIntro } from './sections/intro.js';
import { applyHints } from './lib/hints.js';
import { openFromHash } from './lib/lightbox.js';
import { initRouter, currentPage } from './lib/router.js';
import { buildArtist, initArtist } from './sections/artist.js';
import { buildStyles, initStyles } from './sections/styles.js';
import { buildProcess, initProcess } from './sections/process.js';
import { buildCare, initCare } from './sections/care.js';
import { buildFaq, initFaq } from './sections/faq.js';
import { buildOrder, initOrder } from './sections/order.js';
import { buildClosing, initClosing, buildReviews, buildCta } from './sections/closing.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// textos del documento desde la config
document.title = `${config.estudio.nombre} · ${config.estudio.bajada}`;
document.querySelector('meta[name="description"]').content = config.estudio.descripcion || '';

initPerf();
state.gl2 = !!document.createElement('canvas').getContext('webgl2');
document.documentElement.classList.toggle('no-gl', !state.gl2);

// estructura de las tres páginas (solo DOM, barato)
// Inicio: hero → Armá tu tatuaje → Contacto
buildHero($('#hero'));
buildOrder($('#pedido'));
buildClosing($('#cierre'));
// El artista: cuaderno → portafolio → botón al taller
buildArtist($('#artista'));
buildStyles($('#estilos'));
// Info: preguntas → proceso y cuidados → botón al taller
buildFaq($('#preguntas'));
buildProcess($('#proceso'));
buildCare($('#cuidados'));
buildReviews($('#resenas'));
$$('[data-cta]').forEach(el => buildCta(el, el.dataset.cta));
// marco de Artista e Info: portada de capítulo y pie compacto
$$('[data-chapter]').forEach(buildChapter);
$$('[data-foot]').forEach(buildMiniFoot);

// fondo (WebGL2): vive fuera de las páginas, nunca se recarga
let bg = null;
if (state.gl2) {
  try { bg = createBackground($('#bg')); } catch (err) { console.error(err); }
}
if (!bg) {
  // versión estática digna: algunos bocetos tirados sobre el papel
  document.documentElement.classList.add('no-gl');
  $('#bg-static').innerHTML = sketches.slice(0, 9).map((s, i) =>
    `<img src="${src(s.path, true)}" alt="" style="left:${(i % 3) * 34 + (i * 7) % 9}%;top:${Math.floor(i / 3) * 36 + (i * 5) % 8}%;transform:rotate(${(i * 23) % 13 - 6}deg)">`).join('');
}

initLamp();
initBanda(bg);
initButtons();
const hero = initHero($('#hero'), bg);
initOrder($('#pedido'));
initClosing($('#cierre'));
initArtist($('#artista'));
initStyles($('#estilos'), bg);
initFaq($('#preguntas'));
initProcess($('#proceso'));
initCare($('#cuidados'));
$$('[data-chapter]').forEach(initChapter);
$$('[data-foot]').forEach(initMiniFoot);
initMenu();
initReserve();
initTabbar();
initTilt(bg);
initProgress();
initCursor();
initObjects(bg);
initInkTitles();
applyHints();
on('style', id => bg?.setStyle(id));
on('drop', d => bg?.addDrop(d.x, d.y, d.s));

// muestra la página de la URL (/, /artista o /info)
initRouter(bg);
// un link a un trabajo (#trabajo/lamina-05) abre el visor en su página
const work = openFromHash();
const inkTitle = () => $('#hero h1').classList.add('inked');
if (currentPage() === 'inicio' && !work) runIntro($('#intro'), hero).then(inkTitle);
else {
  // entrando directo a otra página (o a un trabajo) no hay intro: el título se tatúa al ver Inicio
  $('#intro').remove();
  const off = on('page', p => { if (p === 'inicio') { off(); setTimeout(inkTitle, 300); } });
  if (currentPage() === 'inicio') { off(); setTimeout(inkTitle, 300); }
}
bg?.watchCalm();
if (bg) setTimeout(() => bg.addDrop(innerWidth * .22, innerHeight * .6), 3200);
