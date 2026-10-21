/* Piel generada por código + un boceto que evoluciona (usado en Proceso y Cuidados).
   Todo sale de UN boceto: garabato, grafito, tinta, stencil violeta, recién tatuado y curado. */
import { createGL, NOISE, VS_FULL } from '../lib/gl.js';
import { state, addTicker } from '../lib/state.js';
import { loadImage } from '../lib/media.js';

const FS = `#version 300 es
precision highp float; out vec4 o;
uniform sampler2D uTex; uniform vec2 uRes; uniform float uAsp,uTime;
uniform float uIdea,uPencil,uLine,uSkin,uStencil,uInk,uRed,uSwell,uGloss,uPeel,uCloud,uHeal;
uniform vec3 uTone; ${NOISE}
vec3 vor(vec2 x){vec2 i=floor(x),f=fract(x);float m1=8.,m2=8.;float id=0.;
  for(int y=-1;y<=1;y++)for(int xx=-1;xx<=1;xx++){vec2 g=vec2(xx,y);vec2 c=i+g;vec2 ofs=vec2(hash(c),hash(c+17.3));float d=length(g+ofs-f);
    if(d<m1){m2=m1;m1=d;id=hash(c+5.1);}else if(d<m2)m2=d;}
  return vec3(m1,m2,id);}
vec2 D; // uv del diseño
float inkAt(vec2 uv,float lod){vec3 c=textureLod(uTex,uv,lod).rgb;vec2 e=smoothstep(vec2(0),vec2(.02),uv)*smoothstep(vec2(0),vec2(.02),1.-uv);
  return (1.-dot(c,vec3(.299,.587,.114)))*e.x*e.y;}
void main(){
  vec2 p=gl_FragCoord.xy/uRes; p.y=1.-p.y; float ca=uRes.x/uRes.y;
  vec2 sp=vec2(p.x*ca,p.y);
  vec2 q=p-.5; q.x*=ca; float bh=.8, bw=bh/uAsp; if(bw>.8*ca){bw=.8*ca;bh=bw*uAsp;}
  D=q/vec2(bw,bh)+.5;

  /* ---- papel: idea, lápiz, línea ---- */
  vec3 paper=vec3(.945,.932,.905)*(1.-(fbm(sp*90.)-.5)*.05);
  vec3 col=paper;
  // 1 idea: garabato a mano alzada (contornos temblorosos de una versión muy borrosa)
  vec2 wob=D+(vec2(noise(D*5.),noise(D*5.+9.))-.5)*.03;
  float b=inkAt(wob,4.6);
  float scrib=max(smoothstep(.05,0.,abs(b-.22)),smoothstep(.04,0.,abs(b-.42))*.8);
  scrib*=.6+.4*noise(sp*60.);
  col=mix(col,vec3(.32,.32,.36),scrib*uIdea*.85);
  // 2 lápiz: grafito gris, trazo suave con trama
  float g=smoothstep(.12,.85,inkAt(D,1.3));
  float hatch=.86+.14*sin((sp.x+sp.y)*uRes.y*.9+noise(sp*40.)*3.);
  col*=1.-g*hatch*uPencil*vec3(.6,.6,.58);
  col+=g*uPencil*.04*pow(max(0.,sin(sp.x*9.+sp.y*4.)),8.); // brillo del grafito
  // 3 línea final: tinta limpia
  float l=smoothstep(.32,.58,inkAt(D,0.));
  col=mix(col,vec3(.07,.065,.08),l*uLine);

  /* ---- piel ---- */
  float nx=(p.x-.5)*2.;
  float shade=.8+.2*sqrt(max(0.,1.-nx*nx*.85));            // volumen de antebrazo
  vec3 skin=uTone*(.94+.1*(fbm(sp*3.)-.5));
  skin=mix(skin,skin*vec3(1.04,.94,.92),smoothstep(.55,.8,fbm(sp*6.+3.))*.35);
  vec3 v=vor(sp*70.); skin*=1.-smoothstep(.16,0.,v.x)*.09;     // poros
  float crease=smoothstep(.9,1.,noise(vec2(sp.x*4.,sp.y*30.)+fbm(sp*5.)*3.)); skin*=1.-crease*.035; // líneas finas
  float blur=inkAt(D,4.2), r=smoothstep(.02,.32,blur);
  // enrojecimiento e hinchazón alrededor de la tinta
  skin=mix(skin,skin*vec3(1.12,.66,.62)+vec3(.05,0.,0.),uRed*(r*.75+.12));
  skin*=1.+uSwell*.08*r;
  skin*=shade;
  // stencil violeta (papel de calco)
  vec2 sj=D+(vec2(noise(D*40.),noise(D*40.+3.))-.5)*.003;
  float st=smoothstep(.3,.55,inkAt(sj,.6))*(.75+.25*noise(sp*80.));
  float haze=inkAt(D,3.2)*.35;
  skin*=mix(vec3(1.),vec3(.52,.36,.86),clamp(st*.9+haze*.4,0.,1.)*uStencil);
  // tatuaje: negro intenso fresco → asentado al curar
  float lod=mix(0.,1.1,uHeal);
  float t=smoothstep(.3,.58,inkAt(D,lod))*(.93+.07*noise(sp*120.));
  vec3 inkc=mix(vec3(.035,.035,.045),vec3(.11,.115,.135),uHeal);
  vec3 sk=mix(skin,inkc*shade,t*uInk*(1.-.12*uHeal));
  // velo lechoso (segunda semana)
  sk=mix(sk,mix(skin,vec3(.82,.8,.78)*shade,.5),uCloud*t*.42);
  // descamación: escamas claras de borde oscuro sobre la zona tatuada
  vec3 fv=vor(sp*26.);
  float flake=step(.5,fv.z)*smoothstep(.05,.3,blur);
  float edge=smoothstep(.06,0.,fv.y-fv.x);
  sk=mix(sk,skin*1.1+.05,uPeel*flake*(.55+.3*fv.z));
  sk*=1.-uPeel*edge*smoothstep(.05,.3,blur)*.35;
  // film protector / plasma: brillos alargados y arrugas del plástico
  float streak=pow(fbm(vec2(sp.x*2.2+sp.y*.8,sp.y*6.)+uTime*.04),3.)*1.6;
  float wr=smoothstep(.992,1.,sin(fbm(sp*3.5+1.)*46.))*smoothstep(.2,.7,fbm(sp*2.+7.));
  sk+=uGloss*(streak*.24+wr*.07+t*.05);
  sk+=pow(max(0.,1.-abs(nx+.38)*3.),6.)*.06;                // reflejo suave de la piel

  col=mix(col,sk,uSkin);
  float vg=length(p-.5)*1.1; col*=1.-.18*vg*vg;
  o=vec4(clamp(col,0.,1.),1);
}`;

export const TONES = [
  { name: 'Clara', rgb: [.93, .78, .68] },
  { name: 'Media', rgb: [.76, .56, .42] },
  { name: 'Oscura', rgb: [.44, .3, .22] },
];

export function createSkin(canvas, imageUrl) {
  const G = createGL(canvas, { alpha: false, preserveDrawingBuffer: false });
  if (!G) return null;
  const { gl } = G;
  const P = G.prog(VS_FULL, FS);
  const params = { uIdea: 0, uPencil: 0, uLine: 0, uSkin: 0, uStencil: 0, uInk: 0, uRed: 0, uSwell: 0, uGloss: 0, uPeel: 0, uCloud: 0, uHeal: 0 };
  let tex = null, asp = 1, tone = TONES[0].rgb, dirty = true, visible = false, t = 0;
  loadImage(imageUrl).then(im => { tex = G.texture(im); asp = im.naturalHeight / im.naturalWidth; dirty = true; });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, state.lite ? 1 : 1.75);
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (w && h && (canvas.width !== w || canvas.height !== h)) { canvas.width = w; canvas.height = h; dirty = true; }
  }
  new ResizeObserver(resize).observe(canvas);

  addTicker(dt => {
    if (!visible || !tex) return;
    t += dt;
    // con film/brillo animado se redibuja siempre; si no, solo cuando cambia algo
    if (!dirty && !(params.uGloss > .01 && !state.reduced)) return;
    dirty = false;
    resize();
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(P.p);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
    const u = P.u;
    gl.uniform1i(u.uTex, 0); gl.uniform2f(u.uRes, canvas.width, canvas.height); gl.uniform1f(u.uAsp, asp); gl.uniform1f(u.uTime, t);
    gl.uniform3f(u.uTone, ...tone);
    for (const k in params) gl.uniform1f(u[k], params[k]);
    G.drawFull();
  });

  return {
    set(p) { Object.assign(params, p); dirty = true; },
    setTone(rgb) { tone = rgb; dirty = true; },
  };
}
