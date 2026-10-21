// Transición de mancha de tinta: una mancha negra se expande sobre la escena que sale
// y, desde adentro, otra mancha con borde violeta (el calco del stencil) revela la que entra.
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from 'remotion';
import { C, ANCHO, ALTO } from './estilo.js';

const R_MAX = 1550; // cubre la diagonal desde cualquier punto del tercio central

// contorno de salpicadura: radio con armónicos + lóbulos (chorreados) + gotas satélite
export function salpicadura(semilla, cx, cy, R) {
  if (R < .5) return '';
  const rnd = k => random(`${semilla}-${k}`);
  const arm = [[3, .07], [5, .05], [9, .035], [17, .02]].map(([k, a], i) => [k, a, rnd(`h${i}`) * Math.PI * 2]);
  const lobulos = Array.from({ length: 7 }, (_, i) => ({ ang: rnd(`l${i}`) * Math.PI * 2, amp: .12 + rnd(`a${i}`) * .32, w: .05 + rnd(`w${i}`) * .08 }));
  const n = 160;
  let d = '';
  for (let i = 0; i < n; i++) {
    const th = (i / n) * Math.PI * 2;
    let r = 1;
    for (const [k, a, ph] of arm) r += a * Math.sin(k * th + ph);
    for (const l of lobulos) {
      const dt = Math.atan2(Math.sin(th - l.ang), Math.cos(th - l.ang));
      r += l.amp * Math.exp(-((dt / l.w) ** 2));
    }
    d += `${i ? 'L' : 'M'}${(cx + Math.cos(th) * R * r).toFixed(1)} ${(cy + Math.sin(th) * R * r).toFixed(1)}`;
  }
  d += 'Z';
  for (let i = 0; i < 10; i++) {
    const ang = rnd(`s${i}`) * Math.PI * 2, dist = R * (1.18 + rnd(`d${i}`) * .55), rr = R * (.025 + rnd(`r${i}`) * .055);
    const x = cx + Math.cos(ang) * dist, y = cy + Math.sin(ang) * dist;
    d += `M${(x - rr).toFixed(1)} ${y.toFixed(1)}a${rr.toFixed(1)} ${rr.toFixed(1)} 0 1 0 ${(2 * rr).toFixed(1)} 0a${rr.toFixed(1)} ${rr.toFixed(1)} 0 1 0 ${(-2 * rr).toFixed(1)} 0`;
  }
  return d;
}

const curva = Easing.bezier(.55, 0, .25, 1);

// Envuelve la escena que entra. Durante `dur` cuadros la revela con la mancha; después la deja sola.
export const Transicion = ({ dur, semilla, centro = [ANCHO / 2, ALTO / 2], children }) => {
  const f = useCurrentFrame();
  const p = f / dur;
  if (p >= 1) return <AbsoluteFill>{children}</AbsoluteFill>;
  const [cx, cy] = centro;
  const rTinta = R_MAX * curva(interpolate(p, [0, .62], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const rRevela = R_MAX * curva(interpolate(p, [.3, 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const id = `mancha-${semilla}`;
  return (
    <AbsoluteFill>
      <svg width={ANCHO} height={ALTO} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <clipPath id={id}><path d={salpicadura(`${semilla}b`, cx, cy, rRevela)} /></clipPath>
        </defs>
        <path d={salpicadura(`${semilla}a`, cx + 40, cy - 30, rTinta)} fill={C.tinta} />
        <path d={salpicadura(`${semilla}b`, cx, cy, rRevela * 1.06 + 10)} fill={C.violeta} />
      </svg>
      <AbsoluteFill style={{ clipPath: `url(#${id})` }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};
