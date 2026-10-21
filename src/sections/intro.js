/* Carga inicial: el Hombre de Vitruvio de frente se dibuja con tinta, gira al perfil
   y desde el perfil se materializa la estatua en el centro. Menos de 3 s, saltable con un toque,
   un clic o Escape. */
import { createGL, NOISE } from '../lib/gl.js';
import { state, addTicker } from '../lib/state.js';
import { src } from '../lib/media.js';

const VS = `#version 300 es
in vec2 aPos; uniform vec2 uRes,uCenter,uSize; uniform float uScaleX; out vec2 vUv; out vec2 vPx;
void main(){vUv=aPos+.5;vec2 p=aPos*uSize*vec2(uScaleX,1.)+uCenter;vPx=(aPos+.5)*uSize;
gl_Position=vec4(p.x/uRes.x*2.-1.,1.-p.y/uRes.y*2.,0,1);}`;

const FS = `#version 300 es
precision highp float; in vec2 vUv; in vec2 vPx; out vec4 o; uniform sampler2D uTex; uniform vec2 uTexel;
uniform float uProg,uDis,uTime,uStudio; uniform vec3 uInk,uViolet; ${NOISE}
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
  // los trazos aparecen de lo oscuro a lo claro, con un borde de tinta irregular
  float n=fbm(vUv*vec2(9.,13.)+3.1)-.5, n2=fbm(vUv*40.)-.5;
  float th=1.-uProg*1.25+n*.35+(vUv.y-.5)*.25*(1.-uProg);
  float vis=smoothstep(th,th+.09,ink+n2*.08);
  float fresh=smoothstep(th+.2,th+.04,ink)*vis;
  vec3 col=mix(uInk,uViolet,fresh*.9);
  // al final la figura se disuelve en tinta que se seca
  float d=smoothstep(uDis*1.3-.15,uDis*1.3,fbm(vUv*6.+uTime*.2)+(1.-vUv.y)*.15);
  float a=ink*vis*d;
  vec2 e=smoothstep(vec2(0),vec2(.04),vUv)*smoothstep(vec2(0),vec2(.04),1.-vUv);
  a*=e.x*e.y;
  o=vec4(col*a,a);
}`;

export function runIntro(el, hero) {
  return new Promise(resolve => {
    // se muestra siempre; con movimiento reducido (o sin WebGL 2) es una aparición simple de ~1 s
    document.documentElement.classList.add('intro-on');
    el.innerHTML = `<div class="intro-col">
        <div class="intro-fig">
          <img class="f" src="${src('vitruvio/frente.jpg')}" alt="" decoding="async">
          <img class="p" src="${src('vitruvio/perfil.jpg')}" alt="" decoding="async">
          <canvas aria-hidden="true"></canvas>
        </div>
        <p class="intro-note" aria-hidden="true">De motu corporis · estudio para tinta</p>
        <button type="button" class="skip">${state.coarse ? 'Tocá para saltar' : 'Clic o Esc para saltar'}</button>
      </div>`;
    const fig = el.querySelector('.intro-fig'), canvas = el.querySelector('canvas');
    const [imF, imP] = el.querySelectorAll('img');
    let done = false, stop = null, simpleTimer = 0, profileSent = false;

    const skip = () => { if (!done) onSkip(); };
    const onKey = e => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') skip(); };
    el.addEventListener('pointerdown', skip);
    addEventListener('keydown', onKey);
    addEventListener('wheel', skip, { passive: true });
    let onSkip = () => finish();

    function simple() {
      el.classList.add('simple', 'go');
      simpleTimer = setTimeout(finish, 1000);
    }

    const G = !state.reduced && state.gl2 ? createGL(canvas, { alpha: true }) : null;
    if (!G) { simple(); return; }
    const { gl } = G;
    const P = G.prog(VS, FS);
    const quad = G.buffer([-.5, -.5, .5, -.5, -.5, .5, .5, .5]);
    let texF = null, texP = null, aspect = 617 / 926, t = 0, skipAt = null, texW = 1000, t0 = 0;
    onSkip = () => { if (!texF) finish(); else if (skipAt === null) skipAt = t; };

    // la estatua espera en el centro, en la misma caja que el Vitruvio
    hero.centerOn?.(fig.getBoundingClientRect());

    const loaded = im => im.complete && im.naturalWidth ? Promise.resolve(im) : new Promise((res, rej) => { im.onload = () => res(im); im.onerror = rej; });
    const timeout = setTimeout(() => { if (!texF) finish(); }, 1500);
    Promise.all([loaded(imF), loaded(imP)]).then(([a, b]) => {
      clearTimeout(timeout);
      if (done) return;
      texF = G.texture(a, false); texP = G.texture(b, false);
      aspect = a.naturalHeight / a.naturalWidth; texW = a.naturalWidth; t0 = performance.now();
      el.classList.add('go');
    }).catch(finish);

    stop = addTicker(() => {
      if (done) return;
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      const W = Math.max(1, Math.floor(canvas.clientWidth * dpr)), H = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
      gl.viewport(0, 0, W, H);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      // si cambia el tamaño de la ventana, la estatua sigue el centro de la figura
      hero.centerOn?.(fig.getBoundingClientRect());
      if (!texF) return;
      t = (performance.now() - t0) / 1000;
      // línea de tiempo: dibujo 0–1.15 · giro 1.25–1.85 · materialización 1.85–2.6
      let T = t;
      if (skipAt !== null) T = Math.max(t, 1.85 + (t - skipAt) * 3);
      const prog = Math.min(1, T / 1.15);
      const turn = Math.min(1, Math.max(0, (T - 1.25) / .6));
      const ang = turn * Math.PI;
      const dis = Math.min(1, Math.max(0, (T - 1.85) / .75));
      if (T > 1.7 && !profileSent) { profileSent = true; hero.fromProfile(); }
      if (dis > 0) el.style.setProperty('--fade', 1 - dis);
      if (dis >= 1) { finish(); return; }

      // object-fit: contain dentro de la caja; frente y perfil comparten el mismo rectángulo
      const wdt = Math.min(W, H / aspect), hgt = wdt * aspect;
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(P.p); G.useBuf(quad);
      const u = P.u;
      gl.uniform2f(u.uRes, W, H); gl.uniform2f(u.uCenter, W / 2, H / 2); gl.uniform2f(u.uSize, wdt, hgt);
      gl.uniform1f(u.uScaleX, Math.max(.02, Math.abs(Math.cos(ang))));
      gl.uniform1f(u.uProg, ang > Math.PI / 2 ? 1 : prog);
      gl.uniform1f(u.uDis, dis); gl.uniform1f(u.uTime, t);
      gl.uniform2f(u.uTexel, 1 / texW, 1 / (texW * aspect));
      const studio = state.studio;
      gl.uniform3f(u.uInk, ...(studio ? [.93, .91, .88] : [.08, .075, .09]));
      gl.uniform3f(u.uViolet, ...(studio ? [.72, .61, 1] : [.42, .22, .78]));
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, ang > Math.PI / 2 ? texP : texF);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    });

    function finish() {
      if (done) return;
      done = true;
      stop?.();
      clearTimeout(simpleTimer);
      el.removeEventListener('pointerdown', skip);
      removeEventListener('keydown', onKey);
      removeEventListener('wheel', skip);
      if (!profileSent) hero.fromProfile();
      // recién ahora la estatua viaja del centro a su lugar en el hero, mientras aparece el resto
      hero.release?.();
      document.documentElement.classList.remove('intro-on');
      el.classList.add('out');
      setTimeout(() => el.remove(), 400);
      resolve();
    }
  });
}
