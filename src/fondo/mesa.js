/* La mesa de bocetos (WebGL2), portada tal cual del boceto aprobado (referencia/boceto-crudo.html).
   Lienzo infinito de bocetos en capas generado por hash, blend multiplicativo, máscara ping-pong RGB
   (R revelado, G frescura, B halo violeta), gotas, smear por velocidad, redibujo, profundidad,
   zonas de lectura (uRects) y modo noche (uStudio). No cambiar intensidades: el cliente lo aprobó así. */

export const NOISE = `
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){return .55*noise(p)+.3*noise(p*2.1+3.7)+.15*noise(p*4.3-1.9);}
`;

/* ctx: { canvas, urls, IS_TOUCH, FX, mouse, cam, drops, get time(), get studio() } */
// violeta del pincel dentro de las zonas de lectura (35 % del normal; bajarlo a .25 si compite con el texto)
export const VIOLETA_LECTURA = .35;

export function createMesa(ctx) {
  const { canvas: bgc, urls, IS_TOUCH, FX, mouse, cam, drops } = ctx;
  const gl = bgc.getContext('webgl2', { antialias: false });
  if (!gl) return null;
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
  const VS_FULL = `#version 300 es
in vec2 aPos; void main(){gl_Position=vec4(aPos,0,1);}`;
  const FS_MASK = `#version 300 es
precision highp float; out vec4 o; uniform sampler2D uPrev; uniform vec2 uRes,uA,uB; uniform float uR,uStr,uDt,uTime,uPaint;
uniform vec4 uDrops[8]; uniform int uN; ${NOISE}
float seg(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/max(dot(ba,ba),1e-4),0.,1.);return length(pa-ba*h);}
void main(){vec2 fc=gl_FragCoord.xy,uv=fc/uRes,px=1./uRes;
vec2 n=vec2(noise(uv*7.+uTime*.25),noise(uv*7.+17.3-uTime*.25))-.5;vec4 p=texture(uPrev,uv+n*2.5*px);
float b=(texture(uPrev,uv+vec2(px.x,0)).r+texture(uPrev,uv-vec2(px.x,0)).r+texture(uPrev,uv+vec2(0,px.y)).r+texture(uPrev,uv-vec2(0,px.y)).r)*.25;
float r=max(mix(p.r,b,.3)-uDt*.36,0.);float g=max(p.g-uDt*.9,0.);
float rr=uR*(.75+.5*noise(fc*.04+uTime*1.3));float sd=seg(fc,uA,uB);float a=smoothstep(rr,rr*.35,sd)*uStr*uPaint;r=max(r,a);g=max(g,a);
float cb=max(p.b-uDt*.4,0.);cb=max(cb,smoothstep(rr*3.2,rr*.5,sd)*uStr);
for(int i=0;i<8;i++){if(i>=uN)break;vec4 d=uDrops[i];vec2 dv=fc-d.xy;float L=length(dv);
float t=clamp(d.z/1.1,0.,1.);float grow=1.-pow(1.-t,3.);float nn=fbm(dv/(L+1.)*2.2+d.xy*.013);
float rad=d.w*grow*(.7+.6*nn);float hold=1.-smoothstep(1.4,2.2,d.z);float a2=smoothstep(rad,rad*.82,L)*hold;
r=max(r,a2);g=max(g,a2*(1.-smoothstep(.2,1.6,d.z)));cb=max(cb,smoothstep(rad*1.35,rad*.7,L)*hold);}
o=vec4(r,g,cb,1);}`;
  const FS_COMP = `#version 300 es
precision highp float; out vec4 o; uniform sampler2D uScene,uReveal,uMask; uniform vec2 uRes,uTrail,uMouse,uFocusC;
uniform float uTime,uSmear,uStudio,uFocus,uFeather,uVio; uniform vec3 uPaper,uTint,uRim,uTintM,uRimM; uniform vec4 uRects[24]; uniform int uNR; ${NOISE}
void main(){vec2 uv=gl_FragCoord.xy/uRes;float sp=length(uTrail);
vec2 n=vec2(fbm(uv*3.5+uTime*.15),fbm(uv*3.5+9.1-uTime*.15))-.5;
float md=length(gl_FragCoord.xy-uMouse);float near=exp(-md*md/(2.*150.*150.));
vec2 disp=(n*min(sp,70.)*.9*uSmear+n*near*14.)/uRes;vec2 suv=uv+disp;vec3 sc=texture(uScene,suv).rgb;
if(uSmear>.5&&sp>.5){for(int i=1;i<7;i++){float f=float(i);vec3 t=texture(uScene,suv+uTrail*f*.55/uRes).rgb;sc=min(sc,mix(t,uPaper,f/7.));}}
vec4 m=texture(uMask,uv);float mn=fbm(uv*vec2(uRes.x/uRes.y,1.)*14.);
float cover=smoothstep(.22,.42,m.r+(mn-.5)*.3);vec3 rc=texture(uReveal,uv+n*cover*.006).rgb;
float rink=1.-dot(rc,vec3(.299,.587,.114));float th=1.-m.r*1.25;float vis=smoothstep(th,th+.1,rink);
float lr=0.;for(int i=0;i<24;i++){if(i>=uNR)break;vec4 R=uRects[i];vec2 q=abs(gl_FragCoord.xy-(R.xy+R.zw*.5))-R.zw*.5;float d=length(max(q,0.))+min(max(q.x,q.y),0.);
  // lejos de la zona no aporta y bien adentro vale 1: el ruido del borde se calcula solo en la franja del borde (mismo resultado)
  if(d>=uFeather*1.6)continue;if(d<=-uFeather*.35){lr=1.;break;}
  float w=fbm(gl_FragCoord.xy/uRes.y*9.+float(i))*uFeather*.6;lr=max(lr,1.-smoothstep(-uFeather*.35,uFeather+w,d));}
// fuera de las islas, el pincel con los colores de la versión anterior; adentro, los de ahora
vec3 cT=mix(uTintM,uTint,lr),cR=mix(uRimM,uRim,lr);
vec3 col=mix(sc,uPaper,cover);float ink=rink*vis*cover*(1.-lr);vec3 tint=mix(vec3(0),cT,clamp(m.g*1.2,0.,1.));
col*=1.-ink*(1.-tint);float rim=cover*(1.-cover)*4.;col=mix(col,col*cR,rim*.55*clamp(m.g+.35,0.,1.));
vec2 fd=(gl_FragCoord.xy-uFocusC)/uRes.y;float fo=exp(-dot(fd*vec2(1.6,.9),fd*vec2(1.6,.9))*6.);
float ca=smoothstep(.03,.75,m.b);float gy=dot(col,vec3(.299,.587,.114));col=clamp(mix(vec3(gy),col,ca*1.18),0.,1.);
col=mix(col,uPaper,fo*uFocus);
col=mix(col,uPaper,lr*.94);
float vz=ca*clamp(m.g*1.6,0.,1.)*lr;col=mix(col,col*uRim,vz*uVio);
col+=(hash(gl_FragCoord.xy+floor(uTime*14.))-.5)*.04;col+=(fbm(uv*vec2(uRes.x/uRes.y,1.)*60.)-.5)*.035;
// grano de papel de la versión anterior (era una capa CSS encima de todo): fuera de las islas oscurece apenas la mesa
float gr=(.5+(hash(floor(gl_FragCoord.xy*.75)+floor(uTime*5.)*7.13)-.5)*.8)*(1.-lr);
if(uStudio>.5){float l=dot(col,vec3(.299,.587,.114));vec3 inv=clamp(col-l+(1.-l),0.,1.)*vec3(.98,.955,.92);
  // noche: fuera de las islas, bocetos tenues en trazo claro sobre gris oscuro (como antes); adentro, como ahora
  col=mix(vec3(.06,.058,.066)+inv*.46,inv,lr);col=mix(col,vec3(1),.081*gr);}
else col*=1.-.054*gr;
float v=length(uv-.5)*1.25;col*=1.-.22*v*v;o=vec4(col,1);}`;

  function sh(t, s) { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; }
  function prog(v, f) {
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, v)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, f)); gl.bindAttribLocation(p, 0, 'aPos'); gl.linkProgram(p);
    const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); u[info.name.replace('[0]', '')] = gl.getUniformLocation(p, info.name); } return { p, u };
  }
  const PQ = prog(VS_QUAD, FS_QUAD), PM = prog(VS_FULL, FS_MASK), PC = prog(VS_FULL, FS_COMP);
  const vbQ = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbQ); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-.5, -.5, .5, -.5, -.5, .5, .5, .5]), gl.STATIC_DRAW);
  const vbF = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbF); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); const useBuf = b => { gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); };
  const targets = [];
  function target(w, h) {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]].forEach(([k, v]) => gl.texParameteri(gl.TEXTURE_2D, k, v));
    const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    const r = { t, f, w, h }; targets.push(r); return r;
  }
  // "lista": la primera textura cargada y dibujada en un frame (la espera la pantalla de carga)
  let hayTextura = false, avisar = null;
  const lista = new Promise(r => { avisar = r; });
  const N = urls.length, imgs = [], cola = [];
  for (let i = 0; i < N; i++) {
    const im = new Image(), r = { tex: null, aspect: 1 };
    // se decodifica fuera del hilo principal y se sube a la GPU de a una por frame (cola en render)
    const subir = () => {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im); gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); r.tex = t; r.aspect = im.naturalHeight / im.naturalWidth; hayTextura = true;
    };
    im.decoding = 'async'; im.src = urls[i]; imgs.push(r);
    (im.decode ? im.decode() : new Promise((ok, no) => { im.onload = ok; im.onerror = no; })).then(() => cola.push(subir)).catch(() => { /* sin esa imagen */ });
  }
  let W, H, dpr, S, scene, reveal, mA, mB;
  function resize() {
    // libera los destinos anteriores antes de crear los nuevos
    for (const r of targets.splice(0)) { gl.deleteTexture(r.t); gl.deleteFramebuffer(r.f); }
    dpr = Math.min(devicePixelRatio || 1, IS_TOUCH ? 1 : 1.5); W = Math.floor(innerWidth * dpr); H = Math.floor(innerHeight * dpr); bgc.width = W; bgc.height = H;
    S = Math.max(.55, Math.min(1.25, Math.min(innerWidth, innerHeight) / 820)) * dpr; scene = target(W, H); reveal = target(W, H);
    const md = IS_TOUCH ? 3 : 2; mA = target(Math.ceil(W / md), Math.ceil(H / md)); mB = target(Math.ceil(W / md), Math.ceil(H / md));
    for (const m of [mA, mB]) { gl.bindFramebuffer(gl.FRAMEBUFFER, m.f); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT); }
  }
  // en táctil se ignoran los resize que solo cambian la altura menos de 180 px (la barra del navegador)
  resize(); let lw = innerWidth, lh = innerHeight;
  addEventListener('resize', () => { if (IS_TOUCH && innerWidth === lw && Math.abs(innerHeight - lh) < 180) return; lw = innerWidth; lh = innerHeight; resize(); });
  function h32(a, b, s) { let x = Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(s, 2246822519); x = Math.imul(x ^ (x >>> 13), 1274126177); x ^= x >>> 16; return (x >>> 0) / 4294967296; }
  const LY = {
    back: { speed: .55, cell: 640, occ: .65, size: [1.45, 1.9], alpha: .22, bias: 3.2, seed: 11, rot: .35 },
    mid: { speed: 1, cell: 430, occ: 1, size: [.62, .86], alpha: 1, bias: 0, seed: 3, rot: .22 },
    front: { speed: 1.4, cell: 520, occ: .2, size: [.34, .46], alpha: .95, bias: 0, seed: 29, rot: .5 },
  };
  function layer(L, cx, cy, iseed, pf) {
    const cell = L.cell * S, ox = cx * L.speed * dpr, oy = cy * L.speed * dpr, u = PQ.u;
    const i0 = Math.floor((ox - W / 2) / cell) - 1, i1 = Math.ceil((ox + W / 2) / cell) + 1, j0 = Math.floor((oy - H / 2) / cell) - 1, j1 = Math.ceil((oy + H / 2) / cell) + 1;
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      if (h32(i, j, L.seed + 7) > L.occ) continue;
      const im = imgs[Math.floor(h32(i, j, iseed) * N) % N]; if (!im.tex) continue;
      const x = (i + .5 + (h32(i, j, L.seed + 1) - .5) * .5) * cell - ox + W / 2, y = (j + .5 + (h32(i, j, L.seed + 2) - .5) * .5) * cell - oy + H / 2;
      const w = L.cell * S * (L.size[0] + h32(i, j, L.seed + 3) * (L.size[1] - L.size[0])), hh = w * im.aspect;
      if (x + w < 0 || x - w > W || y + hh < 0 || y - hh > H) continue; gl.bindTexture(gl.TEXTURE_2D, im.tex);
      gl.uniform2f(u.uCenter, x, y); gl.uniform2f(u.uSize, w, hh); gl.uniform1f(u.uRot, (h32(i, j, L.seed + 4) - .5) * L.rot);
      gl.uniform1f(u.uAlpha, L.alpha); gl.uniform1f(u.uBias, L.bias); gl.uniform1f(u.uProg, pf ? pf(i, j) : 1); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function redraw(i, j) { if (!FX.redraw || h32(i, j, 91) > .35) return 1; const ph = (ctx.time + h32(i, j, 92) * 40) % 15; if (ph < .9) return 1 - ph / .9; if (ph < 4.6) return ease((ph - .9) / 3.7); return 1; }
  const PAPER = [.89, .882, .862];
  function addDrop(x, y, scale = 1) { if (!FX.drops) return; drops.push({ x: x * mA.w / innerWidth, y: (innerHeight - y) * mA.h / innerHeight, age: 0, r: Math.min(mA.w, mA.h) * (.16 + Math.random() * .12) * scale }); if (drops.length > 8) drops.shift(); }
  function render(dt, brush, focus, rects) {
    const time = ctx.time, studio = ctx.studio;
    cola.shift()?.();
    gl.useProgram(PQ.p); useBuf(vbQ); gl.uniform2f(PQ.u.uRes, W, H); gl.uniform1i(PQ.u.uTex, 0); gl.activeTexture(gl.TEXTURE0);
    gl.enable(gl.BLEND); gl.blendFunc(gl.DST_COLOR, gl.ZERO); const mx = (mouse.x - innerWidth / 2) * .04, my = (mouse.y - innerHeight / 2) * .04;
    gl.bindFramebuffer(gl.FRAMEBUFFER, scene.f); gl.viewport(0, 0, W, H); gl.clearColor(...PAPER, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    if (FX.depth) layer(LY.back, cam.x - mx * 2, cam.y - my * 2, 57, null); layer(LY.mid, cam.x, cam.y, LY.mid.seed, redraw); if (FX.depth) layer(LY.front, cam.x + mx * 3, cam.y + my * 3, 77, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, reveal.f); gl.clearColor(1, 1, 1, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    layer(LY.mid, cam.x, cam.y, LY.mid.seed + 101, null); layer({ ...LY.front, speed: 1, occ: .45, size: [.5, .7], seed: 41 }, cam.x, cam.y, 131, null); gl.disable(gl.BLEND);
    gl.useProgram(PM.p); useBuf(vbF); gl.bindFramebuffer(gl.FRAMEBUFFER, mB.f); gl.viewport(0, 0, mA.w, mA.h); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, mA.t);
    const u = PM.u; gl.uniform1i(u.uPrev, 0); gl.uniform2f(u.uRes, mA.w, mA.h); const sx = mA.w / innerWidth, sy = mA.h / innerHeight;
    gl.uniform2f(u.uA, brush.ax * sx, (innerHeight - brush.ay) * sy); gl.uniform2f(u.uB, brush.bx * sx, (innerHeight - brush.by) * sy);
    gl.uniform1f(u.uR, (22 + Math.min(brush.spd, 50) * 1.1) * sx * S / dpr * 1.1); gl.uniform1f(u.uStr, brush.on ? Math.min(1, .35 + brush.spd * .08) : 0); gl.uniform1f(u.uPaint, brush.paint === false ? 0 : 1);
    gl.uniform1f(u.uDt, dt); gl.uniform1f(u.uTime, time); for (const d of drops) d.age += dt; while (drops.length && drops[0].age > 3) drops.shift();
    const arr = new Float32Array(32); drops.forEach((d, i) => arr.set([d.x, d.y, d.age, d.r], i * 4)); gl.uniform4fv(u.uDrops, arr); gl.uniform1i(u.uN, drops.length);
    gl.drawArrays(gl.TRIANGLES, 0, 3);[mA, mB] = [mB, mA];
    gl.useProgram(PC.p); gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H); const c = PC.u;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, scene.t); gl.uniform1i(c.uScene, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, reveal.t); gl.uniform1i(c.uReveal, 1);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, mA.t); gl.uniform1i(c.uMask, 2);
    gl.uniform2f(c.uRes, W, H); gl.uniform2f(c.uTrail, cam.vx * dpr, -cam.vy * dpr);
    gl.uniform2f(c.uMouse, mouse.has ? mouse.x * dpr : -9999, mouse.has ? (innerHeight - mouse.y) * dpr : -9999);
    gl.uniform2f(c.uFocusC, focus.x * dpr, (innerHeight - focus.y) * dpr); gl.uniform1f(c.uFocus, focus.amt);
    const ra = new Float32Array(96), rr = (rects || []).slice(0, 24); rr.forEach((r, i) => ra.set([r.x * dpr, (innerHeight - r.y - r.h) * dpr, r.w * dpr, r.h * dpr], i * 4)); gl.uniform4fv(c.uRects, ra); gl.uniform1i(c.uNR, rr.length); gl.uniform1f(c.uFeather, 64 * dpr); gl.uniform1f(c.uVio, VIOLETA_LECTURA);
    gl.uniform1f(c.uTime, time); gl.uniform1f(c.uSmear, FX.smear ? 1 : 0); gl.uniform1f(c.uStudio, studio ? 1 : 0); gl.uniform3f(c.uPaper, ...PAPER);
    // de noche el pincel sigue siendo violeta (nunca verde). uTint/uRim: dentro de las islas;
    // uTintM/uRimM: el resto de la mesa, con los valores de la versión anterior (iguales de día y de noche)
    if (studio) { gl.uniform3f(c.uTint, .5, .32, .95); gl.uniform3f(c.uRim, .55, .4, .9); } else { gl.uniform3f(c.uTint, .42, .22, .78); gl.uniform3f(c.uRim, .45, .3, .75); }
    gl.uniform3f(c.uTintM, .42, .22, .78); gl.uniform3f(c.uRimM, .45, .3, .75);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (hayTextura && avisar) { avisar(); avisar = null; }
  }
  // libera el contexto (al pasar al modo liviano)
  function destroy() { gl.getExtension('WEBGL_lose_context')?.loseContext(); }
  return { render, addDrop, destroy, lista };
}
