/* Fondo vivo: lienzo infinito de bocetos en WebGL2 crudo (portado de hero-prototipo.html).
   - 3 capas con parallax, blend multiplicativo, redibujo, tinta que se corre
   - máscara ping-pong: R = rastro/gotas, G = tinta fresca (violeta), B = halo de color
   - extras del sitio: zonas de calma alrededor del texto, filtro por estilo con ola de tinta */
import { createGL, NOISE, VS_FULL, h32 } from '../lib/gl.js';
import { state, on, addTicker, isMobile, mobileMQ } from '../lib/state.js';
import { sketches, src, loadImage } from '../lib/media.js';
import config from '../config.js';

const VS_QUAD = `#version 300 es
in vec2 aPos; uniform vec2 uRes,uCenter,uSize; uniform float uRot; out vec2 vUv;
void main(){vUv=aPos+.5;vec2 p=aPos*uSize;float c=cos(uRot),s=sin(uRot);p=vec2(c*p.x-s*p.y,s*p.x+c*p.y)+uCenter;
gl_Position=vec4(p.x/uRes.x*2.-1.,1.-p.y/uRes.y*2.,0,1);}`;

const FS_QUAD = `#version 300 es
precision highp float; in vec2 vUv; out vec4 o; uniform sampler2D uTex; uniform float uAlpha,uProg,uBias;
void main(){vec3 c=texture(uTex,vUv,uBias).rgb;float ink=1.-dot(c,vec3(.299,.587,.114));
float th=1.-uProg*1.15;float vis=smoothstep(th,th+.12,ink);
vec2 e=smoothstep(vec2(0),vec2(.025),vUv)*smoothstep(vec2(0),vec2(.025),1.-vUv);
o=vec4(mix(vec3(1),c,vis*uAlpha*e.x*e.y),1);}`;

const FS_MASK = `#version 300 es
precision highp float; out vec4 o; uniform sampler2D uPrev; uniform vec2 uRes,uA,uB; uniform float uR,uStr,uDt,uTime,uHalo;
uniform vec4 uDrops[8]; uniform int uN; ${NOISE}
float seg(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/max(dot(ba,ba),1e-4),0.,1.);return length(pa-ba*h);}
void main(){vec2 fc=gl_FragCoord.xy,uv=fc/uRes,px=1./uRes;
vec2 n=vec2(noise(uv*7.+uTime*.25),noise(uv*7.+17.3-uTime*.25))-.5;vec4 p=texture(uPrev,uv+n*2.5*px);
float b=(texture(uPrev,uv+vec2(px.x,0)).r+texture(uPrev,uv-vec2(px.x,0)).r+texture(uPrev,uv+vec2(0,px.y)).r+texture(uPrev,uv-vec2(0,px.y)).r)*.25;
float r=max(mix(p.r,b,.3)-uDt*.36,0.);float g=max(p.g-uDt*.9,0.);
float rr=uR*(.75+.5*noise(fc*.04+uTime*1.3));float sd=seg(fc,uA,uB);float a=smoothstep(rr,rr*.35,sd)*uStr;r=max(r,a);g=max(g,a);
float cb=max(p.b-uDt*.4,0.);cb=max(cb,smoothstep(rr*3.2,rr*.5,sd)*uHalo);
for(int i=0;i<8;i++){if(i>=uN)break;vec4 d=uDrops[i];vec2 dv=fc-d.xy;float L=length(dv);
float t=clamp(d.z/1.1,0.,1.);float grow=1.-pow(1.-t,3.);float nn=fbm(dv/(L+1.)*2.2+d.xy*.013);
float rad=d.w*grow*(.7+.6*nn);float hold=1.-smoothstep(1.4,2.2,d.z);float a2=smoothstep(rad,rad*.82,L)*hold;
r=max(r,a2);g=max(g,a2*(1.-smoothstep(.2,1.6,d.z)));cb=max(cb,smoothstep(rad*1.35,rad*.7,L)*hold);}
o=vec4(r,g,cb,1);}`;

const FS_COMP = `#version 300 es
precision highp float; out vec4 o; uniform sampler2D uScene,uReveal,uMask; uniform vec2 uRes,uTrail,uMouse,uFocusC;
uniform float uTime,uSmear,uStudio,uFocus,uColor,uWave,uWaveA,uGrain; uniform vec3 uPaper,uTint,uRim;
uniform vec4 uCalm[6]; uniform int uCalmN; ${NOISE}
float sdBox(vec2 p,vec2 b){vec2 d=abs(p)-b;return length(max(d,0.))+min(max(d.x,d.y),0.);}
void main(){vec2 uv=gl_FragCoord.xy/uRes;float sp=length(uTrail);
vec2 n=vec2(fbm(uv*3.5+uTime*.15),fbm(uv*3.5+9.1-uTime*.15))-.5;
float md=length(gl_FragCoord.xy-uMouse);float near=exp(-md*md/(2.*150.*150.));
vec2 disp=(n*min(sp,70.)*.9*uSmear+n*near*14.)/uRes;vec2 suv=uv+disp;vec3 sc=texture(uScene,suv).rgb;
if(uSmear>.01&&sp>.5){for(int i=1;i<7;i++){float f=float(i);vec3 t=texture(uScene,suv+uTrail*f*.55/uRes).rgb;sc=min(sc,mix(t,uPaper,mix(1.,f/7.,uSmear)));}}
vec4 m=texture(uMask,uv);float mn=fbm(uv*vec2(uRes.x/uRes.y,1.)*14.);
float cover=smoothstep(.22,.42,m.r+(mn-.5)*.3);vec3 rc=texture(uReveal,uv+n*cover*.006).rgb;
float rink=1.-dot(rc,vec3(.299,.587,.114));float th=1.-m.r*1.25;float vis=smoothstep(th,th+.1,rink);
vec3 col=mix(sc,uPaper,cover);float ink=rink*vis*cover;vec3 tint=mix(vec3(0),uTint,clamp(m.g*1.2,0.,1.));
col*=1.-ink*(1.-tint);float rim=cover*(1.-cover)*4.;col=mix(col,col*uRim,rim*.55*clamp(m.g+.35,0.,1.));
float ca=smoothstep(.03,.75,m.b)*uColor;float gy=dot(col,vec3(.299,.587,.114));col=clamp(mix(vec3(gy),col,ca*1.18),0.,1.);
// la estatua despeja el fondo a su alrededor
vec2 fd=(gl_FragCoord.xy-uFocusC)/uRes.y;float fo=exp(-dot(fd*vec2(1.6,.9),fd*vec2(1.6,.9))*6.);col=mix(col,uPaper,fo*uFocus);
// halo de lámpara detrás de cada objeto apoyado: la mesa se aclara apenas (máx. 20 %), sin desenfoque
float lamp=0.;for(int i=0;i<6;i++){if(i>=uCalmN)break;vec4 r=uCalm[i];float pad=min(r.z,r.w)*.35+140.;
  float d=sdBox(gl_FragCoord.xy-r.xy-r.zw*.5,r.zw*.5);lamp=max(lamp,1.-smoothstep(-pad*.3,pad,d));}
col=mix(col,uPaper*1.02,lamp*.2);
// ola de tinta al cambiar de estilo
if(uWave>-.4&&uWave<1.8){float wx=uv.x+(fbm(uv*vec2(2.,6.)+uTime*.4)-.5)*.22;
  float band=smoothstep(uWave,uWave-.07,wx)*smoothstep(uWave-.62,uWave-.48,wx);
  float fresh=smoothstep(uWave-.22,uWave-.03,wx);vec3 inkc=mix(vec3(.075,.07,.085),uTint*.9,fresh*.55*uColor);
  col=mix(col,inkc,band*uWaveA);}
col+=(hash(gl_FragCoord.xy+floor(uTime*14.))-.5)*.04*uGrain;col+=(fbm(uv*vec2(uRes.x/uRes.y,1.)*60.)-.5)*.035;
if(uStudio>.5){float l=dot(col,vec3(.299,.587,.114));col=clamp(col-l+(1.-l),0.,1.)*vec3(.98,.955,.92);col=vec3(.06,.058,.066)+col*.46;} // estudio: bocetos invertidos y tenues sobre mesa oscura
float v=length(uv-.5)*1.25;col*=1.-.22*v*v;o=vec4(col,1);}`;

const LY = {
  back: { speed: .55, cell: 640, occ: .65, size: [1.45, 1.9], alpha: .22, bias: 3.2, seed: 11, rot: .35 },
  mid: { speed: 1, cell: 430, occ: 1, size: [.62, .86], alpha: 1, bias: 0, seed: 3, rot: .22 },
  front: { speed: 1.4, cell: 520, occ: .2, size: [.34, .46], alpha: .95, bias: 0, seed: 29, rot: .5 },
};
const PAPER = [.89, .882, .862];

export const FX_NAMES = {
  rastro: 'Rastro de tinta', gotas: 'Gotas', redibujo: 'Redibujo', profundidad: 'Profundidad',
  corrida: 'Tinta que se corre', violeta: 'Violeta', fantasma: 'Pincel fantasma', deriva: 'Deriva',
};

export function createBackground(canvas) {
  const G = createGL(canvas);
  if (!G) return null;
  const { gl } = G;
  const reduced = state.reduced;
  const FX = {};
  for (const k in FX_NAMES) FX[k] = config.efectos?.[k] !== false;
  if (reduced) Object.assign(FX, { redibujo: false, corrida: false, fantasma: false, deriva: false });

  const PQ = G.prog(VS_QUAD, FS_QUAD), PM = G.prog(VS_FULL, FS_MASK), PC = G.prog(VS_FULL, FS_COMP);
  const vbQ = G.buffer([-.5, -.5, .5, -.5, -.5, .5, .5, .5]);

  /* ---- texturas: primero miniaturas, después la versión completa ---- */
  const imgs = sketches.map(s => ({ tex: null, aspect: s.h / s.w || 1.3, styles: s.styles, path: s.path, full: false }));
  const N = imgs.length;
  imgs.forEach(r => loadImage(src(r.path, true)).then(im => { if (!r.tex) r.tex = G.texture(im); }).catch(() => {}));
  async function upgrade() {
    for (const r of imgs) {
      if (state.lite) return;
      try {
        const im = await loadImage(src(r.path));
        const old = r.tex;
        r.tex = G.texture(im);
        r.full = true;
        if (old) gl.deleteTexture(old);
      } catch {}
      await new Promise(res => setTimeout(res, 60));
    }
  }
  const idle = window.requestIdleCallback || (f => setTimeout(f, 1200));
  addEventListener('load', () => setTimeout(() => idle(upgrade), 2500), { once: true });

  /* ---- pool de imágenes (filtro por estilo) ---- */
  const all = imgs.map((_, i) => i);
  let pool = all, nextPool = null, wave = -1, waveT = 0, waveA = .93;
  function setStyle(id) {
    const p = id ? all.filter(i => imgs[i].styles.includes(id)) : all;
    if (!p.length) return;
    if (reduced) { pool = p; return; }
    nextPool = p; waveT = 0; wave = -.05; waveA = .93;
  }
  // pincelada de tinta entre secciones (la misma ola, más liviana y sin cambiar bocetos)
  function sweep() {
    if (reduced || nextPool) return;
    nextPool = pool; waveT = 0; wave = -.05; waveA = .55;
  }

  /* ---- render targets ---- */
  let W, H, dpr, S, scene, reveal, mA, mB;
  function resize() {
    // en el celular, menos resolución (y la máscara más chica todavía) para sostener 60 fps
    const mob = isMobile();
    dpr = Math.min(devicePixelRatio || 1, mob ? (state.lite ? .75 : 1) : state.lite ? 1 : 1.5);
    W = Math.floor(innerWidth * dpr); H = Math.floor(innerHeight * dpr);
    canvas.width = W; canvas.height = H;
    S = Math.max(.55, Math.min(1.25, Math.min(innerWidth, innerHeight) / 820)) * dpr;
    [scene, reveal, mA, mB].forEach(G.free);
    scene = G.target(W, H); reveal = G.target(W, H);
    const k = (state.lite ? 3 : 2) + (mob ? 1 : 0);
    mA = G.target(Math.ceil(W / k), Math.ceil(H / k)); mB = G.target(Math.ceil(W / k), Math.ceil(H / k));
    for (const m of [mA, mB]) { gl.bindFramebuffer(gl.FRAMEBUFFER, m.f); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT); }
  }
  // en celular el alto cambia al esconder la barra del navegador: solo re-dimensionar si cambia de verdad
  let lastW = 0, lastH = 0;
  function maybeResize() {
    if (innerWidth === lastW && Math.abs(innerHeight - lastH) < 120) return;
    lastW = innerWidth; lastH = innerHeight; resize();
  }
  maybeResize();
  addEventListener('resize', maybeResize);
  on('lite', () => { resize(); });
  mobileMQ.addEventListener('change', () => resize());

  /* ---- giroscopio (celular): inclinar el teléfono corre la mesa y mueve las capas ---- */
  const tilt = { x: 0, y: 0, tx: 0, ty: 0, on: false };
  function enableTilt() {
    if (tilt.on) return;
    tilt.on = true;
    let base = null;
    addEventListener('deviceorientation', e => {
      if (e.gamma == null || e.beta == null) return;
      // la primera lectura es la posición "de reposo" de la mano
      base ??= { b: e.beta, g: e.gamma };
      tilt.tx = Math.max(-1, Math.min(1, (e.gamma - base.g) / 25));
      tilt.ty = Math.max(-1, Math.min(1, (e.beta - base.b) / 25));
    });
  }

  /* ---- input global ---- */
  const mouse = { x: innerWidth / 2, y: innerHeight / 2, px: null, py: null, has: false };
  const cam = { x: 0, y: 0, vx: 0, vy: 0, px: 0, py: 0 };
  const drops = [];
  // solo en desarrollo: deja ver la cámara y las gotas para las pruebas de arrastre
  if (import.meta.env.DEV) window.__mesa = { cam, drops, mouse };
  let drag = null, focus = { x: -9999, y: -9999, amt: 0 };
  // la mesa no toma gestos que empiezan sobre controles, componentes arrastrables ni láminas
  const INTERACTIVE = 'a,button,input,textarea,select,label,summary,[role="slider"],[data-no-mesa],.lamina,.banda,.ink-menu,dialog';

  addEventListener('pointermove', e => {
    // mientras se arrastra un componente (ficha, página, dial, regla, estatua) la mesa no recibe rastro
    if (state.dragging || (e.buttons && !drag && e.target.closest?.(INTERACTIVE))) { mouse.has = false; return; }
    if (e.pointerType === 'mouse' || drag) {
      mouse.x = e.clientX; mouse.y = e.clientY; mouse.has = true; state.lastInput = state.time;
    }
    if (drag && drag.id === e.pointerId) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
      if (drag.pan) { cam.x -= dx; cam.y -= dy; cam.vx = -dx; cam.vy = -dy; }
    }
  }, { passive: true });
  addEventListener('pointerdown', e => {
    if (e.button > 0 || e.__statue || state.dragging) return;
    if (e.target.closest?.(INTERACTIVE)) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0, pan: e.pointerType === 'mouse' };
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.has = true; mouse.px = mouse.x; mouse.py = mouse.y;
    state.lastInput = state.time;
    if (drag.pan) document.documentElement.classList.add('bg-drag');
  });
  const up = e => {
    if (!drag || drag.id !== e.pointerId) return;
    if (drag.moved < 8 && e.type === 'pointerup' && !state.dragging) addDrop(e.clientX, e.clientY);
    drag = null;
    document.documentElement.classList.remove('bg-drag');
    if (e.pointerType !== 'mouse') mouse.has = false;
  };
  addEventListener('pointerup', up);
  addEventListener('pointercancel', up);
  document.addEventListener('pointerleave', () => { mouse.has = false; });
  // el scroll arrastra el papel (parallax) y deja estela
  let lastScroll = scrollY;
  addEventListener('scroll', () => { const d = scrollY - lastScroll; lastScroll = scrollY; cam.y += d * .5; }, { passive: true });

  function addDrop(x, y, scale = 1) {
    if (!FX.gotas) return;
    drops.push({ x: x * mA.w / innerWidth, y: (innerHeight - y) * mA.h / innerHeight, age: 0, r: Math.min(mA.w, mA.h) * (.16 + Math.random() * .12) * scale });
    if (drops.length > 8) drops.shift();
  }

  /* ---- zonas de calma ---- */
  const calmEls = new Set();
  const calmIO = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? calmEls.add(e.target) : calmEls.delete(e.target)));
  function watchCalm(root = document) { root.querySelectorAll('[data-calm]').forEach(el => calmIO.observe(el)); }
  const calmArr = new Float32Array(24);

  /* ---- dibujo ---- */
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function redraw(i, j) {
    if (!FX.redibujo || h32(i, j, 91) > .35) return 1;
    const ph = (state.time + h32(i, j, 92) * 40) % 15;
    if (ph < .9) return 1 - ph / .9;
    if (ph < 4.6) return ease((ph - .9) / 3.7);
    return 1;
  }
  function layer(L, cx, cy, iseed, pf) {
    const cell = L.cell * S, ox = cx * L.speed * dpr, oy = cy * L.speed * dpr, u = PQ.u;
    const i0 = Math.floor((ox - W / 2) / cell) - 1, i1 = Math.ceil((ox + W / 2) / cell) + 1;
    const j0 = Math.floor((oy - H / 2) / cell) - 1, j1 = Math.ceil((oy + H / 2) / cell) + 1;
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      if (h32(i, j, L.seed + 7) > L.occ) continue;
      const x = (i + .5 + (h32(i, j, L.seed + 1) - .5) * .5) * cell - ox + W / 2;
      const y = (j + .5 + (h32(i, j, L.seed + 2) - .5) * .5) * cell - oy + H / 2;
      // durante la ola, lo que ya quedó detrás de la tinta usa el estilo nuevo
      const P = nextPool && x / W < wave - .28 ? nextPool : pool;
      const im = imgs[P[Math.floor(h32(i, j, iseed) * P.length) % P.length]];
      if (!im || !im.tex) continue;
      const w = L.cell * S * (L.size[0] + h32(i, j, L.seed + 3) * (L.size[1] - L.size[0])), hh = w * im.aspect;
      if (x + w < 0 || x - w > W || y + hh < 0 || y - hh > H) continue;
      gl.bindTexture(gl.TEXTURE_2D, im.tex);
      gl.uniform2f(u.uCenter, x, y); gl.uniform2f(u.uSize, w, hh); gl.uniform1f(u.uRot, (h32(i, j, L.seed + 4) - .5) * L.rot);
      gl.uniform1f(u.uAlpha, L.alpha); gl.uniform1f(u.uBias, L.bias); gl.uniform1f(u.uProg, pf ? pf(i, j) : 1);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }

  let ghostT = 0, wasGhost = false, calmAmt = 0, visible = true;
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

  addTicker(dt => {
    if (!visible) return;
    const time = state.time;
    // cámara: inercia + deriva lenta (más lenta donde hay texto)
    if (!drag || !drag.pan) { cam.x += cam.vx; cam.y += cam.vy; const f = Math.pow(.93, dt * 60); cam.vx *= f; cam.vy *= f; }
    else { cam.vx *= .7; cam.vy *= .7; }
    if (FX.deriva && !reduced) { cam.y += dt * 6; cam.x += dt * 2.5; }
    if (tilt.on) {
      tilt.x += (tilt.tx - tilt.x) * Math.min(1, dt * 4);
      tilt.y += (tilt.ty - tilt.y) * Math.min(1, dt * 4);
      cam.x += tilt.x * dt * 60; cam.y += tilt.y * dt * 60;
    }
    const trail = [(cam.x - cam.px) * dpr, -(cam.y - cam.py) * dpr];
    cam.px = cam.x; cam.py = cam.y;

    // ola
    if (nextPool) { waveT += dt; wave = -.05 + waveT / 1.25 * 1.85; if (wave > 1.75) { pool = nextPool; nextPool = null; wave = -1; } }

    // calma
    let n = 0, area = 0;
    for (const el of calmEls) {
      if (n >= 6) break;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) continue;
      calmArr.set([r.left * dpr, (innerHeight - r.bottom) * dpr, r.width * dpr, r.height * dpr], n * 4);
      area += Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)) * Math.min(r.width, innerWidth);
      n++;
    }
    calmAmt += (Math.min(1, area / (innerWidth * innerHeight) * 1.6) - calmAmt) * Math.min(1, dt * 2);

    // pincel: cursor real o fantasma
    let bx = mouse.x, by = mouse.y, on = mouse.has && FX.rastro && !state.hoverZone;
    const ghost = time - state.lastInput > 3.5 && FX.fantasma && FX.rastro && !reduced;
    if (ghost) {
      ghostT += dt; on = true;
      bx = innerWidth * (.5 + .38 * Math.sin(ghostT * .53) + .08 * Math.sin(ghostT * 1.7));
      by = innerHeight * (.5 + .3 * Math.sin(ghostT * .71 + 1.2) + .06 * Math.cos(ghostT * 2.3));
    }
    // al pasar de cursor a fantasma (o al revés) no unir los dos puntos con un trazo
    if (ghost !== wasGhost) { mouse.px = bx; mouse.py = by; wasGhost = ghost; }
    const ax = mouse.px ?? bx, ay = mouse.py ?? by;
    const spd = Math.hypot(bx - ax, by - ay);

    // escena + capa a revelar
    gl.useProgram(PQ.p); G.useBuf(vbQ); gl.uniform2f(PQ.u.uRes, W, H); gl.uniform1i(PQ.u.uTex, 0); gl.activeTexture(gl.TEXTURE0);
    gl.enable(gl.BLEND); gl.blendFunc(gl.DST_COLOR, gl.ZERO);
    const mx = (mouse.x - innerWidth / 2) * .04 + tilt.x * 22, my = (mouse.y - innerHeight / 2) * .04 + tilt.y * 22;
    // en el celular, una sola capa de bocetos (sin las de profundidad)
    const depth = FX.profundidad && !state.lite && !isMobile();
    gl.bindFramebuffer(gl.FRAMEBUFFER, scene.f); gl.viewport(0, 0, W, H); gl.clearColor(...PAPER, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    if (depth) layer(LY.back, cam.x - mx * 2, cam.y - my * 2, 57, null);
    layer(LY.mid, cam.x, cam.y, LY.mid.seed, redraw);
    if (depth) layer(LY.front, cam.x + mx * 3, cam.y + my * 3, 77, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, reveal.f); gl.clearColor(1, 1, 1, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    layer(LY.mid, cam.x, cam.y, LY.mid.seed + 101, null);
    layer({ ...LY.front, speed: 1, occ: .45, size: [.5, .7], seed: 41 }, cam.x, cam.y, 131, null);
    gl.disable(gl.BLEND);

    // máscara
    gl.useProgram(PM.p); gl.bindFramebuffer(gl.FRAMEBUFFER, mB.f); gl.viewport(0, 0, mA.w, mA.h);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, mA.t);
    const u = PM.u, sx = mA.w / innerWidth, sy = mA.h / innerHeight;
    gl.uniform1i(u.uPrev, 0); gl.uniform2f(u.uRes, mA.w, mA.h);
    gl.uniform2f(u.uA, ax * sx, (innerHeight - ay) * sy); gl.uniform2f(u.uB, bx * sx, (innerHeight - by) * sy);
    gl.uniform1f(u.uR, (22 + Math.min(spd, 50) * 1.1) * sx * S / dpr * 1.1);
    const str = on ? Math.min(1, .35 + spd * .08) : 0;
    gl.uniform1f(u.uStr, str);
    // el halo de color sigue al cursor aunque esté sobre la estatua
    gl.uniform1f(u.uHalo, (mouse.has || on) && FX.violeta ? Math.min(1, .35 + spd * .08) : 0);
    gl.uniform1f(u.uDt, dt); gl.uniform1f(u.uTime, time);
    for (const d of drops) d.age += dt;
    while (drops.length && drops[0].age > 3) drops.shift();
    const arr = new Float32Array(32);
    drops.forEach((d, i) => arr.set([d.x, d.y, d.age, d.r], i * 4));
    gl.uniform4fv(u.uDrops, arr); gl.uniform1i(u.uN, drops.length);
    G.drawFull();
    [mA, mB] = [mB, mA];

    // composición
    gl.useProgram(PC.p); gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
    const c = PC.u;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, scene.t); gl.uniform1i(c.uScene, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, reveal.t); gl.uniform1i(c.uReveal, 1);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, mA.t); gl.uniform1i(c.uMask, 2);
    gl.uniform2f(c.uRes, W, H);
    const smear = FX.corrida ? 1 : 0;
    gl.uniform2f(c.uTrail, trail[0], trail[1]);
    gl.uniform2f(c.uMouse, mouse.has ? mouse.x * dpr : -9999, mouse.has ? (innerHeight - mouse.y) * dpr : -9999);
    gl.uniform2f(c.uFocusC, focus.x * dpr, (innerHeight - focus.y) * dpr); gl.uniform1f(c.uFocus, focus.amt);
    gl.uniform1f(c.uTime, time); gl.uniform1f(c.uSmear, smear); gl.uniform1f(c.uStudio, state.studio ? 1 : 0);
    gl.uniform1f(c.uColor, FX.violeta ? 1 : 0); gl.uniform1f(c.uWave, nextPool ? wave : -1); gl.uniform1f(c.uWaveA, waveA); gl.uniform1f(c.uGrain, reduced ? 0 : 1);
    gl.uniform3f(c.uPaper, ...PAPER);
    gl.uniform4fv(c.uCalm, calmArr); gl.uniform1i(c.uCalmN, n);
    // la inversión del modo estudio conserva el tono: el violeta sigue siendo violeta
    gl.uniform3f(c.uTint, .42, .22, .78); gl.uniform3f(c.uRim, .45, .3, .75);
    G.drawFull();
    mouse.px = bx; mouse.py = by;
  });

  return {
    FX,
    addDrop,
    enableTilt,
    setStyle,
    sweep,
    watchCalm,
    // al cambiar de página el scroll vuelve a 0 de golpe: la mesa no se mueve por eso
    syncScroll() { lastScroll = scrollY; },
    setFocus(x, y, amt) { focus = { x, y, amt }; },
    setFx(k, v) { FX[k] = v; },
  };
}
