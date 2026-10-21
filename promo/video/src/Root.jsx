import { Composition } from 'remotion';
import textos from '../../textos.json';
import duraciones from '../public/grabaciones/duraciones.json';
import { Reel, tiempos } from './Reel.jsx';
import { ANCHO, ALTO, FPS } from './estilo.js';

// Un reel por entrada de promo/textos.json → "reels".
export const Root = () => (
  <>
    {textos.reels.map((r, i) => {
      const props = {
        ...r, numero: i + 1, marca: textos.marca, cierre: textos.cierre, usuario: textos.usuario,
        audio: textos.audio, audioActivo: !!textos.audio?.activo, duracion: duraciones[r.escena] ?? 8,
      };
      return (
        <Composition
          key={r.id} id={r.id} component={Reel} width={ANCHO} height={ALTO} fps={FPS}
          durationInFrames={tiempos(props).total} defaultProps={props}
          calculateMetadata={({ props: p }) => ({ durationInFrames: tiempos(p).total })}
        />
      );
    })}
  </>
);
