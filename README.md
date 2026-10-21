# Tinta Negra · web demo para tatuadores

Sitio de tres páginas para un estudio de tatuajes: un cuaderno de tatuador renacentista que cobra vida.
Vite + JS vanilla, Three.js (estatua), GSAP ScrollTrigger (scroll) y WebGL2 crudo (fondo, intro, piel).

```bash
npm install
npm run dev      # servidor de desarrollo (optimiza las imágenes antes de arrancar)
npm run build    # genera dist/ listo para Netlify o Vercel
```

En Netlify o Vercel: comando de build `npm run build`, carpeta de publicación `dist`.
`/artista` e `/info` son el mismo `index.html`: `public/_redirects` (Netlify) y `vercel.json` (Vercel) ya lo resuelven.
En otro hosting, configurá que esas dos rutas sirvan `index.html`.

## Páginas

| URL | Contenido |
| --- | --- |
| `/` Inicio | Hero (intro del Vitruvio, placa con el nombre tatuado, estatua con zonas) → Armá tu tatuaje → Contacto |
| `/artista` | Portada "Capítulo II" → retrato que se raspa y cuaderno, lado a lado → Portafolio (carpeta de láminas) → botón al taller → pie compacto |
| `/info` | Portada "Capítulo III" → Fichero de preguntas → El proceso y Cuidados, lado a lado → botón al taller → pie compacto |

Se cambia de página sin recargar (History API): la mesa del fondo y la estatua quedan vivas y una mancha de tinta
(View Transitions) se abre desde el punto del clic. Sin View Transitions, la pincelada barre la mesa. Atrás y Adelante
funcionan, y cada página arranca arriba de todo. Los links viejos de una sola página (`/#preguntas`, `/#pedido`…)
llevan a su página nueva.

Tocar una zona de la estatua del hero (o su botón) abre la **galería de esa zona** (`src/sections/gallery.js`):
en escritorio, una lámina lateral que entra desde la izquierda mientras la estatua se corre a la derecha; en celular,
una hoja inferior al 85 % con manija (se cierra deslizando hacia abajo) y los trabajos en carrusel con puntos.
Cada trabajo abre el visor con su link `#trabajo/…`. Se cierra con la X, con Escape o tocando fuera, y la zona queda
iluminada mientras está abierta. Al pie, "Quiero uno en …" es el único camino de la estatua al taller: llega con
esa zona elegida en el paso I.

## Celular (760 px o menos): el sitio como app

- **Barra de abajo** (`initTabbar` en `chrome.js`): I Inicio · II Artista · III Info · Reservar (el lacre chico).
  Arriba queda solo el nombre y la lámpara; el lacre flotante y el menú de pantalla completa no se usan.
- **Hero** a pantalla completa: la estatua se gira deslizando en cualquier parte y las zonas van en una fila deslizable.
- **Taller**: en Inicio queda una lámina-invitación; "Armá tu tatuaje" (y Reservar, desde cualquier página) abre un
  flujo a pantalla completa con una pregunta por pantalla, Anterior/Siguiente abajo, deslizar para cambiar de paso,
  el acta en una hoja inferior ("ver acta") y una pantalla final de resumen con "Enviar por WhatsApp". Los nodos del
  taller se mudan entre la lámina y el flujo, así que lo elegido se conserva al salir o al girar la pantalla.
- **Proceso**: las etapas se pasan deslizando el visual. **Cuidados**: deslizador horizontal grabado (día 1 a 30) en
  lugar del dial. **Cuaderno**: una página por pantalla, sin giro 3D. **Carpeta**: grilla de 2 columnas.
- Nada captura el scroll vertical: los gestos de los componentes son solo horizontales (`touch-action: pan-y`).
- **Mesa**: no se arrastra con el dedo; deriva sola, se mueve con el giroscopio (en iOS, con el botón discreto de la
  banda que pide permiso) y tocar un espacio libre deja la gota. Una sola capa de bocetos y menos resolución.

## Clonar el sitio para otro tatuador

1. **Copiá la carpeta del proyecto** (sin `node_modules`, `dist` ni `public/media`).
2. **Reemplazá las fotos en `img/`** manteniendo las carpetas:
   - `img/fondo/` bocetos del lienzo del fondo (los que tienen detalles violeta lucen más).
   - `img/zonas/cabeza|brazo|torso|espalda|pierna/` fotos de trabajos por zona del cuerpo.
   - `img/artista/retrato.jpg` foto del artista.
   - `img/vitruvio/` no hace falta tocarla.
3. **Editá `src/config.js`**: nombre, artista, textos del cuaderno, WhatsApp, Instagram, dirección,
   horarios, estilos, qué estilo tiene cada boceto, etapas del proceso,
   cuidados, preguntas frecuentes y reseñas. Ningún texto del cliente está escrito en el HTML.
4. `npm run build` y publicar.

Las imágenes se convierten solas a WebP (versión grande + miniatura) en `public/media/` cada vez que corrés
`dev` o `build`, y se genera `src/generated/media.json`. Basta con dejar las fotos en las carpetas: las de cada
zona se toman todas. Si una zona todavía no tiene fotos, poné `muestra: true` en esa zona y se muestran bocetos
de muestra con su aviso. Si no hay retrato (`retrato: null`), aparece un retrato dibujado de muestra.
Si las reseñas están vacías, la sección no se muestra.

Los efectos del fondo se prenden o apagan desde `efectos` en la config (rastro, gotas, redibujo, profundidad, corrida, violeta, fantasma, deriva).

## Modelo 3D

`public/models/david.glb` es `david-zonas.glb` comprimido con meshopt (1,9 MB → 300 KB):
`npx @gltf-transform/cli meshopt david-zonas.glb public/models/david.glb`. Conserva el atributo `_ZONE`
(0 base y tronco, 1 cabeza, 2 brazos, 3 torso, 4 espalda, 5 piernas).

## Rendimiento y accesibilidad

- Three.js y el modelo se cargan en diferido (chunk aparte) después del primer pintado.
- Modo liviano automático (pocos núcleos/memoria, ahorro de datos o menos de 40 FPS medidos): menos capas de fondo,
  máscara a menor resolución, estatua y piel a 1x. Forzable con `?liviano=1` (o `?liviano=0` para desactivarlo).
- Sin WebGL2: collage estático de bocetos, la figura de Vitruvio en lugar de la estatua y la piel con filtros CSS.
- `prefers-reduced-motion`: sin intro, sin deriva, redibujo, estela ni pincel fantasma; transiciones instantáneas.
- Lighthouse del build (Chrome headless, GPU por software): accesibilidad 100, buenas prácticas 100, SEO 100.

## Estilo: el grimorio sobre la mesa

El fondo de bocetos es la mesa y queda a pleno en todo el sitio (rastro, gotas y violeta que aparece con el mouse).
Todo el contenido son **láminas** negras de grimorio (`.lamina`): grano sutil, doble filete interior, la esquina grabada
`#esquina` en los cuatro ángulos y sombra profunda, sin rotaciones. Cada lámina abre con una cabecera centrada
(`cab()` en `src/lib/ui.js`): etiqueta en versalitas, título en Pirata One, divisor con la hoja `#hoja` y bajada en
Garamond itálica. Los símbolos `#esquina` y `#hoja` están en `index.html`. Ningún texto va directo sobre los bocetos:
siempre dentro de una lámina o una placa negra (`.placa`). Tokens en `src/styles/base.css` (`--panel`, `--bone`, `--rule`…).

- **Navegación**: banda grabada fija arriba con el nombre, los capítulos (número romano + versalitas; el actual a pleno)
  y la lámpara. Se esconde al bajar y vuelve al subir o a los 0,9 s quieto. Lacre "Reservar" flotante (se oculta en el
  taller). En celular, los capítulos y Reservar van en la barra de abajo.
- **Encuadre**: cabeceras y bloques centrados en el eje de la lámina; los pares Anterior/Siguiente van a los extremos de
  una misma línea. Las esquinas grabadas se ubican con `--fil` (distancia del filete al borde), así quedan siempre a la
  misma distancia del filete en láminas, placas, galería, visor y tapa del cuaderno.
- **Botones** (`src/lib/buttons.js`): principal `grabado()` (filete doble con rombos; al tocarlo, salpicadura violeta que
  se seca a negro), secundario `enlace()` (versalitas y una raya que se alarga) y `chip()` (recuadro con filete; el activo
  con outline doble).
- **El violeta** aparece solo en la salpicadura, el lacre, el rastro y las gotas de la mesa y la tinta del stencil en
  proceso y cuidados. Nunca en textos, bordes ni subrayados.
- **Modo estudio**: la mesa se oscurece (bocetos invertidos y tenues) y las láminas, un poco más.
- **Arrastres**: fichas, cuaderno, dial, regla, retrato y estatua usan `grab()` (o marcan `state.dragging`): la mesa no se
  mueve ni recibe rastro o gotas mientras dura el gesto. Todo lo arrastrable lleva `data-no-mesa`, y la mesa ignora
  gestos que empiezan sobre botones, links, campos o láminas.

## Letras y links

- Pirata One solo en títulos y números romanos; EB Garamond en todo lo demás. Etiquetas, menú, chips y temas en
  versalitas (`.sc`). Pasos, capítulos, preguntas y etapas van numerados en romanos.
- En los textos de `config.js` se pueden marcar palabras clave `==así==` (máximo 3 por bloque): llevan un subrayado fino.
- `paginas` define el nombre, la pestaña de la banda, el resumen del menú y la portada de cada capítulo.
- Cada trabajo tiene su link: `#trabajo/brazos-03` (zona + número, se abre en Inicio) o `/artista#trabajo/lamina-07`
  (número de boceto del fondo; `/#trabajo/lamina-07` también lleva a la página del artista).
- Las pistas ("girá", "raspá", "tocá la esquina", "deslizá la lámina") desaparecen para siempre después de usarlas
  (se guarda en `localStorage`, clave `tn-hints`).

## Decisiones de diseño

- **Intro**: las fotos de Vitruvio son de una escultura en bronce; se convierten en dibujo a pluma
  (contornos + trama cruzada) antes de revelarse con tinta.
- **Cuaderno**: tapa negra con marco grabado; páginas en hueso envejecido con tinta negra. En celular cada capítulo es
  una página. No se hojea con el scroll: se pasa tocando o arrastrando la esquina, con las flechas o deslizando.
- **Proceso y cuidados**: piel generada por shader con selector de tono. Van lado a lado en `/info`; las etapas I a VI
  se tocan y el visual de cada etapa ocupa el alto que sobra. El dial de cuidados es grabado, con marcas finas.
- **Pedido**: el acta de stencil (filetes y números romanos) se llena con cada paso; el nombre la firma.
  La zona de "Quiero uno en …" llega elegida. El paso I es el David (la misma clase `Statue`, en chico y con pedestal,
  dentro de un marco grabado): se gira arrastrando y tocar una zona la elige, la ilumina y la completa en el acta.
  Las instancias comparten la geometría del modelo (se carga una sola vez), el material y el pedestal. Sin WebGL 2
  queda la silueta grabada de `src/lib/bodymap.js`. El acta va en tres columnas fijas: romano, etiqueta y valor.
- **Preguntas**: fichero de láminas 5:3 (4:5 en celular) con temas arriba, sello "Vista" / "Anterior" al deslizar,
  flechas y Enter/Espacio para dar vuelta.
- **Estatua**: la zona bajo el cursor se ilumina con una luz hueso cálida (el violeta queda solo para la tinta).
- **Contraste**: los elementos inactivos (capítulos, chips, temas, etapas) usan opacidad 0,55 en lugar de 0,42 para
  que el texto hueso sobre negro cumpla AA (≈5:1).
- El mapa del contacto es un dibujo genérico (no reproduce las calles reales) con link a Google Maps.
