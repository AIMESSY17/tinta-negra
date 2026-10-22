# Tinta Negra · web demo para tatuadores

Sitio de tres páginas para un estudio de tatuajes, con el diseño "crudo" aprobado (`referencia/boceto-crudo.html`):
la mesa de bocetos es la página entera, el texto se apoya en claros que abre la mesa y los títulos son lettering
gótico gigante con su calco violeta corrido. Vite + JS vanilla, Three.js (estatua) y WebGL2 crudo (fondo).

```bash
npm install
npm run dev      # servidor de desarrollo (optimiza las imágenes antes de arrancar)
npm run build    # genera dist/ listo para Netlify o Vercel
```

En Netlify o Vercel: comando de build `npm run build`, carpeta de publicación `dist`.
`/artista` e `/info` son el mismo `index.html`: `public/_redirects` (Netlify) y `vercel.json` (Vercel) ya lo resuelven.

## Páginas

| URL | Contenido |
| --- | --- |
| `/` Inicio | Hero (Tinta / Negra + David) → Trabajos → ventana de mesa → Armá tu tatuaje → Contacto |
| `/artista` | El artista (retrato + bio) → Portafolio con filtros por zona y estilo → Armá tu tatuaje |
| `/info` | Preguntas → Proceso → Cuidados → Armá tu tatuaje → Contacto |

Se cambia de página sin recargar (History API): el fondo y la estatua nunca se recargan.

- **Estatua**: tocar una zona abre la hoja con los trabajos de esa zona (bottom sheet en celular, panel lateral en
  escritorio). "Quiero uno en …" abre el taller con la zona elegida. En celular no se gira arrastrando:
  la espalda se elige con el botón "Espalda".
- **Taller**: 5 pasos (zona, tamaño, estilo, idea, cuándo) y resumen con "Enviar por WhatsApp". El paso 1 usa el
  mismo David del hero (el canvas se muda; nunca hay más de 2 contextos WebGL: fondo + estatua).
- **Modo noche**: botón luna/sol; se guarda en `localStorage` (`tn-noche`) y se aplica antes del primer pintado.

## Gestos de la mesa

Scroll anima la mesa · toque corto = gota de tinta · mantener 420 ms y deslizar = pinta (sin scroll mientras pinta) ·
giroscopio = punto de luz violeta (en iOS, botón "Activar movimiento") · después de unos segundos quieto, un pincel
fantasma recorre la mesa · con mouse, el cursor pinta en toda la pantalla (también debajo de los textos).
En escritorio la mesa se arrastra con el mouse (empieza después de 5 px; un clic sigue siendo un clic) y sigue con inercia.
En celular la mesa nunca se mueve con el dedo.

La estatua solo bloquea donde está el cuerpo (raycast con 12 px de tolerancia); alrededor es mesa.
Deslizar horizontal sobre el David lo gira (también en celular); vertical hace scroll; un toque corto abre la zona.

**Zonas de lectura**: detrás de cada texto (títulos, párrafos, botones, chips) la mesa se aclara y el pincel deja
solo un violeta suave (`VIOLETA_LECTURA` en `src/fondo/mesa.js`). La lista de qué se considera texto está en
`LECTURA`, en `src/fondo/fondo.js`. El texto del sitio no se puede seleccionar (salvo los campos del taller).

**Fotos con piel**: en `config.obras` cada trabajo tiene `tipo: 'foto' | 'boceto'` (si falta, se detecta por la
saturación). Las fotos llevan un duotono tinta y violeta (`src/ui/duotono.js`), armado con los colores del sitio.

**Transición de tinta**: al cambiar de página o saltar a una sección, una mancha se abre desde el punto del clic
(View Transitions, `src/lib/vt.js`). Sin soporte, un fundido; con movimiento reducido, un fundido corto.

## Clonar el sitio para otro tatuador

1. Copiá la carpeta del proyecto (sin `node_modules`, `dist` ni `public/media`).
2. Reemplazá las fotos en `img/` manteniendo las carpetas:
   - `img/fondo/` bocetos del lienzo del fondo.
   - `img/zonas/cabeza|brazo|torso|espalda|pierna/` fotos de trabajos por zona.
   - Tu foto en `img/artista/retrato.jpg` (o su ruta en `config.artista.retrato`). Por defecto es el dibujo del caballo y el jaguar.
3. Editá `src/config.js`: textos, artista, WhatsApp, Instagram, dirección, horarios, estilo de cada trabajo
   (`obras`), preguntas, proceso, cuidados y opciones del taller. Ningún texto del cliente está en el HTML.
4. `npm run build` y publicar.

Los colores están en un solo lugar: las variables de `:root` en el `<head>` de `index.html`.

## Modo liviano

Sin WebGL2, o en un teléfono que no llega a ~22 fps los primeros 2 s, el fondo pasa a un video loop o a la imagen
fija `public/mesa/mesa-fija.webp`. Para usar video, dejá `mesa.webm` / `mesa.mp4` en `public/mesa/` y completá
`config.mesaLiviana`. Para probarlo: `?liviano=1` (y `?liviano=0` para no medir).

## Modelo 3D

`public/models/david.glb` sale de `david-zonas.glb` con la entrepierna alisada
(`node scripts/david-pudor.mjs david-zonas.glb salida.glb`) y comprimido con meshopt
(`npx @gltf-transform/cli meshopt salida.glb public/models/david.glb`). Conserva el atributo `_ZONE`
(0 base, 1 cabeza, 2 brazos, 3 torso, 4 espalda, 5 piernas).
