/* El David de mármol (Three.js), como en el boceto: mármol limpio, pedestal con LatheGeometry,
   zonas por el atributo _zone (0 base, 1 cabeza, 2 brazos, 3 torso, 4 espalda, 5 piernas).
   Un solo renderer (un solo contexto WebGL) para todo el sitio: el canvas se muda del hero al taller y vuelve. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { NOISE } from '../fondo/mesa.js';
import { state, addTicker } from '../lib/state.js';

const MODEL = import.meta.env.BASE_URL + 'models/david.glb';

// giro automático: una vuelta cada 50 s; vuelve 3 s después de la última interacción y tarda 1,5 s en llegar
const VUELTA = 50, ESPERA = 3, RAMPA = 1.5;

export function crearEstatua(canvas, { reduced, IS_TOUCH, onTap, onHover, onGiro, onToque, puedeGirar, onResize }) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: true });
  renderer.setClearColor(0x000000, 0);
  const scene3 = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(26, 1, .1, 50); const rig = new THREE.Group(); scene3.add(rig);

  function resize3() {
    // tamaño de layout (sin transform): durante la carga la caja va escalada y el encuadre tiene que ser el del hero
    const c = canvas.parentElement, r = { width: c.clientWidth, height: c.clientHeight }; if (!r.width || !r.height) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, IS_TOUCH ? 1.25 : 1.5)); renderer.setSize(r.width, r.height, false); redibujar = true;
    camera.aspect = r.width / r.height; const tall = 2.5, fit = .94;
    let dist = (tall / fit) / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const wNeed = 1.3 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect); if (wNeed > dist) dist = wNeed;
    camera.position.set(0, .82, dist); camera.lookAt(0, .82, 0); camera.updateProjectionMatrix();
    onResize?.(canvas.parentElement);
  }
  // se redibuja solo cuando algo cambió (giro, zona, fundido, tamaño); si no, el canvas conserva el último cuadro
  let redibujar = true;
  const ro = new ResizeObserver(resize3);
  ro.observe(canvas.parentElement);

  const U = {
    uHover: { value: 0 }, uSel: { value: 0 }, uTime: { value: 0 }, uFade: { value: 0 }, uPulse: { value: 0 },
    uGlow: { value: new THREE.Color(.55, .36, 1) }, uStudio: { value: 0 },
    // materialización de la carga: 1 = entera (la rama del shader se saltea); violeta del frente de tinta
    uMat: { value: 1 }, uRigRot: { value: 0 }, uTintaFresca: { value: new THREE.Color(.42, .22, .78) },
  };
  const marble = new THREE.ShaderMaterial({
    uniforms: U, transparent: true,
    vertexShader: `
attribute float _zone; varying vec3 vN; varying vec3 vP; varying vec3 vV; varying float vZ; varying vec3 vO;
uniform float uRigRot;
void main(){ vN=normalize(normalMatrix*normal); vP=position; vZ=_zone;
  // posición en el espacio de la estatua (sin el giro): el ruido de la materialización no se desliza al girar
  vec4 w=modelMatrix*vec4(position,1.); float c=cos(uRigRot),s=sin(uRigRot); vO=vec3(c*w.x-s*w.z,w.y,s*w.x+c*w.z);
  vec4 mv=modelViewMatrix*vec4(position,1.); vV=mv.xyz; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `
uniform float uHover,uSel,uTime,uFade,uPulse,uStudio,uMat; uniform vec3 uGlow,uTintaFresca;
varying vec3 vN; varying vec3 vP; varying vec3 vV; varying float vZ; varying vec3 vO;
${NOISE}
float h3(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float n3(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
  return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}
void main(){
  // materialización: un frente de tinta con ruido (fbm 3D) sube de los pies a la cabeza; arriba del frente no hay nada
  float frente=0.;
  if(uMat<1.){
    float nz=n3(vO*4.)*.55+n3(vO*9.+3.7)*.3+n3(vO*21.)*.15;
    float d=vO.y+(nz-.5)*.42-mix(-.62,2.32,uMat);
    if(d>0.)discard;
    frente=smoothstep(-.09,0.,d);
  }
  vec3 n=normalize(vN); vec3 v=normalize(-vV);
  vec3 L1=normalize(vec3(-.55,.7,.6)), L2=normalize(vec3(.8,.15,.35)), L3=normalize(vec3(.2,.4,-.9));
  float d1=pow(clamp(dot(n,L1)*.5+.5,0.,1.),1.7);
  float d2=max(dot(n,L2),0.);
  float d3=max(dot(n,L3),0.);
  float rim=pow(1.-max(dot(n,v),0.),3.);
  // mármol de Carrara: blanco cálido con vetas grises muy suaves
  vec3 base=vec3(.94,.92,.885);
  float vq=fbm(vec2(vP.x*2.2+vP.z*1.7,vP.y*1.1+vP.z*.8)*3.);
  float vein=smoothstep(.035,0.,abs(vq-.52))*.10+smoothstep(.12,0.,abs(vq-.38))*.03;
  base*=1.-vein;
  vec3 col=base*(.24+ .82*d1*vec3(1.,.97,.92) + .22*d2*vec3(.78,.84,.95) + .18*d3*vec3(.9,.9,1.));
  vec3 h=normalize(L1+v); col+=pow(max(dot(n,h),0.),36.)*.16;
  col+=rim*.06*vec3(1.,.98,.95);
  col+=(1.-d1)*.035*vec3(1.,.85,.75); // subsuperficie tibia en sombras
  // pedestal: sombra de contacto bajo los pies
  if(vZ<.5&&vP.y>-.02){ col*=1.-smoothstep(.34,.05,length(vP.xz))*.28; }
  // zona iluminada
  float z=floor(vZ+.5);
  float isH=step(.5,uHover)*(1.-step(.5,abs(z-uHover)));
  float isS=step(.5,uSel)*(1.-step(.5,abs(z-uSel)));
  float g=max(isH*(.75+.25*uPulse),isS*.85);
  col=mix(col,col*1.04+uGlow*.10,g*.8);
  col+=uGlow*(rim*1.1+.04)*g;
  // el borde que recién se materializa brilla como tinta fresca
  col=mix(col,uTintaFresca*1.25+.08,frente*.9);
  gl_FragColor=vec4(col,uFade);
}`,
  });

  // pedestal con molduras, perfil de basa clásica
  const prof = [[0, -.38], [.52, -.38], [.52, -.33], [.5, -.32], [.5, -.3], [.53, -.28], [.5, -.25], [.45, -.245], [.43, -.23], [.43, -.06], [.46, -.05], [.47, -.03], [.45, -.015], [.45, 0], [0, 0]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  const pedGeo = new THREE.LatheGeometry(prof, 96);
  pedGeo.setAttribute('_zone', new THREE.Float32BufferAttribute(new Float32Array(pedGeo.attributes.position.count), 1));
  const pedestal = new THREE.Mesh(pedGeo, marble);
  rig.add(pedestal);

  let time = 0, body = null, ready = false, readyAt = 0, hoverZone = 0, selZone = 0, activa = false;
  new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(MODEL).then(g => {
    g.scene.scale.setScalar(2);
    g.scene.traverse(o => { if (o.isMesh) { o.material = marble; body = o; } });
    rig.add(g.scene); ready = true; readyAt = matDur ? -99 : time;
    canvas.parentElement?.classList.add('lista');
    canvas.dispatchEvent(new CustomEvent('estatua-lista'));
  });

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  // ¿el punto cae sobre el David o el pedestal? Devuelve la zona (0 si es la base) y si tocó el cuerpo
  function golpe(x, y) {
    if (!body) return { z: 0, cuerpo: false };
    const r = canvas.getBoundingClientRect(); ndc.set((x - r.left) / r.width * 2 - 1, -((y - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
    const h = ray.intersectObjects([body, pedestal], false)[0];
    if (!h) return { z: 0, cuerpo: false };
    return { z: h.object === body ? Math.round(body.geometry.attributes._zone.getX(h.face.a)) : 0, cuerpo: true };
  }
  // con 12 px de tolerancia alrededor de la silueta (gana la estatua), para que elegir zona siga siendo fácil
  function golpeTol(x, y) {
    let g = golpe(x, y); if (g.cuerpo) return g;
    for (const [dx, dy] of [[12, 0], [-12, 0], [0, 12], [0, -12]]) { const k = golpe(x + dx, y + dy); if (k.cuerpo) return k; }
    return g;
  }
  const zonaEn = (x, y) => golpe(x, y).z;
  let rotY = 0, rotV = 0, rotTarget = null; const nearest = a => a + Math.round((rotY - a) / (2 * Math.PI)) * 2 * Math.PI;
  // el recuadro de la estatua solo bloquea donde está el cuerpo: el resto del evento es de la mesa (e.__estatua lo marca)
  let sd = null;
  canvas.addEventListener('pointerdown', e => {
    const g = golpeTol(e.clientX, e.clientY);
    if (!g.cuerpo) { sd = null; return; }
    e.__estatua = true; onToque?.(); quieta();
    sd = { x: e.clientX, y: e.clientY, lx: e.clientX, rot: false, id: e.pointerId, z: g.z }; state.lastInput = state.time; rotTarget = null;
  });
  // hover con mouse: el raycast va una sola vez por frame (en el ticker) con la última posición;
  // el evento usa el resultado del frame anterior para saber si está sobre el cuerpo
  let pendiente = null, sobreCuerpo = false;
  canvas.addEventListener('pointermove', e => {
    if (!sd) {
      if (!IS_TOUCH && e.pointerType === 'mouse') {
        pendiente = { x: e.clientX, y: e.clientY };
        if (sobreCuerpo) e.__estatua = true;
      }
      return;
    }
    e.__estatua = true;
    const dx = e.clientX - sd.x, dy = e.clientY - sd.y;
    // la dirección se decide en los primeros 9 px: horizontal gira (mouse o dedo), vertical es scroll normal
    if (!sd.dir && Math.hypot(dx, dy) >= 9) {
      sd.dir = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
      if (sd.dir === 'h') { sd.rot = true; try { canvas.setPointerCapture(sd.id); } catch (_) { /* nada */ } onGiro?.(); }
    }
    if (sd.rot) { const d = e.clientX - sd.lx; rotY += d * .01; rotV = d * .01; }
    sd.lx = e.clientX;
  });
  canvas.addEventListener('pointerup', e => {
    if (!sd) return; e.__estatua = true; const s = sd; sd = null;
    // un toque corto sin desplazarse elige la zona; un giro nunca abre la hoja
    if (!s.rot && !s.dir && Math.hypot(e.clientX - s.x, e.clientY - s.y) < 10 && s.z) onTap?.(s.z, e.clientX, e.clientY);
  });
  canvas.addEventListener('pointercancel', () => { sd = null; });
  canvas.addEventListener('pointerleave', () => { if (!IS_TOUCH) { pendiente = null; sobreCuerpo = false; hoverZone = 0; canvas.style.cursor = ''; onHover?.(0); } });

  // el giro automático se corta en el acto con cualquier interacción y vuelve de a poco
  let ultimaInter = -10, rampa = 0;
  const quieta = () => { ultimaInter = time; rampa = 0; };
  const suave = t => t * t * (3 - 2 * t);
  // al volver a la pestaña arranca de nuevo desde cero (sin salto de ángulo)
  document.addEventListener('visibilitychange', () => { rampa = 0; });

  let antes = '', enIntro = false, giroFijo = null, matT0 = 0, matDur = 0;
  addTicker(dt => {
    time += dt;
    if (pendiente) {
      const p = pendiente; pendiente = null;
      const g = golpe(p.x, p.y); hoverZone = g.z; sobreCuerpo = g.cuerpo;
      const cur = g.z ? 'pointer' : g.cuerpo ? 'grab' : '';
      if (canvas.style.cursor !== cur) canvas.style.cursor = cur;
      onHover?.(g.z, p.x, p.y);
    }
    if (!activa || !ready) return;
    // giro con duración fija (la carga: del perfil al frente mientras viaja al hero)
    if (giroFijo) {
      const k = Math.min(1, (time - giroFijo.t0) / giroFijo.dur), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      rotY = giroFijo.de + (giroFijo.a - giroFijo.de) * e; rotV = 0;
      if (k >= 1) giroFijo = null;
    } else if (rotTarget !== null) { rotY += (rotTarget - rotY) * Math.min(1, dt * 3.5); if (Math.abs(rotTarget - rotY) < .002) rotTarget = null; }
    else if (!sd || !sd.rot) { rotY += rotV; rotV *= Math.pow(.93, dt * 60); }
    // mientras se toca, se arrastra, el mouse está sobre el cuerpo, sigue la inercia o hay una zona elegida: quieta
    if (enIntro || giroFijo || sd || sobreCuerpo || rotTarget !== null || Math.abs(rotV) > .0004 || selZone || hoverZone || document.hidden) quieta();
    else if (!reduced && puedeGirar?.() !== false && time - ultimaInter > ESPERA && !(import.meta.env.DEV && window.__estatua?.sinGiro)) {
      rampa = Math.min(1, rampa + dt / RAMPA);
      rotY += suave(rampa) * dt * 2 * Math.PI / VUELTA;
    } else rampa = 0;
    rig.rotation.y = rotY; U.uRigRot.value = rotY;
    if (matDur) { const k = Math.min(1, (time - matT0) / matDur); U.uMat.value = k; if (k >= 1) matDur = 0; }
    const t = reduced ? 1 : Math.min(1, (time - readyAt) / 1.4), ee = 1 - Math.pow(1 - t, 3); U.uFade.value = ee; rig.position.y = (1 - ee) * -.1;
    U.uTime.value = time; U.uHover.value = hoverZone; U.uSel.value = selZone; U.uPulse.value = .5 + .5 * Math.sin(time * 3);
    // el pulso solo se ve con una zona iluminada
    const firma = `${rotY.toFixed(5)}|${hoverZone}|${selZone}|${ee.toFixed(4)}|${hoverZone ? U.uPulse.value.toFixed(3) : 0}|${U.uMat.value.toFixed(4)}`;
    if (!redibujar && firma === antes) return;
    antes = firma; redibujar = false;
    renderer.render(scene3, camera);
  }, 1);

  // solo en desarrollo: para las pruebas automáticas
  if (import.meta.env.DEV) window.__estatua = { get rotY() { return rotY; }, get rampa() { return rampa; }, sinGiro: false };

  return {
    canvas,
    zonaEn,
    // la estatua solo se dibuja cuando está a la vista
    activar(v) { if (v && !activa) { redibujar = true; rampa = 0; } activa = v; },
    // corta el giro automático (hoja abierta, cambio de pestaña…); vuelve solo después de la espera
    quieta,
    /* pantalla de carga: la estatua queda de perfil, sin giro automático, y se materializa con tinta */
    set intro(v) { enIntro = v; if (!v) quieta(); },
    perfil() { rotY = -Math.PI / 2; rotV = 0; rotTarget = null; giroFijo = null; redibujar = true; },
    // materializa desde los pies en dur segundos (sin el fundido de opacidad)
    materializar(dur = .8, violeta) {
      if (violeta) U.uTintaFresca.value.setRGB(...violeta);
      U.uMat.value = 0; matT0 = time; matDur = dur; readyAt = -99; redibujar = true;
    },
    get materia() { return U.uMat.value; },
    // entera ya (saltar la carga)
    entera() { matDur = 0; U.uMat.value = 1; redibujar = true; },
    girarA(a, dur) { giroFijo = { de: rotY, a, t0: time, dur }; rotTarget = null; },
    get rotY() { return rotY; },
    // punto de la estatua (sin girar) → píxeles dentro de su caja: para las proporciones de Vitruvio
    proyectar(x, y, z = 0) {
      const v = new THREE.Vector3(x, y, z).project(camera), c = canvas.parentElement;
      return { x: (v.x * .5 + .5) * c.clientWidth, y: (-v.y * .5 + .5) * c.clientHeight };
    },
    get lista() { return ready; },
    sel(z) { selZone = z || 0; },
    hover(z) { hoverZone = z || 0; },
    // gira hasta mostrar el frente (0) o la espalda (π) por el camino más corto
    mirar(z) { rotTarget = nearest(z === 4 ? Math.PI : 0); },
    // muda el canvas a otro contenedor (hero ↔ taller) sin crear un contexto nuevo
    mudar(destino) { if (canvas.parentElement === destino) return; ro.unobserve(canvas.parentElement); destino.prepend(canvas); ro.observe(destino); resize3(); if (ready) destino.classList.add('lista'); },
  };
}
