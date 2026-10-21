/* El David de mármol (Three.js). Clase reutilizable: el hero y el paso I del taller crean cada uno su instancia,
   pero comparten la geometría del modelo (se carga una sola vez), el material y el pedestal.
   Mármol de Carrara con shader propio, pedestal con molduras, sombra de contacto,
   giro por arrastre/scroll/auto, zonas por raycast sobre el atributo _ZONE. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { NOISE } from '../lib/gl.js';
import { state } from '../lib/state.js';

const MODEL = import.meta.env.BASE_URL + 'models/david.glb';
let geoPromise = null;
export function loadDavid() {
  if (!geoPromise) {
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    geoPromise = loader.loadAsync(MODEL).then(gltf => {
      let mesh = null;
      gltf.scene.traverse(o => { if (o.isMesh) mesh = o; });
      mesh.updateMatrixWorld(true);
      return { geometry: mesh.geometry, matrix: mesh.matrixWorld.clone() };
    });
  }
  return geoPromise;
}

const VERT = `
attribute float _zone; uniform mat4 uRigInv;
varying vec3 vN; varying vec3 vP; varying vec3 vV; varying float vZ;
void main(){ vN=normalize(normalMatrix*normal); vZ=_zone;
  vP=(uRigInv*modelMatrix*vec4(position,1.)).xyz;
  vec4 mv=modelViewMatrix*vec4(position,1.); vV=mv.xyz; gl_Position=projectionMatrix*mv; }`;

const FRAG = `
uniform float uHover,uSel,uFade,uPulse; uniform vec3 uGlow;
varying vec3 vN; varying vec3 vP; varying vec3 vV; varying float vZ;
${NOISE}
void main(){
  vec3 n=normalize(vN); vec3 v=normalize(-vV);
  vec3 L1=normalize(vec3(-.55,.7,.6)), L2=normalize(vec3(.8,.15,.35)), L3=normalize(vec3(.2,.4,-.9));
  float d1=pow(clamp(dot(n,L1)*.5+.5,0.,1.),1.7);  // luz cálida lateral
  float d2=max(dot(n,L2),0.);                       // relleno frío
  float d3=max(dot(n,L3),0.);                       // contraluz suave
  float rim=pow(1.-max(dot(n,v),0.),3.);
  // mármol de Carrara: blanco cálido con vetas grises muy suaves
  vec3 base=vec3(.94,.92,.885);
  float vq=fbm(vec2(vP.x*2.2+vP.z*1.7,vP.y*1.1+vP.z*.8)*1.8);
  float vein=smoothstep(.03,0.,abs(vq-.52))*.06+smoothstep(.12,0.,abs(vq-.38))*.02;
  base*=1.-vein;
  vec3 col=base*(.24+.82*d1*vec3(1.,.97,.92)+.22*d2*vec3(.78,.84,.95)+.18*d3*vec3(.9,.9,1.));
  vec3 h=normalize(L1+v); col+=pow(max(dot(n,h),0.),36.)*.16;  // especular bajo
  col+=rim*.06*vec3(1.,.98,.95);
  col+=(1.-d1)*.035*vec3(1.,.85,.75);                          // subsuperficie tibia en sombras
  if(vZ<.5) col*=1.-.2*smoothstep(.09,0.,abs(vP.y));           // oclusión donde la base apoya en el pedestal
  // zona iluminada con luz hueso: contraluz + velo suave con pulso
  float z=floor(vZ+.5);
  float isH=step(.5,uHover)*(1.-step(.5,abs(z-uHover)));
  float isS=step(.5,uSel)*(1.-step(.5,abs(z-uSel)));
  float g=max(isH*(.75+.25*uPulse),isS*.85);
  col=mix(col,col*1.04+uGlow*.10,g*.8);
  col+=uGlow*(rim*1.1+.04)*g;
  gl_FragColor=vec4(col*uFade,uFade);
}`;

// perfil de basa clásica (toro, escocia, filetes)
const PROFILE = [[0, -.38], [.52, -.38], [.52, -.33], [.5, -.32], [.5, -.3], [.53, -.28], [.5, -.25], [.45, -.245], [.43, -.23], [.43, -.06], [.46, -.05], [.47, -.03], [.45, -.015], [.45, 0], [0, 0]];

let shared = null;
function parts() {
  if (shared) return shared;
  const U = {
    uHover: { value: 0 }, uSel: { value: 0 }, uFade: { value: 0 }, uPulse: { value: 0 },
    // luz hueso cálida en la zona (el violeta queda solo para la tinta)
    uGlow: { value: new THREE.Color(.95, .88, .72) }, uRigInv: { value: new THREE.Matrix4() },
  };
  const mat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT, fragmentShader: FRAG, transparent: true, premultipliedAlpha: true });
  const ped = new THREE.LatheGeometry(PROFILE.map(([x, y]) => new THREE.Vector2(x, y)), 96);
  ped.setAttribute('_zone', new THREE.Float32BufferAttribute(new Float32Array(ped.attributes.position.count), 1));
  const shadowU = { uFade: { value: 0 } };
  const shMat = new THREE.ShaderMaterial({
    uniforms: shadowU, transparent: true, depthWrite: false,
    vertexShader: 'varying vec2 vU;void main(){vU=uv-.5;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'uniform float uFade;varying vec2 vU;void main(){float d=length(vU*vec2(1.,1.));float a=smoothstep(.5,.16,d)*.32+smoothstep(.24,.18,d)*.18;gl_FragColor=vec4(0.,0.,0.,a*uFade);}',
  });
  shared = { U, mat, ped, shadowU, shMat, shGeo: new THREE.PlaneGeometry(2.6, 2.6) };
  return shared;
}

export class Statue {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.o = { fit: .84, fitMobile: .6, shiftMobile: .08, maxDpr: 2, autoSpin: true, ...opts };
    this.rotY = 0; this.rotV = 0; this.rotTarget = null; this.touched = false;
    this.hover = 0; this.sel = 0; this.shift = 0; this.fade = 0; this.ready = false; this.readyAt = 0; this.time = 0;
    this.body = null;

    const r = this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
    r.setClearColor(0x000000, 0);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(28, 1, .1, 50);
    this.rig = new THREE.Group();
    this.scene.add(this.rig);

    // material, pedestal y sombra compartidos: cada instancia escribe sus uniforms justo antes de dibujar
    const P = parts();
    this.U = P.U;
    this.mat = P.mat;
    this.shadowU = P.shadowU;
    this.fadeV = 0;
    this.rig.add(new THREE.Mesh(P.ped, this.mat));

    // sombra de contacto sobre el papel
    const sh = new THREE.Mesh(P.shGeo, P.shMat);
    sh.rotation.x = -Math.PI / 2;
    sh.position.y = -.381;
    this.rig.add(sh);

    this.ray = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();
    this.v3 = new THREE.Vector3();

    loadDavid().then(({ geometry, matrix }) => {
      const m = new THREE.Mesh(geometry, this.mat);
      m.matrixAutoUpdate = false;
      // el modelo mide 1 unidad con su base: escala x2
      m.matrix.copy(new THREE.Matrix4().makeScale(2, 2, 2).multiply(matrix));
      this.rig.add(m);
      this.body = m;
      this.ready = true;
      this.readyAt = this.time;
      this.o.onReady?.();
    });

    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    if (this.o.interactive !== false) this.bindInput();
  }

  setPixelRatio() { this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, state.lite ? 1 : this.o.maxDpr)); }

  resize() {
    const w = this.canvas.clientWidth || 1, h = this.canvas.clientHeight || 1;
    this.w = w; this.h = h;
    this.setPixelRatio();
    this.renderer.setSize(w, h, false);
    const cam = this.camera, mobile = innerWidth < 760;
    cam.aspect = w / h;
    const fit = mobile ? this.o.fitMobile : this.o.fit, tall = 2.42;
    // si la vista es angosta, que la estatua entre también a lo ancho
    const fitW = Math.min(1, (w / h) / .52);
    cam.position.set(0, .82, (tall / (fit * fitW)) / 2 / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)));
    cam.lookAt(0, .82, 0);
    if (mobile && this.o.shiftMobile) cam.setViewOffset(w, h, 0, h * this.o.shiftMobile, w, h); else cam.clearViewOffset();
    cam.updateProjectionMatrix();
  }

  /* ---- input: arrastre gira, cursor ilumina, toque selecciona ---- */
  bindInput() {
    const c = this.canvas;
    let drag = null, pending = null;
    c.addEventListener('pointerdown', e => {
      const z = this.zoneAt(e.clientX, e.clientY);
      // fuera del cuerpo: el fondo se encarga (arrastre o gota), salvo que se gire arrastrando en cualquier lado
      if (!z && !this.o.dragAnywhere) return;
      e.__statue = true;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0, zone: z };
      try { c.setPointerCapture(e.pointerId); } catch {}
      state.dragging = true; // la mesa no gira ni deja rastro mientras se gira la estatua
      this.rotTarget = null;
      state.lastInput = state.time;
      this.o.onDragState?.(true);
    });
    c.addEventListener('pointermove', e => {
      if (drag && drag.id === e.pointerId) {
        const dx = e.clientX - drag.x;
        drag.moved += Math.abs(dx) + Math.abs(e.clientY - drag.y);
        drag.x = e.clientX; drag.y = e.clientY;
        this.rotY += dx * .009; this.rotV = dx * .009;
        if (Math.abs(this.rotY) > .9) this.touched = true;
        state.lastInput = state.time;
      } else if (e.pointerType === 'mouse') {
        this.pending = { x: e.clientX, y: e.clientY };
      }
    });
    const up = e => {
      if (!drag || drag.id !== e.pointerId) return;
      const d = drag; drag = null;
      state.dragging = false;
      this.o.onDragState?.(false);
      if (d.moved < 8 && e.type === 'pointerup') {
        if (d.zone) this.o.onSelect?.(d.zone, e.clientX, e.clientY);
        else this.o.onTapEmpty?.(e.clientX, e.clientY);
      }
    };
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);
    c.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { this.pending = null; this.setHover(0); } });
    this.dragging = () => !!drag;
  }

  setHover(z, x, y) {
    if (z !== this.hover) this.o.onHover?.(z, x, y);
    else if (z) this.o.onHoverMove?.(z, x, y);
    this.hover = z;
  }

  zoneAt(x, y) {
    if (!this.body) return 0;
    const r = this.canvas.getBoundingClientRect();
    this.ndc.set((x - r.left) / r.width * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.camera);
    const hit = this.ray.intersectObject(this.body, false)[0];
    if (!hit) return 0;
    return Math.round(this.body.geometry.attributes._zone.getX(hit.face.a));
  }

  // gira hasta mostrar el frente (0) o la espalda (π) por el camino más corto
  face(angle) {
    const k = Math.round((this.rotY - angle) / (2 * Math.PI));
    this.rotTarget = angle + k * 2 * Math.PI;
    this.touched = true;
  }

  spin(v) { this.rotV += v; this.rotTarget = null; this.touched = true; }

  // punto del espacio de la estatua → coordenadas de pantalla (cliente)
  screenOf(x, y, z, local = false) {
    const v = this.v3.set(x, y, z);
    if (local) this.rig.localToWorld(v); else v.x += this.rig.position.x;
    v.project(this.camera);
    const r = this.canvas.getBoundingClientRect();
    return { x: r.left + (v.x * .5 + .5) * r.width, y: r.top + (-v.y * .5 + .5) * r.height };
  }

  frame(dt) {
    this.time += dt;
    const reduced = state.reduced;
    if (this.rotTarget !== null) {
      this.rotY += (this.rotTarget - this.rotY) * Math.min(1, dt * (reduced ? 30 : 3.5));
      this.rotV = 0;
      if (Math.abs(this.rotTarget - this.rotY) < .002) this.rotTarget = null;
    } else if (!this.dragging?.()) {
      this.rotY += this.rotV;
      this.rotV *= Math.pow(.94, dt * 60);
      if (this.o.autoSpin && !reduced && state.time - state.lastInput > 4 && !this.sel && !this.hover) this.rotY += dt * .2;
    }
    this.rig.rotation.y = this.rotY;
    this.rig.position.x += (this.shift - this.rig.position.x) * Math.min(1, dt * 3);
    if (this.pending) { const p = this.pending; this.pending = null; this.setHover(this.zoneAt(p.x, p.y), p.x, p.y); }
    if (this.ready) {
      const t = reduced ? 1 : Math.min(1, (this.time - this.readyAt) / (this.o.fadeDur || 1.6));
      const e = 1 - Math.pow(1 - t, 3);
      this.fadeV = e;
      this.rig.position.y = (1 - e) * -.12;
    }
    this.U.uFade.value = this.fadeV;
    this.shadowU.uFade.value = this.fadeV;
    this.U.uHover.value = this.hover;
    this.U.uSel.value = this.sel;
    this.U.uPulse.value = .5 + .5 * Math.sin(this.time * 3.2);
    this.rig.updateMatrixWorld();
    this.U.uRigInv.value.copy(this.rig.matrixWorld).invert();
    this.renderer.render(this.scene, this.camera);
  }
}
