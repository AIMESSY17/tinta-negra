/* Pantalla de carga (solo la primera vez en la sesión): del dibujo a la estatua.
   0–1,1 s   el Hombre de Vitruvio de frente se dibuja a pluma (tinta violeta fresca que se seca a negro)
   1,1–1,7 s la lámina gira en 3D con perspectiva; a los 90° entra el perfil
   (espera)  si el sitio no está listo, el perfil "respira" (tope de 4 s desde que empezó la carga)
   +0,8 s    el David de mármol se materializa desde el perfil: un frente de tinta sube de los pies a la cabeza
             y el dibujo se borra en el mismo frente
   +0,55 s   la estatua termina el giro y viaja a su lugar en el hero (FLIP) mientras se abre la mancha de tinta
   El dibujo usa su propio WebGL chico, que se libera al terminar. La estatua es la del hero (mismo renderer):
   durante la carga su canvas se muda a una caja dentro de esta pantalla, del mismo tamaño que la del hero
   (así el encuadre de la cámara no cambia) y escalada con CSS sobre el dibujo. Al final vuelve a su caja
   y un transform inverso la lleva del centro a su lugar. El HTML y el CSS base viven en index.html. */
import { state } from '../lib/state.js';
import { inkTransition } from '../lib/vt.js';
import { NOISE } from '../fondo/mesa.js';

const MINIMO = 600, TOPE = 4000;
const T_DIBUJO = 1.1, T_GIRO0 = 1.1, T_GIRO1 = 1.7, T_MATERIA = .8, T_VIAJE = .55;
// dónde está la figura (con su pedestal) dentro de la imagen, en fracción del alto, medido desde abajo
const IMG_PIE = .07, IMG_CABEZA = .93;
// lo mismo en la estatua (unidades de la escena): base del pedestal y coronilla; y el recorrido del frente de tinta
const EST_PIE = -.38, EST_CABEZA = 2.0, FRENTE0 = -.62, FRENTE1 = 2.32;

const VS = `#version 300 es
in vec2 aPos; uniform vec2 uRes,uCenter,uSize; uniform float uAng,uFoco; out vec2 vUv; out vec2 vPx;
void main(){vUv=aPos+.5;vPx=(aPos+.5)*uSize;
  // lámina que gira sobre el eje Y con perspectiva real (w varía: la textura se interpola con perspectiva)
  float c=cos(uAng),s=sin(uAng);
  vec2 p=vec2(aPos.x*uSize.x*c,aPos.y*uSize.y); float z=aPos.x*uSize.x*s;
  float w=1.+z/uFoco; vec2 q=p/w+uCenter;
  gl_Position=vec4((q.x/uRes.x*2.-1.)*w,(1.-q.y/uRes.y*2.)*w,0,w);}`;

const FS = `#version 300 es
precision highp float; in vec2 vUv; in vec2 vPx; out vec4 o; uniform sampler2D uTex; uniform vec2 uTexel;
uniform float uProg,uHoja,uBrillo,uFrente; uniform vec3 uInk,uViolet,uPapel; ${NOISE}
float lum(vec2 uv){return dot(texture(uTex,uv).rgb,vec3(.299,.587,.114));}
void main(){
  // la foto se convierte en dibujo a pluma: contornos (Sobel) + sombreado con trama cruzada
  vec2 t=uTexel*1.5; float l=lum(vUv);
  float gx=lum(vUv+vec2(t.x,0))-lum(vUv-vec2(t.x,0)), gy=lum(vUv+vec2(0,t.y))-lum(vUv-vec2(0,t.y));
  float edge=smoothstep(.06,.28,length(vec2(gx,gy)));
  float dark=1.-l;
  float h1=smoothstep(.55,.85,sin((vPx.x+vPx.y)*.55)*.5+.5), h2=smoothstep(.6,.9,sin((vPx.x-vPx.y)*.55)*.5+.5);
  float hatch=max(h1*smoothstep(.35,.6,dark),h2*smoothstep(.62,.85,dark));
  float ink=max(edge,hatch*.85);
  // los trazos aparecen de lo oscuro a lo claro, con un borde de tinta irregular; lo fresco, en violeta
  float n=fbm(vUv*vec2(9.,13.)+3.1)-.5, n2=fbm(vUv*40.)-.5;
  float th=1.-uProg*1.25+n*.35+(vUv.y-.5)*.25*(1.-uProg);
  float vis=smoothstep(th,th+.09,ink+n2*.08);
  float fresh=smoothstep(th+.2,th+.04,ink)*vis;
  vec3 col=mix(uInk,uViolet,fresh*.9);
  float a=ink*vis;
  // el dibujo se vuelve mármol: se borra de abajo hacia arriba en el mismo frente de tinta que la estatua
  if(uFrente>-1.){
    float d=(1.-vUv.y)+(fbm(vUv*vec2(7.,11.))-.5)*.16-uFrente;
    a*=smoothstep(-.012,.012,d);
    col=mix(col,uViolet,smoothstep(.07,0.,abs(d))*.9);
  }
  vec2 e=smoothstep(vec2(0),vec2(.04),vUv)*smoothstep(vec2(0),vec2(.04),1.-vUv);
  a*=e.x*e.y;
  // la lámina de papel se ve solo mientras gira: un brillo de un lado y sombra del otro, como un objeto
  vec2 eh=smoothstep(vec2(0),vec2(.012),vUv)*smoothstep(vec2(0),vec2(.012),1.-vUv);
  float pa=uHoja*eh.x*eh.y;
  vec3 papel=clamp(uPapel+uBrillo*(.5-vUv.x)*.22-abs(uBrillo)*.05,0.,1.);
  o=vec4(col*a+papel*pa*(1.-a),a+pa*(1.-a));
}`;

// color de un token CSS (#rrggbb) → [r, g, b] en 0–1
export function token(nombre) {
  const h = getComputedStyle(document.documentElement).getPropertyValue(nombre).trim().replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/./g, c => c + c) : h, 16);
  return Number.isFinite(n) ? [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255] : [0, 0, 0];
}
const suave = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const clamp01 = x => Math.max(0, Math.min(1, x));

/* El dibujo. Devuelve { reloj(), rect(), fase(f), frente(v), parar() } o null si no hay WebGL 2 */
function dibujo(el) {
  const canvas = el.querySelector('canvas'), [imF, imP] = el.querySelectorAll('.carga-fig img');
  const gl = !state.reduced && canvas.getContext('webgl2', { alpha: true, antialias: false, premultipliedAlpha: true });
  if (!gl) return null;
  try {
    const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS));
    gl.bindAttribLocation(p, 0, 'aPos'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const ul = {}, u = n => (ul[n] ??= gl.getUniformLocation(p, n));
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-.5, -.5, .5, -.5, -.5, .5, .5, .5]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const tex = im => {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    const cargada = im => im.decode ? im.decode().then(() => im) : (im.complete && im.naturalWidth ? Promise.resolve(im) : new Promise((ok, no) => { im.onload = () => ok(im); im.onerror = no; }));
    let texF = null, texP = null, aspect = 617 / 926, texW = 926, t0 = 0, raf = 0, vivo = true, frente = -2;
    const tinta = token('--tinta'), violeta = token('--stencil'), papel = token('--paper');
    let listo = null; const empezo = new Promise(r => { listo = r; });
    Promise.all([cargada(imF), cargada(imP)]).then(([a, c]) => {
      if (!vivo) return;
      texF = tex(a); texP = tex(c); aspect = a.naturalHeight / a.naturalWidth; texW = a.naturalWidth; t0 = performance.now();
      el.classList.add('go'); listo();
    }).catch(() => { el.classList.add('quieta'); listo(); });
    const reloj = () => (t0 ? (performance.now() - t0) / 1000 : 0);

    const cuadro = () => {
      if (!vivo) return;
      raf = requestAnimationFrame(cuadro);
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      const W = Math.max(1, Math.floor(canvas.clientWidth * dpr)), H = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
      gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      if (!texF) return;
      const T = reloj();
      const prog = Math.min(1, T / T_DIBUJO);
      const k = clamp01((T - T_GIRO0) / (T_GIRO1 - T_GIRO0)), giro = suave(k) * Math.PI;
      // primera mitad: el frente se va de canto; segunda: entra el perfil desde el otro canto (sin espejarse)
      const perfil = giro >= Math.PI / 2;
      let ang = perfil ? giro - Math.PI : giro;
      // esperando de perfil: respira muy lento
      if (k >= 1 && frente < -1) ang = Math.sin((T - T_GIRO1) * 1.3) * .05;
      const wd = Math.min(W, H / aspect), hg = wd * aspect;
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.useProgram(p);
      gl.uniform2f(u('uRes'), W, H); gl.uniform2f(u('uCenter'), W / 2, H / 2); gl.uniform2f(u('uSize'), wd, hg);
      gl.uniform1f(u('uAng'), ang); gl.uniform1f(u('uFoco'), Math.max(W, H) * 1.1);
      gl.uniform1f(u('uProg'), perfil ? 1 : prog);
      gl.uniform1f(u('uHoja'), Math.sin(k * Math.PI) * .45); gl.uniform1f(u('uBrillo'), Math.sin(ang * 2) * .9);
      gl.uniform1f(u('uFrente'), frente);
      gl.uniform2f(u('uTexel'), 1 / texW, 1 / (texW * aspect));
      gl.uniform3f(u('uInk'), ...tinta); gl.uniform3f(u('uViolet'), ...violeta); gl.uniform3f(u('uPapel'), ...papel);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, perfil ? texP : texF);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    raf = requestAnimationFrame(cuadro);
    return {
      empezo, reloj,
      // rectángulo de la imagen en pantalla (object-fit: contain dentro del canvas)
      rect() {
        const r = canvas.getBoundingClientRect(), w = Math.min(r.width, r.height / aspect), h = w * aspect;
        return { x: r.left + (r.width - w) / 2, y: r.top + (r.height - h) / 2, w, h };
      },
      frente(v) { frente = v; },
      // al irse: corta el bucle y libera el contexto (no queda un tercer WebGL vivo)
      parar() { vivo = false; cancelAnimationFrame(raf); gl.getExtension('WEBGL_lose_context')?.loseContext(); },
    };
  } catch (err) {
    console.error(err); return null;
  }
}

/* esperas: promesas de lo que tiene que estar listo (fuentes, mesa, modelo).
   estatua: promesa de la estatua con el modelo cargado (o null) y su caja del hero, para la materialización.
   Devuelve una promesa que se cumple con true cuando la pantalla se fue (false si no correspondía mostrarla). */
export function correrCarga({ esperas = [], estatua = null, caja = null } = {}) {
  const el = document.getElementById('carga'), raiz = document.documentElement;
  if (!el) { raiz.classList.remove('cargando'); return Promise.resolve(false); }
  if (raiz.classList.contains('sin-carga')) { el.remove(); raiz.classList.remove('cargando'); return Promise.resolve(false); }
  try { sessionStorage.setItem('tn-carga', '1'); } catch (_) { /* sin almacenamiento: se muestra en cada carga */ }
  raiz.classList.add('cargando');
  const inicio = performance.now();
  const pista = el.querySelector('.carga-saltar');
  if (pista) pista.textContent = state.touch ? 'Tocá para saltar' : 'Clic o Esc para saltar';
  const D = dibujo(el);
  if (!D) el.classList.add('quieta');

  // progreso: cada espera cumplida suma su parte de la barra violeta
  const barra = el.querySelector('.carga-barra i');
  let hechas = 0;
  const avance = () => { hechas++; barra?.style.setProperty('--p', Math.round(hechas / Math.max(1, esperas.length) * 100) + '%'); };
  const todo = Promise.all(esperas.map(p => Promise.resolve(p).catch(() => null).then(avance)));
  const espera = ms => new Promise(r => setTimeout(r, ms));
  const quedan = () => Math.max(0, TOPE - (performance.now() - inicio));

  // la estatua del hero (si se ve el hero y hay movimiento): se materializa acá adentro
  let E = null, cajaCarga = null, pos = null, fin = false;
  const heroALaVista = () => { if (!caja) return false; const r = caja.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < innerHeight; };
  const conEstatua = !!(D && estatua && caja && !state.reduced);

  // la caja de la carga mide lo mismo que la del hero; se escala para que el David calce sobre el dibujo
  function ubicar() {
    const W = caja.clientWidth, H = caja.clientHeight;
    cajaCarga.style.width = W + 'px'; cajaCarga.style.height = H + 'px';
    const pie = E.proyectar(0, EST_PIE), cab = E.proyectar(0, EST_CABEZA), im = D.rect();
    const yPie = im.y + im.h * (1 - IMG_PIE), yCab = im.y + im.h * (1 - IMG_CABEZA);
    const s = (yPie - yCab) / (pie.y - cab.y);
    pos = { s, x: im.x + im.w / 2 - s * pie.x, y: yPie - s * pie.y };
    cajaCarga.style.transform = `translate(${pos.x}px,${pos.y}px) scale(${s})`;
  }
  function materializar(e) {
    E = e;
    cajaCarga = document.createElement('div');
    cajaCarga.className = 'carga-estatua';
    el.append(cajaCarga);
    E.intro = true; E.perfil();
    ubicar();
    E.mudar(cajaCarga);
    E.materializar(T_MATERIA, token('--stencil'));
    addEventListener('resize', ubicar);
    // el dibujo se borra en el mismo frente que sube por la estatua
    const seguir = () => {
      if (fin || !E) return;
      const m = E.materia, yF = FRENTE0 + (FRENTE1 - FRENTE0) * m;
      D.frente(IMG_PIE + (yF - EST_PIE) / (EST_CABEZA - EST_PIE) * (IMG_CABEZA - IMG_PIE));
      if (m < 1) requestAnimationFrame(seguir);
    };
    requestAnimationFrame(seguir);
  }
  // la estatua vuelve a su caja del hero; con viaje (FLIP desde el centro) o directo (al saltar)
  function devolver(viaje) {
    if (!E) return;
    removeEventListener('resize', ubicar);
    E.mudar(caja);
    const canvas = E.canvas;
    if (viaje && pos) {
      const r = caja.getBoundingClientRect();
      canvas.style.transformOrigin = '0 0';
      canvas.style.transition = 'none';
      canvas.style.transform = `translate(${pos.x - r.left}px,${pos.y - r.top}px) scale(${pos.s})`;
      canvas.getBoundingClientRect();
      canvas.style.transition = `transform ${T_VIAJE}s cubic-bezier(.65,0,.25,1)`;
      canvas.style.transform = '';
      const limpiar = () => { canvas.style.transition = ''; canvas.style.transformOrigin = ''; E.intro = false; };
      canvas.addEventListener('transitionend', limpiar, { once: true });
      setTimeout(limpiar, T_VIAJE * 1000 + 200);
      // termina el giro: del perfil a su ángulo de reposo (el frente)
      E.girarA(0, T_VIAJE + .1);
    } else {
      canvas.style.transform = ''; canvas.style.transition = '';
      E.entera(); E.girarA(0, .001); E.intro = false;
    }
  }

  return new Promise(resolve => {
    const salir = (viaje = false) => {
      if (fin) return; fin = true;
      removeEventListener('keydown', tecla); el.removeEventListener('pointerdown', saltar); removeEventListener('wheel', saltar);
      const r = el.querySelector('.carga-fig').getBoundingClientRect();
      const quitar = () => { D?.parar(); raiz.classList.remove('cargando'); devolver(viaje); el.remove(); };
      if (document.startViewTransition) {
        // la mancha de tinta se abre desde el centro del dibujo y deja ver el sitio (la estatua viaja adentro)
        inkTransition({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, quitar);
      } else {
        el.classList.add('fuera');
        raiz.classList.remove('cargando');
        devolver(viaje);
        setTimeout(() => { D?.parar(); el.remove(); }, 420);
      }
      resolve(true);
    };
    const saltar = () => salir(false);
    const tecla = e => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') saltar(); };
    addEventListener('keydown', tecla);
    el.addEventListener('pointerdown', saltar);
    addEventListener('wheel', saltar, { passive: true });

    // todo listo (o tope): sin estatua, sale con la mancha; con estatua, primero el giro del dibujo y la materialización
    const listo = Promise.race([Promise.all([todo, espera(MINIMO)]).then(() => true), espera(TOPE).then(() => false)]);
    if (!conEstatua) { listo.then(() => salir(false)); return; }
    D.empezo.then(async () => {
      // el dibujo tiene que llegar al perfil antes de materializar
      await Promise.race([espera(Math.max(0, T_GIRO1 - D.reloj()) * 1000), espera(quedan())]);
      const ok = await listo;
      const e = ok ? await Promise.race([estatua, espera(quedan()).then(() => null)]) : null;
      if (fin) return;
      if (!e || !e.lista || !heroALaVista()) { salir(false); return; }
      materializar(e);
      await espera(T_MATERIA * 1000 + 60);
      salir(true);
    });
  });
}
