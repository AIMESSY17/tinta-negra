// Paleta y tipografías del sitio (src/styles/base.css).
import { loadFont as cargarPirata } from '@remotion/google-fonts/PirataOne';
import { loadFont as cargarGaramond } from '@remotion/google-fonts/EBGaramond';
import { loadFont as cargarMono } from '@remotion/google-fonts/DMMono';

export const PIRATA = cargarPirata('normal', { weights: ['400'], subsets: ['latin'] }).fontFamily;
export const GARAMOND = cargarGaramond('italic', { weights: ['400'], subsets: ['latin'] }).fontFamily;
cargarGaramond('normal', { weights: ['400'], subsets: ['latin'] });
export const MONO = cargarMono('normal', { weights: ['400'], subsets: ['latin'] }).fontFamily;

export const C = {
  papel: '#e3e1dc',
  hoja: '#efece4',
  tinta: '#141317',
  tintaSuave: '#4a4752',
  violeta: '#6b38c7',
  cinta: 'rgba(214, 208, 192, .86)',
};

// Instagram tapa ~200 px arriba y ~250 px abajo: todo el texto vive en el tercio central.
export const ANCHO = 1080, ALTO = 1920, FPS = 30;
export const TERCIO = { arriba: 640, abajo: 1280 };
