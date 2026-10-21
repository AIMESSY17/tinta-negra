import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C } from './estilo.js';

// Grano de papel animado, como el .grain del sitio (cambia cada 2 cuadros).
export const Grano = ({ opacidad = .09 }) => {
  const f = useCurrentFrame();
  const semilla = Math.floor(f / 2) % 6;
  return (
    <AbsoluteFill style={{ opacity: opacidad, mixBlendMode: 'multiply', pointerEvents: 'none' }}>
      <svg width="100%" height="100%">
        <filter id={`grano-${semilla}`}>
          <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed={semilla} stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .9 0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grano-${semilla})`} />
      </svg>
    </AbsoluteFill>
  );
};

export const Papel = ({ children }) => (
  <AbsoluteFill style={{ background: C.papel }}>
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse 70% 45% at 50% 48%, rgba(255,255,255,.38), transparent 70%), radial-gradient(ellipse at 50% 50%, transparent 58%, rgba(20,19,23,.2))' }} />
    {/* manchas de agua sutiles sobre la mesa */}
    <AbsoluteFill style={{ background: 'radial-gradient(circle at 18% 14%, rgba(107,56,199,.06), transparent 22%), radial-gradient(circle at 86% 88%, rgba(20,19,23,.07), transparent 20%)' }} />
    {children}
    <Grano />
  </AbsoluteFill>
);

// Tira de cinta de papel, como las del sitio.
export const Cinta = ({ style }) => (
  <div style={{ position: 'absolute', width: 150, height: 44, background: C.cinta, boxShadow: '0 2px 4px rgba(0,0,0,.08)', ...style }} />
);
