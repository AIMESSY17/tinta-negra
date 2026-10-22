# Recuperar cosas de la versión anterior sin perder lo nuevo

La versión que está hoy en Vercel (tinta-negra-sandy.vercel.app, el commit anterior al rediseño crudo) tenía cosas que se perdieron. Hay que **traerlas de vuelta y mantener todo lo demás exactamente como está ahora**:
- las zonas de lectura,
- la legibilidad de los textos,
- el modo noche,
- la estatua,
- el taller,
- los arreglos de clic y de giro.

Antes de empezar:
1. Identificá el commit que está desplegado en Vercel (`git log`, o el commit de producción en el panel de Vercel).
2. Corré esa versión en paralelo (`git worktree add ../tatto-anterior <commit>` y otro `vite` en otro puerto) para comparar lado a lado mientras trabajás.

---

## 1. El cursor circular

La versión anterior tenía un cursor propio: un **anillo fino con un punto en el centro**, que sigue al mouse.

- Recuperalo del commit anterior (CSS y JS) con el mismo tamaño, grosor, color y suavizado.
- Solo en escritorio con mouse (`(hover:hover) and (pointer:fine)`). En táctil no existe.
- **Estados:**
  - sobre la mesa: el anillo normal (reemplaza al `grab`),
  - mientras arrastrás: el anillo se achica o se rellena un poco (reemplaza al `grabbing`),
  - sobre un link, un botón o una obra: el anillo se agranda,
  - sobre un input o un textarea: cursor de texto normal y el anillo se oculta.
- **Modo noche:** el anillo pasa a color claro (hueso), legible sobre la mesa oscura.
- Tiene que ir **sin retraso visible**:
  - posición con `transform: translate3d` en el mismo `requestAnimationFrame` del fondo,
  - leyendo la última posición del `pointermove`, sin `lerp` lento (o con un lerp muy rápido, ≥ 0,5 por frame),
  - `pointer-events:none` y `will-change:transform`.
- Si sale del viewport, se oculta. Con `prefers-reduced-motion`, sin animaciones de escala.

---

## 2. El fondo con la estética de antes, con la legibilidad de ahora

Comparando las dos versiones, la anterior tenía:
- los bocetos **nítidos y con más contraste** (negros bien negros, grises más profundos),
- la mesa un poco más oscura, que se lee como una mesa de dibujo,
- el pincel con una **mancha de tinta violeta de borde irregular y rugoso**: adentro el boceto se ve teñido en violeta y con profundidad, y el borde parece tinta absorbida por el papel,
- de noche, los bocetos en trazo claro sobre fondo gris oscuro, con el mismo pincel violeta.

La nueva está más lavada y desenfocada en toda la mesa.

**Qué hacer:**
- **Fuera de las zonas de lectura, volvé a los valores de la versión anterior:**
  - contraste, brillo y tono del papel,
  - nitidez de los bocetos, **sin desenfoque global**,
  - forma, borde, color e intensidad de la mancha del pincel,
  - el ruido del borde y el secado.
  - Copiá los uniforms y las constantes del shader del commit anterior. No los estimes a ojo.
- **Dentro de las zonas de lectura, todo queda como ahora:**
  - el aclarado del papel,
  - el desenfoque suave detrás del texto,
  - el violeta al ~35 %,
  - el borde manchado de la zona.
  - El desenfoque solo vive ahí, como parte de la isla, y no en toda la mesa.
- **Que no haya texto en el fondo:** algunas imágenes de la mesa tienen un indicador **"1/2"** y un iconito redondo pegados (de capturas de Instagram o Pinterest). Se ven en la mesa, por ejemplo al lado de los filtros de Trabajos y al lado de la estatua.
  - Recortá esas imágenes o generá copias limpias, como hiciste con el retrato.
  - Revisá **todas** las imágenes de `img/fondo` buscando texto, numeritos, íconos, marcas de agua o firmas de UI, y limpialas.
  - Pasame la lista de las que tocaste.
- **Modo noche:** el mismo criterio. Fuera de las islas, como el modo noche de la versión anterior. Adentro, como ahora.
- Mantené todo lo nuevo que ya funciona:
  - el pincel también pasa por debajo del texto,
  - la estatua bloquea solo el cuerpo,
  - las zonas ajustadas al texto real,
  - celular sin arrastre.

---

## 3. Velocidad: arrastre y clics tienen que sentirse como antes

En la versión anterior, el arrastre de la mesa y los clics se sienten **notablemente más rápidos**. Hoy hay retraso.

### Medir primero
- Grabá un perfil de rendimiento de Chrome en las dos versiones, en la misma página y con el mismo gesto:
  - arrastrar la mesa durante 3 segundos,
  - pasar el mouse sobre textos,
  - hacer clic en botones.
- Compará:
  - el tiempo por frame,
  - el tiempo de scripting en `pointermove`,
  - los recálculos de layout,
  - el INP de los clics.
- Mostrame los números de antes y de después.

### Causas probables (revisá cada una)
- **Desenfoque global:** si es `filter: blur()` o `backdrop-filter` en CSS sobre capas grandes, o un blur por pasadas en el shader en cada frame, es caro.
  - Sacalo de la mesa (ver punto 2).
  - Para las islas, usá una versión pre-desenfocada de la textura generada **una sola vez** al cargar (o un mip/LOD más bajo con `textureLod`), y mezclala dentro de la zona. No blur en vivo por frame.
- **`zonasLectura()` midiendo en cada frame o en cada `pointermove`:** `getBoundingClientRect` y `getClientRects` fuerzan layout.
  - Medí solo en `resize`, en el cambio de fuentes (`document.fonts.ready`), con un `ResizeObserver` y cuando cambia el contenido.
  - Guardá los rectángulos en coordenadas de documento y en cada frame solo restale el `scrollY`.
- **Loop del shader con 24 rectángulos + fbm por píxel:**
  - salí antes del loop con `uNR`,
  - calculá el fbm del borde solo cerca del borde de la zona,
  - o bajá las octavas a 2–3.
- **Resolución del canvas:** limitá el DPR del fondo a 1,5 (o a 1 mientras se arrastra) y la máscara ping-pong a media resolución, como en la versión anterior si era así.
- **Arrastre con suavizado:** durante el arrastre, la cámara sigue al mouse **1:1, sin lerp**. La inercia arranca recién al soltar, con `pow(.93, dt*60)`.
- **`pointermove`:**
  - listeners `passive:true` donde se pueda,
  - nada de leer layout ni escribir estilos dentro del handler (solo guardar coordenadas),
  - todo el trabajo va en el `rAF`,
  - usá `getCoalescedEvents()` para el trazo del pincel.
- **Clics lentos:**
  - revisá que el umbral de 5 px no espere un timer,
  - que no haya un `setTimeout` antes de navegar,
  - que la View Transition no retenga el clic (la animación arranca inmediatamente, no después de cargar),
  - que no haya un `click` diferido para distinguir doble clic,
  - `touch-action:manipulation` en los botones para que en celular no haya demora de 300 ms.
- **Three.js de la estatua:**
  - que no renderice cuando no está en pantalla ni cuando nada cambió (render bajo demanda o con `IntersectionObserver`),
  - DPR limitado a 1,5,
  - el raycast del hover hacelo como mucho una vez por frame, no por cada evento.
- **Capas de profundidad (`FX.depth`):** si suman muchas pasadas, que compartan la misma textura o se dibujen en una sola pasada.

### Objetivo
- Arrastre a 60 fps estables en una notebook común (con 4× de CPU throttling en DevTools, que no baje de ~45 fps).
- La mesa se pega a la mano sin retraso perceptible.
- Clics con respuesta inmediata: INP < 100 ms en los botones.
- Tiene que sentirse **igual o más rápido que el commit anterior**. Si algo nuevo no puede ser igual de rápido, avisame qué y por qué antes de sacarlo.

---

## 4. Fotos: blanco y negro, y color al pasar o tocar

Hoy todas las fotos (`tipo:'foto'`) quedaron violetas fijas. Cambialo:

- **En reposo:** todas las fotos se ven en **blanco y negro** con buen contraste (como los bocetos), así no se nota la piel.
  - De noche: el mismo blanco y negro, un poco más apagado para que no encandile sobre la mesa oscura.
- **Al pasar el mouse (escritorio) o tocarla (celular):** la foto **toma color** con la **misma transición violeta que hay ahora**.
  - El color es el duotono violeta actual (tatuaje en tinta y piel y fondo en violeta; de noche, la versión invertida).
  - Usá la misma animación y la misma duración que la transición de las obras al stencil. No hace falta un corte seco.
- **Al salir el mouse:** vuelve a blanco y negro con la misma transición, al revés.
- **En celular:**
  - al apoyar el dedo, la foto toma color,
  - queda en color ~1,5 s después de soltar y vuelve a blanco y negro,
  - el toque **no bloquea** el clic que abre la obra o la hoja (no `preventDefault`),
  - mientras se hace scroll, no se colorean las fotos que el dedo roza: solo con un toque real, sin desplazamiento.
- Los bocetos (`tipo:'boceto'`) siguen exactamente como ahora.
- Aplica en la grilla de Inicio, el portafolio de Artista, la hoja de zona y el carrusel.
- **Rendimiento:**
  - la transición, con `opacity` entre dos capas (la foto en blanco y negro y la foto con el filtro violeta) o con un filtro precalculado,
  - **no animes `filter` SVG en vivo**, que es caro con muchas fotos,
  - si conviene, generá al cargar (o en el build) la versión violeta de cada foto como imagen o canvas, y cruzalas con `opacity`.

---

## Verificación

1. **Comparación lado a lado** (versión anterior y nueva) a 1366 y 1920 px, día y noche: capturas del hero, de Trabajos y de Artista. Que la mesa se vea como antes fuera de las islas y que los textos se lean como ahora.
2. **Cursor:** que se vea en todos los estados, desaparezca en táctil y no tenga retraso.
3. **Rendimiento:** los números de antes y de después del punto 3, y fps del arrastre con throttling.
4. **Clics:** la prueba de Playwright de todos los botones y links sigue pasando.
5. **Fotos:**
   - capturas de la grilla en reposo (blanco y negro),
   - con el mouse encima de una (violeta),
   - en celular, después de tocar una.
6. **Imágenes del fondo:** la lista de las que tenían "1/2", íconos o texto y que limpiaste.
7. `npm run verificar` (o el build) en verde.
