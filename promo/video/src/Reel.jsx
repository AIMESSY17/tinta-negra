import { AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, PIRATA, GARAMOND, MONO, TERCIO } from './estilo.js';
import { Papel, Cinta } from './Papel.jsx';
import { Transicion } from './Mancha.jsx';

// línea de tiempo (cuadros a 30 fps)
export const T_TITULO = 66;   // 2.2 s de título
export const T_MANCHA = 18;   // 0.6 s de transición
export const T_FINAL = 114;   // 3.8 s de bajada + cierre
export const CLIP_MAX = 8.8;  // segundos de grabación como máximo

export function tiempos({ duracion, desde = 0, hasta }) {
  const disponible = Math.max(0, duracion - desde);
  const clipS = Math.min(hasta ? hasta - desde : disponible, CLIP_MAX, disponible);
  const clip = Math.floor(clipS * 30) - T_MANCHA;
  return { clip, total: T_TITULO + clip + T_FINAL };
}

const tramo = (f, a, b, desde = 0, hasta = 1) => interpolate(f, [a, b], [desde, hasta], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

// cada palabra aparece primero como calco violeta y después la tinta negra la cubre
const PalabraTatuada = ({ texto, inicio }) => {
  const f = useCurrentFrame();
  const calco = tramo(f, inicio, inicio + 5, 0, .85) * tramo(f, inicio + 14, inicio + 24, 1, .0);
  const tinta = tramo(f, inicio + 4, inicio + 14);
  return (
    <span style={{ position: 'relative', display: 'inline-block', margin: '0 .12em' }}>
      <span style={{ position: 'absolute', left: 4, top: 3, color: C.violeta, opacity: calco, filter: 'blur(.6px)' }}>{texto}</span>
      <span style={{ position: 'relative', clipPath: `inset(-25% ${(1 - tinta) * 100}% -25% -5%)`, display: 'inline-block' }}>{texto}</span>
    </span>
  );
};

// trazo de lápiz violeta que se dibuja de izquierda a derecha
const Trazo = ({ inicio, ancho = 320 }) => {
  const f = useCurrentFrame();
  const p = tramo(f, inicio, inicio + 14);
  return (
    <svg width={ancho} height="26" viewBox={`0 0 ${ancho} 26`} style={{ overflow: 'visible' }}>
      <path d={`M4 16 Q ${ancho * .3} 6 ${ancho * .55} 14 T ${ancho - 4} 10`} fill="none" stroke={C.violeta} strokeWidth="4" strokeLinecap="round"
        strokeDasharray={ancho * 1.2} strokeDashoffset={ancho * 1.2 * (1 - p)} />
    </svg>
  );
};

const Titulo = ({ titulo, marca, numero }) => {
  const f = useCurrentFrame();
  const palabras = titulo.split(' ');
  const tam = titulo.length > 24 ? 168 : 196;
  return (
    <Papel>
      <Cinta style={{ left: 90, top: 330, transform: 'rotate(-24deg)', opacity: .9 }} />
      <Cinta style={{ right: 80, bottom: 380, transform: 'rotate(18deg)', width: 120, opacity: .9 }} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: 960, minHeight: TERCIO.abajo - TERCIO.arriba, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 40 }}>
          <div style={{ fontFamily: MONO, fontSize: 32, letterSpacing: '.26em', textTransform: 'uppercase', color: C.tintaSuave, opacity: tramo(f, 0, 10) }}>
            Fig. {numero} · {marca}
          </div>
          <div style={{ fontFamily: PIRATA, fontSize: tam, lineHeight: .95, color: C.tinta, textWrap: 'balance' }}>
            {palabras.map((p, i) => <PalabraTatuada key={i} texto={p} inicio={6 + i * 5} />)}
          </div>
          <Trazo inicio={10 + palabras.length * 5} ancho={380} />
        </div>
      </AbsoluteFill>
    </Papel>
  );
};

// etiqueta de papel con cinta que explica qué se ve en la grabación
const Nota = ({ texto }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - T_MANCHA, fps, config: { damping: 14, mass: .7 } });
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 300, display: 'flex', justifyContent: 'center' }}>
      <div style={{
        position: 'relative', background: C.hoja, color: C.tinta, fontFamily: GARAMOND, fontStyle: 'italic', fontSize: 56, lineHeight: 1.2,
        padding: '24px 42px 22px', maxWidth: 860, textAlign: 'center',
        boxShadow: '0 2px 0 rgba(0,0,0,.08), 0 22px 36px -18px rgba(0,0,0,.6)',
        transform: `translateY(${(1 - s) * 60 + tramo(f, T_MANCHA + 105, T_MANCHA + 120, 0, 40)}px) rotate(-2deg)`,
        // se lee y se va, para no tapar la demo
        opacity: s * tramo(f, T_MANCHA + 105, T_MANCHA + 120, 1, 0),
      }}>
        <Cinta style={{ left: -34, top: -16, width: 110, height: 36, transform: 'rotate(-28deg)' }} />
        {texto}
      </div>
    </div>
  );
};

const Grabacion = ({ escena, desde, nota }) => (
  <AbsoluteFill style={{ background: C.papel }}>
    <OffthreadVideo src={staticFile(`grabaciones/${escena}.mp4`)} trimBefore={Math.round(desde * 30)} muted style={{ width: '100%', height: '100%' }} />
    {nota ? <Nota texto={nota} /> : null}
  </AbsoluteFill>
);

const Final = ({ bajada, cierre, usuario }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sello = spring({ frame: f - 48, fps, config: { damping: 11, stiffness: 160, mass: .8 } });
  const palabras = bajada.split(' ');
  return (
    <Papel>
      <Cinta style={{ right: 110, top: 360, transform: 'rotate(22deg)', opacity: .9 }} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: 960, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 50 }}>
          <div style={{ fontFamily: GARAMOND, fontStyle: 'italic', fontSize: 128, lineHeight: 1.02, color: C.tinta, textWrap: 'balance' }}>
            {palabras.map((p, i) => {
              const a = tramo(f, T_MANCHA - 4 + i * 3, T_MANCHA + 8 + i * 3);
              return <span key={i} style={{ display: 'inline-block', marginRight: '.22em', opacity: a, filter: `blur(${(1 - a) * 8}px)`, transform: `translateY(${(1 - a) * 18}px)` }}>{p}</span>;
            })}
          </div>
          <Trazo inicio={T_MANCHA + 10} ancho={320} />
          <div style={{ fontFamily: PIRATA, fontSize: 104, lineHeight: .98, color: C.tinta, textWrap: 'balance', opacity: tramo(f, 34, 46), transform: `translateY(${tramo(f, 34, 46, 24, 0)}px)` }}>
            {cierre}
          </div>
          <div style={{
            fontFamily: MONO, fontSize: 60, color: C.violeta, letterSpacing: '.04em', padding: '18px 34px', border: `4px dashed ${C.violeta}`, borderRadius: 10,
            background: 'rgba(107,56,199,.06)', opacity: Math.min(1, sello * 1.4),
            transform: `rotate(-4deg) scale(${interpolate(sello, [0, 1], [1.7, 1])})`,
          }}>
            {usuario}
          </div>
        </div>
      </AbsoluteFill>
    </Papel>
  );
};

export const Reel = (props) => {
  const { titulo, escena, nota, bajada, cierre, usuario, marca, numero, desde = 0, audio, audioActivo } = props;
  const { clip } = tiempos(props);
  return (
    <AbsoluteFill style={{ background: C.papel }}>
      <Sequence durationInFrames={T_TITULO + T_MANCHA}>
        <Titulo titulo={titulo} marca={marca} numero={numero} />
      </Sequence>
      <Sequence from={T_TITULO} durationInFrames={clip + T_MANCHA}>
        <Transicion dur={T_MANCHA} semilla={`${escena}-1`} centro={[600, 900]}>
          <Grabacion escena={escena} desde={desde} nota={nota} />
        </Transicion>
      </Sequence>
      <Sequence from={T_TITULO + clip}>
        <Transicion dur={T_MANCHA} semilla={`${escena}-2`} centro={[480, 1010]}>
          <Final bajada={bajada} cierre={cierre} usuario={usuario} />
        </Transicion>
      </Sequence>
      {audioActivo && audio?.archivo ? <Audio src={staticFile(audio.archivo)} volume={audio.volumen ?? .5} /> : null}
    </AbsoluteFill>
  );
};
