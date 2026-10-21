// Resuelve rutas de img/ a las versiones optimizadas de public/media/ y arma las listas
// de fotos por zona y de bocetos del fondo a partir de config.js + el manifiesto generado.
import manifest from '../generated/media.json';
import config from '../config.js';

const BASE = import.meta.env.BASE_URL + 'media/';
const byPath = new Map(Object.values(manifest.folders).flat().map(f => [f.path, f]));

const strip = p => p.replace(/\.[a-z0-9]+$/i, '');
export const src = (path, small = false) => (path ? BASE + strip(path) + (small ? '-s.webp' : '.webp') : '');
export const info = path => byPath.get(path) || null;
export const folder = name => manifest.folders[name] || [];

// bocetos del fondo con sus estilos
export const sketches = folder(config.bocetos.carpeta)
  .filter(f => !(config.bocetos.excluir || []).includes(f.file))
  .map(f => ({ ...f, styles: config.bocetos.estilos?.[f.file] || [] }));

// fotos de una zona (o bocetos de muestra si no hay)
export function zonePhotos(zone) {
  const list = zone.fotos ? zone.fotos.map(p => info(p) || { path: p }) : folder(zone.carpeta);
  if (list.length && !zone.muestra) return { items: list, demo: false };
  // sin fotos: bocetos de muestra, elegidos de forma estable según la zona
  const n = Math.min(6, sketches.length), off = zone.zona3d * 5;
  return { items: Array.from({ length: n }, (_, i) => sketches[(off + i * 3) % sketches.length]), demo: true };
}

export function loadImage(url) {
  return new Promise((res, rej) => {
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = url;
  });
}
