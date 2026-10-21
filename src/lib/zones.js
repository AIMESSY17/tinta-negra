// Zonas del cuerpo con sus fotos. Las usan la estatua del hero y el paso 1 del taller.
import config from '../config.js';
import { src, zonePhotos } from './media.js';
import { registerWorks, workId } from './lightbox.js';

export const ZONES = [null];
for (const z of config.zonas) ZONES[z.zona3d] = { ...z, ...zonePhotos(z) };
export const count = z => ZONES[z].items.length;
export const unit = z => (ZONES[z].demo ? 'bocetos' : 'trabajos');
// cada foto de zona tiene su link propio: #trabajo/brazos-03 (se abre en Inicio, junto al taller)
export const zoneWorks = Z => Z.items.map((it, i) => ({ src: src(it.path), alt: `Tatuaje en ${Z.nombre.toLowerCase()}, trabajo ${i + 1}`, id: workId(Z.id, i) }));
for (const Z of ZONES) if (Z) registerWorks(Z.id, () => zoneWorks(Z), 'inicio');
