// Resuelve rutas de img/ a las versiones optimizadas de public/media/ y arma las listas
// de trabajos por zona y de bocetos del fondo a partir de config.js + el manifiesto generado.
import manifest from '../generated/media.json';
import config from '../config.js';

export const BASE = import.meta.env.BASE_URL;
const MEDIA = BASE + 'media/';
const byPath = new Map(Object.values(manifest.folders).flat().map(f => [f.path, f]));

const strip = p => p.replace(/\.[a-z0-9]+$/i, '');
export const src = (path, small = false) => (path ? MEDIA + strip(path) + (small ? '-s.webp' : '.webp') : '');
export const info = path => byPath.get(path) || null;
export const folder = name => manifest.folders[name] || [];

// bocetos del lienzo del fondo
export const sketches = folder(config.bocetos.carpeta).filter(f => !(config.bocetos.excluir || []).includes(f.file));

// todos los trabajos, con su zona y sus estilos
export const obras = config.zonas.flatMap(z => folder(z.carpeta).map(f => ({
  path: f.path, w: f.w, h: f.h, zona: z.id, zonaNombre: z.nombre,
  estilos: config.obras?.[f.file]?.estilos || [], tipo: config.obras?.[f.file]?.tipo || null,
})));

export const zonaPorId = id => config.zonas.find(z => z.id === id);
export const zonaPor3d = n => config.zonas.find(z => z.zona3d === n);
export const obrasDe = id => obras.filter(o => o.zona === id);
