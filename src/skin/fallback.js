// Sin WebGL2: el boceto como imagen, con filtros CSS que imitan cada etapa (ver process.css).
import config from '../config.js';
import { src } from '../lib/media.js';

export function fallbackSkin(root) {
  const canvas = root.querySelector('canvas');
  const img = document.createElement('img');
  img.className = 'skin-fallback';
  img.src = src(config.proceso.boceto);
  img.alt = canvas.getAttribute('aria-label') || '';
  canvas.replaceWith(img);
  root.querySelector('.tones')?.remove();
}
