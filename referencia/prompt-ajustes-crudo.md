# Ajustes al rediseño crudo: fondo vivo en todo el sitio, encuadre, retrato y arrastre

El rediseño crudo quedó muy bien: **no cambies nada de la estética, el desenfoque ni las intensidades**. Son solo estos ajustes puntuales. Aplicalos en las 3 páginas.

---

## 1. Que no queden zonas donde el fondo no reacciona

Hoy, sobre los bloques de texto y alrededor de la estatua, el pincel se apaga y la mesa queda muerta.

- Pasa sobre todo en el bloque "Armá tu tatuaje", que ocupa casi todo el ancho.
- También en el rectángulo de la bio del artista.
- Y en todo el recuadro de la estatua, que es mucho más ancho que el David.

Se arregla con estas tres cosas juntas.

### A. Zonas de lectura ajustadas al texto real
- `zonasLectura()` deja de medir contenedores (`.isla` grandes) y mide los **elementos de texto reales** que hay adentro:
  - cada `h1`/`h2`/`.mega`, `p`, `.kicker`, `h3`,
  - la fila `.acciones`, los botones, `.datos`, `.zonas` y `.chips`.
- Usá un `Range` o `getClientRects()` para que el rectángulo abrace el texto y no el ancho del contenedor. En un `p` alcanza con el `getBoundingClientRect()` del propio `p`, limitado a su `max-width`.
- Margen de unos 12 px por lado.
- Subí el límite del shader de 10 a **24 rectángulos**: `uRects[24]`, con el loop hasta 24. Priorizá los que están en pantalla.
- `uFeather` queda igual, así el borde manchado se ve como ahora.
- El `.isla::before` de CSS también se achica al texto (o se quita si la zona del shader ya alcanza). En `.no-webgl` sigue como respaldo.
- Resultado esperado: entre párrafos, a los costados de los textos y alrededor de los botones se ve y se toca la mesa.

### B. El pincel también pasa por debajo del texto
- El pincel **no se apaga** sobre las zonas de lectura.
  - El mouse pinta en toda la pantalla, salvo encima de botones, links, inputs, la hoja y el taller.
  - En táctil, la gota y el pintado también funcionan sobre las islas, siempre que no se toque un control.
- En el shader, dentro de una zona de lectura (`lr`):
  - el **revelado en negro** (canal R) no se muestra,
  - el **halo violeta** (canal B) se ve al **35 % aproximadamente** de su intensidad normal.
  - Fuera de las zonas, todo igual que ahora.
  - Ejemplo de idea: calcular el violeta como hoy y mezclarlo con `mix(1., .35, lr)`, y aplicar el revelado multiplicado por `(1.-lr)`.
- El violeta sobre el texto se seca rápido con la frescura (G) que ya existe.
- Calibralo para que **nunca le baje legibilidad a la letra**, de día y de noche. Si en alguna captura compite con el texto, bajalo al 25 %.

### C. La estatua bloquea solo donde está el cuerpo
- El recuadro de la estatua ya no corta los gestos de la mesa.
- En cada `pointerdown` y `pointermove` sobre el canvas de la estatua, usá el raycast que ya elige la zona.
  - **Si el rayo toca el David** (o el pedestal), es interacción de la estatua: hover, zona o abrir la hoja, como ahora.
  - **Si no toca nada**, el evento es de la mesa:
    - con mouse, pinta,
    - toque corto, gota,
    - mantener apretado 420 ms y deslizar, pinta.
  - Usá una tolerancia de unos 12 px alrededor de la silueta: si el toque cae en ese borde, gana la estatua, para que elegir zona siga siendo fácil.
- `touch-action:pan-y` se mantiene: deslizar vertical sobre la estatua sigue haciendo scroll.
- Sacá `data-nomesa` del contenedor de la estatua o reemplazalo por esta lógica.
- La etiqueta "Tocá la estatua" y los botones de zona siguen bloqueando, como cualquier control.

---

## 2. Encuadre del título "Tinta Negra" y del logo

### Título del hero
- Que **no se pegue ni se corte en el borde izquierdo**.
- Arranca exactamente en el mismo margen izquierdo que la bajada, el kicker y los botones del hero (misma línea vertical, la del contenedor).
- El tamaño se calcula para que las dos líneas entren **enteras en la mitad izquierda**, sin meterse debajo de la estatua. Por ejemplo `font-size:clamp(…)` según el ancho disponible de esa columna, con el calco violeta incluido.
- Queda centrado en el alto, entre el encabezado y el bloque de la bajada, con aire arriba y abajo.
- Mantené el calco violeta, el halo de papel y la tipografía. Solo cambian la posición y el tamaño.
- **Celular:** margen de 20 px de cada lado, el título usa el ancho de la columna y no se mete debajo de la estatua ni de la barra superior.
- Revisá con el mismo criterio los otros títulos `.mega` de las 3 páginas: alineados al margen del contenido, ninguno cortado ni pegado a un borde.

### Logo de la barra superior
- Va alineado con el **mismo margen izquierdo que el contenido** de la página, no a 20 px del borde de la ventana. Del lado derecho, los botones se alinean con el margen derecho del contenido.
- Un poco más grande (unos 32 px en escritorio y 28 px en celular) y **centrado en el alto** con el botón de modo noche y "Reservar".
- La navegación del centro queda donde está.

---

## 3. Retrato del artista

- El retrato del boceto **no era un actor**: es el dibujo del caballo peleando con el jaguar, `img/fondo/a2341b1c4fdb02500f2ffd18a8c4268a.jpg`. El aviso del actor era por un retrato de una versión anterior. Volvé a ponerlo.
- Va en el lugar del retrato, en el marco de tinta 4:5, con el mismo stencil violeta al pasar o tocar, como en `referencia/boceto-crudo.html`.
- **Recortá los bordes** del original: abajo tiene un indicador "1/2" y un iconito redondo en las esquinas. Hacé el recorte con `object-position`/escala o generá una copia recortada en `img/artista/`.
- Sin etiqueta "Retrato de muestra". Sacá el retrato-boceto generado.
- El campo `retrato` de `config.js` apunta a esta imagen por defecto y sigue siendo reemplazable por la foto del tatuador.

---

## 4. Arrastrar la mesa en escritorio (el ajuste más importante)

Recuperá el arrastre de la mesa que tenía la versión anterior (`referencia/hero-prototipo.html`, `drag.mode==='bg'`):

- **Solo con mouse.** Apretás en cualquier lugar de la mesa que no sea un control (botón, link, input, textarea, chip, obra, hoja, taller) **ni el cuerpo de la estatua**, y arrastrás. La mesa se desliza con la mano.
  - Funciona también encima de los textos y alrededor de la estatua.
- La cámara del lienzo (`cam.x`, `cam.y`) sigue al mouse mientras arrastrás. Al soltar sigue con **inercia** y frena suave: `cam.vx` y `cam.vy` con fricción `pow(.93, dt*60)`, como en el prototipo.
- **La tinta se corre con el arrastre:** smear por velocidad y el pincel sigue pintando mientras arrastrás, así queda la estela.
- Las capas de profundidad (fondo y frente) se desplazan con su paralaje, como ya hacen con el cursor.
- **Cursor:** mano abierta (`grab`) sobre la mesa y mano cerrada (`grabbing`) mientras arrastrás.
- Si el movimiento fue menor a 5 px, se toma como clic (por ejemplo, para la gota), no como arrastre.
- Usá `setPointerCapture` para que el arrastre no se corte al pasar sobre otros elementos.

### Celular: queda como está
- **No agregues arrastre de la mesa en celular.** El fondo no se mueve con el dedo. Siguen igual:
  - el scroll nativo,
  - toque = gota,
  - mantener apretado y deslizar = pintar,
  - la luz violeta del giroscopio,
  - el pincel fantasma.

---

## 5. Sin selección de texto en el sitio

- Desactivá la selección de texto en toda la página: `user-select:none` y `-webkit-user-select:none` en `body`. Así se evitan conflictos con el arrastre, la gota y el pintado, y el resaltado azul en celular.
- **Excepciones** (ahí sí se puede seleccionar y escribir): `input`, `textarea` y `[contenteditable]` del taller.
- Datos de contacto: como ya no se pueden seleccionar, el WhatsApp, el Instagram y la dirección tienen que ser **links que funcionan**:
  - `wa.me`,
  - perfil de Instagram,
  - Google Maps.
  - Más un botón chico **"Copiar"** junto al número que copia al portapapeles y muestra "Copiado" un segundo.
- `-webkit-touch-callout:none` en las imágenes y la mesa, para que en iOS no salga el menú de "guardar imagen" al mantener apretado (necesario para pintar).

---

## Verificación

1. **Escritorio (1366×820 y 1920×1080), día y noche:**
   - pasá el mouse por encima de los textos del hero, de "Armá tu tatuaje" y de la bio del artista: tiene que aparecer el violeta suave, sin que se pierda la lectura,
   - pasá el mouse alrededor de la estatua: pinta,
   - sobre el David: elige zona.
2. **Arrastre:**
   - arrastrá la mesa desde un espacio libre, desde encima de un texto y desde al lado de la estatua: se mueve con inercia y la tinta se corre,
   - un clic corto no arrastra.
3. **Celular (390×844 táctil):**
   - toque al lado de la estatua = gota; toque en el David = hoja,
   - mantener apretado sobre un texto y deslizar = pinta sin hacer scroll,
   - deslizar vertical = scroll normal,
   - la mesa nunca se mueve con el dedo.
4. **Capturas pantalla por pantalla** a 390 y 1366 px, día y noche, en las 3 páginas:
   - "Tinta Negra" encuadrado y alineado con la bajada,
   - logo alineado con el contenido,
   - retrato del caballo y el jaguar sin el "1/2",
   - ningún título cortado.
5. Intentá seleccionar texto con doble clic y arrastrando: no se selecciona. En el taller, el textarea sí permite escribir y seleccionar.
6. `scrollWidth === innerWidth` sigue dando bien a 360, 390 y 430 px.
7. Mostrame las capturas finales.
