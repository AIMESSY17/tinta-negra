# Rediseño "crudo": las 3 páginas de Tinta Negra

Antes de tocar código, leé completo `referencia/boceto-crudo.html`. Es el boceto aprobado y funcionando. Cada color, tipografía, efecto del fondo, gesto táctil y medida que se ve ahí es el diseño final. Este prompt explica cómo llevarlo a las 3 páginas del sitio real. **Si este prompt y el boceto no coinciden, manda el boceto.**

El cliente lo aprobó con un "que quede así". No reinterpretes, no "mejores" la estética y no agregues adornos que no estén en el boceto. Tu trabajo es trasladarlo fielmente, con la arquitectura del sitio (`config.js`, módulos, rutas) y sin romper nada de lo que ya funciona.

Los bocetos viejos (`boceto-grimorio.html`, `boceto-sellos-fichero.html`, `boceto-estudio.html`) quedan **descartados**. Eliminá del sitio todo lo que venga de ellos:
- el pergamino y los marcos ornamentales de grimorio,
- los sellos de goma, el lacre y la cinta de masking,
- las fichas de cartulina y el taco de notas,
- las tipografías manuscritas (IM Fell, EB Garamond, etc.).

---

## 0. Plan de trabajo

1. Leé el boceto entero, incluidos el CSS, el shader del fondo y el JS.
2. Recorré el sitio actual (Inicio, Artista e Info) y listá qué componentes se reemplazan, cuáles se adaptan y cuáles se borran.
3. Implementá en este orden:
   1. sistema visual global (tokens, tipografías, modo noche),
   2. fondo,
   3. encabezado y barra inferior,
   4. Inicio,
   5. Artista,
   6. Info,
   7. taller,
   8. ajustes de celular.
4. Verificá con capturas (sección 11) antes de dar algo por terminado.

---

## 1. Sistema visual

### Tipografías (Google Fonts, `display=swap`)
- **Pirata One**: solo para el lettering gótico gigante (títulos `.mega`) y el logo "Tinta Negra".
- **Hanken Grotesk** 400/500: todo el texto corrido.
- **JetBrains Mono** 400/500: etiquetas, kicker, botones, chips, contadores y navegación, en mayúsculas con `letter-spacing:.06em`.
- Eliminá cualquier otra tipografía del sitio.

### Tokens (en `:root`, copiados del boceto)
```css
--paper:#e3e1dc; --paper-rgb:227,225,220; --tinta:#111014; --tinta2:#3d3a42;
--stencil:#6b38c7; --gris:#5b5760; --sobre-stencil:#fff;
```

**Modo noche**, clase en `<html>`:
```css
:root.noche{--paper:#1b1a1a;--paper-rgb:27,26,26;--tinta:#ece7df;--tinta2:#cdc7d2;
  --stencil:#ab8dff;--gris:#aaa4ae;--sobre-stencil:#141217;color-scheme:dark}
```

- **No puede quedar ningún color fijo en el CSS** (`#fff`, `rgba(227,225,220,…)`, `rgba(17,16,20,…)`, etc.).
  - Todo va con variables, `rgba(var(--paper-rgb),…)` o `color-mix(in srgb,var(--tinta) X%,transparent)`.
  - Buscalos con grep en todo el proyecto y reemplazalos.
- El texto sobre fondo violeta usa `var(--sobre-stencil)`, nunca blanco fijo.

### Lettering gótico `.mega`
- Pirata One gigante, con `line-height:.82`.
- Lleva el **calco violeta corrido** con `::before{content:attr(data-t)}`:
  - color stencil,
  - opacidad .55,
  - `translate(.045em,.035em)`,
  - `z-index:-1`,
  - `isolation:isolate` en el padre.
- Halo de papel para que nunca se pierda sobre los bocetos:
  `text-shadow:0 0 14px rgba(var(--paper-rgb),.7),0 0 34px rgba(var(--paper-rgb),.5)`.
- Cada título de sección es un `.mega` con su `data-t`. Para los saltos de línea, usá `&#10;` y `white-space:pre`, igual que "Tinta / Negra" en el hero.

### Botones e interacción (copiar del boceto)
- **Botones:**
  - `.btn.solido`: bloque de tinta con borde levemente irregular y texto en mono.
  - `.link`: texto mono subrayado.
  - Chips y zonas: rectángulos con borde de 1,5 px de tinta; el activo va relleno de tinta.
- **Trabajos (`.obra`):** las fotos se ven en blanco y negro. Al pasar el mouse (o con la clase `.toque` al tocarlas en celular) se superpone el violeta en modo `screen` y el trabajo se vuelve stencil.
- **Accesibilidad:** foco visible en todo y mínimo 44 px de alto en todo lo tocable.

---

## 2. El fondo: la mesa es la página entera

Portá el sistema WebGL2 del boceto (el objeto `BG` y sus shaders) a un módulo propio, por ejemplo `src/fondo/mesa.js`. Va en **un solo `<canvas id="bg">` fijo** detrás de todo el sitio, compartido por las 3 páginas.

### Qué tiene que hacer, igual que en el boceto
- **Base:**
  - lienzo infinito de bocetos en capas, generado por hash,
  - blend multiplicativo,
  - desaturado salvo donde aparece el violeta.
- **Máscara ping-pong RGB:**
  - R = revelado,
  - G = frescura,
  - B = halo de color violeta.
  - El violeta aparece y desaparece con el pincel.
- **Interacción:**
  - gotas (`uDrops[8]`),
  - smear por velocidad,
  - redibujo.
- **Profundidad y desenfoque:**
  - capas de fondo y de frente desplazadas con el cursor (`FX.depth`, solo en escritorio),
  - el **desenfoque suave y los fundidos** tal cual están en el boceto.
  - Al cliente le encantó: **no lo modifiques ni le subas o bajes intensidad.**

### Zonas de lectura (la clave de la legibilidad)
El fragment shader de composición recibe hasta 10 rectángulos:
```glsl
uniform vec4 uRects[10]; uniform int uNR; uniform float uFeather;
```
- Detrás de cada uno, la mesa se aclara hacia el color del papel con un borde manchado de tinta: un SDF de rectángulo más `fbm` en el borde y `mix(col,uPaper,lr*.94)`. Copiá el bloque exacto del boceto, justo después de `col=mix(col,uPaper,fo*uFocus);`.
- En cada frame, el loop junta los rectángulos visibles de los elementos con clase **`.isla`**, más `.hoja-cab`, `.zonas` y `.acciones`, con 14 px de margen lateral y 12 px vertical (función `zonasLectura()`). Se los pasa a `render()` en píxeles de dispositivo y con la Y invertida: `x*dpr`, `(innerHeight-y-h)*dpr`, `w*dpr`, `h*dpr`, con `uFeather=64*dpr`.
- **Regla:** todo bloque de texto que se apoye sobre la mesa lleva la clase `isla`. Esto vale para las 3 páginas, también para los textos nuevos de Artista e Info.
- El `.isla::before` de CSS (radial-gradient de papel) queda suave, como apoyo. Si no hay WebGL, `<html>` recibe la clase `.no-webgl` y el radial pasa a ser casi opaco, como respaldo.

### Modo noche en el fondo
- El uniform `uStudio` invierte la luminancia conservando el tono: la mesa se vuelve negra cálida con trazos claros y las zonas de lectura se oscurecen solas.
- El violeta del pincel **sigue siendo violeta de noche**: `uTint=(.5,.32,.95)` y `uRim=(.55,.4,.9)`. Nunca verde.

### Rendimiento
- Táctil: DPR 1 y máscara a 1/3 de resolución.
- Render pausado con `IntersectionObserver` cuando ninguna sección `data-mesa` está a la vista.
- `prefers-reduced-motion`: sin redibujo, sin smear y sin pincel fantasma.
- Si WebGL2 falla o el teléfono es muy lento (medí los fps los primeros 2 s), pasá al **modo liviano**: un video loop corto de la mesa (`webm` + `mp4`, `muted playsinline loop`) o, si no existe, una imagen fija de la mesa. Dejá el lugar para el video en `config.js`.

---

## 3. Gestos de la mesa (celular y escritorio)

Copialos del boceto, con los mismos tiempos:

- **El scroll anima la mesa:** la cámara del lienzo avanza con el scroll. En táctil, la mesa no se arrastra con el dedo.
- **Tocar suelta una gota de tinta:**
  - toque corto sobre la mesa (no sobre textos ni controles),
  - `enMesa()` excluye `.isla`, `.obra`, `.hoja`, `.taller`, botones, links y `[data-nomesa]`.
- **Mantener apretado y deslizar pinta:**
  - long-press de **420 ms** (con vibración corta si existe),
  - `touchmove` no pasivo con `preventDefault` **solo mientras se pinta**; el resto del tiempo, scroll nativo.
- **Giroscopio:**
  - mueve un punto de luz violeta (solo halo de color, `paint:false`, sin revelado),
  - en iOS, botón "Activar movimiento" con `DeviceOrientationEvent.requestPermission()`.
- **Pincel fantasma:**
  - después de unos segundos sin interacción, un pincel recorre la mesa solo con curvas de Lissajous,
  - se corta apenas el usuario toca o mueve el mouse.
- **Escritorio:** el mouse pinta revelado y violeta, como en el boceto.

---

## 4. Celular: estable, sin saltos y sin que "se vaya"

Esto fue la crítica principal del sitio publicado. Tiene que quedar perfecto:

- **`html{overflow-x:clip}`** además de `body{overflow-x:clip}`.
  - En el boceto, la estatua y los botones de zona se salían por la derecha, la página quedaba más ancha que la pantalla y se corría hacia los costados.
  - Verificá con JS que `document.documentElement.scrollWidth === innerWidth` a 360, 390 y 430 px en las 3 páginas.
- **Unidades:**
  - hero en `100svh` (en celular, menos la barra inferior y el safe-area),
  - canvas del fondo en `100lvh`,
  - **nada de `100dvh`**, porque hace saltar el layout cuando aparece o se esconde la barra del navegador.
- **Resize protegido:** en táctil, ignorá los resize que solo cambian la altura menos de 180 px (la barra del navegador).
- **Scroll:**
  - sin `scroll-behavior:smooth` global,
  - sin scroll-jacking,
  - scroll nativo siempre.
- **Estatua del hero:**
  - `touch-action:pan-y`: deslizar vertical sobre ella hace scroll; tocar elige zona,
  - no se puede rotar arrastrando en táctil,
  - en celular va a la derecha (left 22%, right −18%, top 20%, bottom 196px, como en el boceto) recortada por el hero con `overflow:hidden`,
  - los textos van abajo a la izquierda, en su isla.
- **Un solo contexto WebGL para la estatua en todo el sitio.** Nunca 3 canvas WebGL a la vez (fondo + 1 estatua como máximo).
- **Barra inferior en celular (`.tabbar`):**
  - Inicio · Trabajos (o Artista) · Info · **Reservar** en tinta llena con el punto violeta,
  - marca la sección o página activa,
  - respeta `env(safe-area-inset-bottom)`,
  - cada página deja padding inferior para que la barra no tape el último contenido.
- **Encabezado en celular:** logo a la izquierda y botón de modo noche a la derecha. El "Reservar" de arriba se oculta en ≤640 px porque ya está abajo.

---

## 5. Encabezado y modo noche (las 3 páginas)

- **Encabezado `.top` fijo:**
  - fundido de papel `linear-gradient(rgba(var(--paper-rgb),.97), rgba(var(--paper-rgb),.9) 60%, transparent)` con `padding-bottom:22px`, para que los títulos gigantes no se encimen con el logo al bajar,
  - logo "Tinta Negra" en Pirata One,
  - links en mono: Inicio · Artista · Info, con la página actual marcada,
  - botón cuadrado de 44 px luna/sol,
  - "Reservar" en tinta llena.
- **Modo noche:**
  - El botón alterna la clase `noche` en `<html>` y pone `studio=true` en el fondo.
  - `aria-pressed` y `aria-label` cambian entre "Modo noche" y "Modo día", y el ícono entre luna y sol.
  - Estado inicial: lo guardado en `localStorage` (`tn-noche`, siempre con try/catch) o, si no hay nada, `prefers-color-scheme`.
  - **Aplicalo antes del primer pintado** con un script inline en el `<head>`, para que no destelle el modo claro de noche.
  - El estado se conserva al navegar entre las 3 páginas.
  - Las transiciones de color de fondo, texto y bordes duran .5 s.
- **Ajustes de noche:**
  - el retrato y las imágenes que en el día usan `mix-blend-mode:multiply` pasan a `normal` con `grayscale(1)`, porque si no se ven negras,
  - el velo de la hoja usa `rgba(0,0,0,.4)`.

---

## 6. Inicio

En orden (ver el boceto):

1. **Hero:**
   - `h1.mega` "Tinta / Negra" gigante a la izquierda.
   - Estatua del David a la derecha.
   - En una isla: kicker mono "Blackwork · Dark art · Ciudad", bajada de una línea y acciones ("Reservar turno" sólido + "Ver trabajos" link).
   - Etiqueta violeta "Tocá la estatua".
   - Fila de zonas (Cabeza, Brazos, Torso, Espalda, Piernas), con scroll horizontal en celular.
2. **Trabajos:**
   - título `.mega`, contador y chips de filtro por zona,
   - grilla de `.obra` en blanco y negro que pasan a stencil violeta.
3. **Ventana de mesa:** un respiro de pantalla con solo la mesa y una cita corta en una isla.
4. **Armá tu tatuaje:** CTA con título `.mega`, una línea de texto y "Empezar", que abre el taller.
5. **Contacto:** dirección, horarios, WhatsApp e Instagram (desde `config.js`) y el pie.

### La estatua del David
- Usá `models/david.json`:
  - viene sin genitales y con el atributo de vértice `_zone` (0 base, 1 cabeza, 2 brazos, 3 torso, 4 espalda, 5 piernas),
  - rearmalo en memoria con `loadModel()` como en el boceto.
- Material de mármol limpio (el `ShaderMaterial` del boceto) y pedestal con `LatheGeometry`.
- **Sin tatuajes, decals ni efecto dibujo sobre el cuerpo.**
- Al pasar o tocar, la zona se ilumina apenas y aparece la etiqueta violeta con su nombre.
- **Tocar una zona abre la hoja de trabajos de esa zona. NO lleva al taller.**
  - En celular, la hoja es una bottom sheet:
    - manija,
    - título y cantidad,
    - carrusel horizontal con scroll-snap,
    - se cierra deslizando hacia abajo, con la ×, con Esc o tocando el velo.
  - En escritorio es un panel lateral.
  - Al pie: "Quiero uno en [zona]", que recién ahí abre el taller con la zona ya elegida.
- La espalda se elige girando la estatua (arrastre solo en escritorio) o con el botón de zona "Espalda".
- Carga diferida: Three.js y el modelo se cargan después del primer pintado, con un placeholder liviano mientras tanto.

---

## 7. Taller "Armá tu tatuaje"

- Pantalla completa (`.taller`) que sube desde abajo.
- Cabecera "Paso N de 5" y ×, y debajo 5 barras de progreso.
- Pie con "Atrás" (link) y "Siguiente" (sólido).
- Los 5 pasos:
  1. **Zona:** **el mismo David**, reubicado dentro del taller (moviendo el canvas o el renderer, sin crear un contexto nuevo). Se toca la zona y se marca. Debajo van los botones de zona como alternativa. Si se llegó desde "Quiero uno en X", la zona ya viene elegida.
  2. **Tamaño.**
  3. **Estilo.**
  4. **Idea:** textarea con fondo `color-mix(in srgb,var(--paper) 70%,#fff 30%)`, que de noche se ve oscuro.
  5. **Cuándo podés.**
- **Resumen final:** todo ordenado y botón "Enviar por WhatsApp", que arma el link `wa.me` con el número de `config.js` y el texto prolijo.
- En celular, los 5 pasos entran sin cortarse y el teclado no tapa el botón "Siguiente".

---

## 8. Artista (`/artista`)

- Portada con `h2.mega` "El artista" y la etiqueta mono "Nombre · N años" (desde `config.js`).
- **Retrato + bio**, uno al lado del otro en escritorio y apilados en celular.
  - El retrato va en marco de tinta 4:5 y se vuelve stencil violeta al pasar o tocar.
  - La bio va en una isla, con los datos en números grandes (años de oficio, piezas, por día).
- **Portafolio completo:** la misma grilla de `.obra` de Inicio, con filtros por zona y por estilo. Al tocar una obra se abre el visor en la misma hoja o panel que usa la estatua.
- Cierre con CTA "Armá tu tatuaje", que lleva a Inicio y abre el taller.
- **Importante:** el retrato de muestra actual parece de una persona conocida. **Reemplazalo** por una imagen genérica o un placeholder de boceto, y dejá el campo `retrato` en `config.js` para que el tatuador ponga su foto.

---

## 9. Info (`/info`)

Todo con el mismo lenguaje: títulos `.mega`, textos en islas y mesa a pleno entre bloques.

- **Preguntas:**
  - acordeón con `<details>` como en el boceto, con la pregunta en mono o sans media y la respuesta en sans,
  - abre y cierra suave,
  - contenido desde `config.js`.
- **Proceso:**
  - las etapas (idea → boceto → stencil → sesión → curado) como bloques numerados en islas,
  - el visual de cada etapa en blanco y negro que pasa a stencil violeta, igual que las obras.
- **Cuidados:**
  - los consejos por etapa de curación (días 1–3, 4–14, 15–30) en islas,
  - claros y sin decoración extra.
- Cierre con CTA al taller y contacto compacto.

---

## 10. Reglas generales

- **Ningún texto queda apoyado directo sobre los bocetos sin isla.** Si lo ves difícil de leer en alguna captura, el arreglo es la clase `isla` y la zona de lectura, no oscurecer toda la mesa.
- El fondo **no se atenúa en general**. La mesa se ve con toda su fuerza fuera de las zonas de lectura.
- Las líneas y detalles de texto van en tinta (negro de día, hueso de noche). El violeta queda para el calco de los títulos, la etiqueta "Tocá la estatua", el punto de Reservar, el stencil de las obras y el pincel del fondo.
- Nada de viñetas de cómic, onomatopeyas, tramas, estilo de notas, pergamino ni sellos.
- Todo el contenido del cliente sigue en `config.js`.
- Las rutas `/artista` e `/info` siguen funcionando en Vercel (`vercel.json`).

---

## 11. Verificación (obligatoria)

1. Sacá capturas **de lo visible, pantalla por pantalla** (no de la página completa), bajando de a una pantalla:
   - a **390×844** (táctil, `isMobile`) y a **1366×820**,
   - en **modo día y modo noche**,
   - en las 3 páginas.
2. En cada captura, chequeá:
   - que todo texto se lea con claridad,
   - que nada quede cortado a la derecha,
   - que la barra inferior no tape contenido,
   - que el violeta del fondo sea violeta también de noche.
3. Chequeá con JS que `scrollWidth === innerWidth` a 360, 390 y 430 px en las 3 páginas.
4. Probá en táctil emulado:
   - toque = gota,
   - long-press de 420 ms y deslizar = pinta, sin que la página haga scroll mientras pinta,
   - scroll normal fluido,
   - tocar una zona de la estatua abre la hoja (no el taller),
   - "Quiero uno en X" abre el taller con la zona elegida,
   - el taller completo hasta el link de WhatsApp.
5. Recargá la página en modo noche y confirmá que no hay destello claro.
6. Contá los contextos WebGL activos: como máximo 2.
7. Mostrame las capturas finales de día y de noche en celular y escritorio.
