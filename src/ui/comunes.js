/* Piezas que se repiten en las tres páginas: grilla de obras, CTA del taller, contacto y pie. */
import config from '../config.js';
import { esc, mega } from '../lib/state.js';
import { src } from '../lib/media.js';
import { claseTipo, attrTipo, capaDuo } from './duotono.js';

/* Trabajos en blanco y negro que pasan a stencil violeta al pasar o tocar.
   Las fotos llevan una segunda capa con el duotono, que aparece por opacidad */
export const htmlObra = (o, i) => `<button type="button" class="obra${claseTipo(o.tipo)}"${attrTipo(o.tipo)} data-i="${i}" aria-label="Tatuaje en ${esc(o.zonaNombre.toLowerCase())}">
  <img src="${src(o.path, true)}" alt="" width="${o.w}" height="${o.h}" loading="lazy" decoding="async">${o.tipo === 'foto' ? capaDuo(src(o.path, true)) : ''}<span class="pie-obra">${esc(o.zonaNombre)}</span></button>`;

export const chips = (lista, actual, attr, etiqueta) => `<div class="chips" role="group" aria-label="${esc(etiqueta)}">
  ${lista.map(([k, n]) => `<button type="button" class="chip" ${attr}="${esc(k)}" aria-pressed="${k === actual}">${esc(n)}</button>`).join('')}</div>`;

export const piezas = n => n + (n === 1 ? ' pieza' : ' piezas');

/* "Armá tu tatuaje": en Inicio abre el taller; en Artista e Info lleva a Inicio y lo abre */
export function htmlCta({ irAInicio = false } = {}) {
  const t = config.inicio.taller;
  return `<section class="panel cta"${irAInicio ? '' : ' id="reservar"'}>
    <div class="in isla">
      ${mega('h2', t.titulo)}
      <p>${esc(t.texto)}</p>
      <a class="btn solido" href="./#reservar" data-taller${irAInicio ? ' data-go="inicio"' : ''}>Empezar</a>
    </div>
  </section>`;
}

export function htmlContacto({ titulo = 'Contacto', id = 'contacto' } = {}) {
  const c = config.contacto;
  const wa = `https://wa.me/${c.whatsapp}`;
  const mapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([...c.direccion, c.mapa || ''].join(', '))}`;
  return `<section class="panel" data-mesa id="${id}" style="padding-top:0">
    <div class="in">
      <div class="cab isla">${mega('h2', titulo)}</div>
      <div class="contacto isla">
        <div><h3>Dirección</h3><p><a href="${mapa}" target="_blank" rel="noopener">${c.direccion.map(esc).join('<br>')}</a></p></div>
        <div><h3>Horarios</h3><p>${c.horarios.map(esc).join('<br>')}</p></div>
        <div><h3>WhatsApp</h3><p><a href="${wa}" target="_blank" rel="noopener">${esc(c.whatsappVisible)}</a> <button type="button" class="copiar" data-copiar="${esc(c.whatsappVisible)}">Copiar</button><br><a class="ig" href="https://instagram.com/${esc(c.instagram)}" target="_blank" rel="noopener">@${esc(c.instagram)}</a></p></div>
      </div>
      ${htmlPie()}
    </div>
  </section>`;
}

export const htmlPie = () => `<div class="pie isla"><span class="logo">${esc(config.estudio.nombre)}</span><span>${esc(config.estudio.pie)}</span></div>`;

/* Placeholder liviano de la estatua mientras cargan Three.js y el modelo */
export const PEDESTAL = `<svg viewBox="0 0 200 120" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
  <path d="M60 20 C 80 0, 120 0, 140 20"/><path d="M48 30 H152 M52 36 H148 M54 42 V96 M146 42 V96 M50 96 H150 M44 104 H156 M40 112 H160"/></svg>`;
