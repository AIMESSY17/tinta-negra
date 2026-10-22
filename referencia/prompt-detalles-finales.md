# Detalles finales: giro lento de la estatua, pantalla de carga y detalle de Vitruvio

Quedó muy bien. **No cambies nada de lo que hay**:
- la estética del fondo,
- las islas,
- el cursor,
- las fotos,
- el modo noche,
- los números de rendimiento.

Son solo estos tres agregados. Los puntos 2 y 3 son cosas que **ya existían en versiones anteriores**: recuperalas del historial de git tal cual eran y adaptalas a lo que hay ahora, sin reinventarlas.

Antes de empezar, buscá en el historial:
- `git log --all -S "vitruv" -i --oneline`,
- `git log --all -S "loader" --oneline` y `git log --all -S "carga" --oneline`,
- revisá `hero-prototipo.html`, `referencia/` y el commit desplegado en Vercel antes del rediseño crudo.

Pasame qué commits y archivos encontraste y mostrame una captura de cómo se veían en esa versión antes de portarlos.

---

## 1. La estatua gira sola, lento, cuando está en pantalla

- Cuando el David entra en pantalla, gira solo **muy lento**: una vuelta completa cada ~40–60 s, con un ritmo calmo de vidriera.
- **Cuándo gira:**
  - Solo si está visible (`IntersectionObserver` con umbral ~0,25). Fuera de pantalla no gira **y no renderiza**.
  - Solo si la pestaña está visible (`visibilitychange`).
- **Cuándo se detiene:**
  - Cuando el usuario interactúa: hover sobre el cuerpo, arrastre o giro con el mouse, giro con el dedo, toque o hoja abierta. Ahí el giro automático se detiene **en el acto**, sin tirones, y la interacción manda como ahora.
  - Después de soltar, la inercia del giro manual termina como siempre. Recién después de ~3 s sin interacción, el giro automático **vuelve de a poco**: la velocidad sube de 0 a la velocidad lenta en ~1,5 s con easing, sin saltos de ángulo.
  - Mientras la hoja de zona o el taller están abiertos, no gira.
- **Con `prefers-reduced-motion`:** no gira sola.
- **Rendimiento:** esto **no puede romper los números** que conseguiste (60 fps al arrastrar, INP < 100 ms).
  - El giro es solo cambiar `rotation.y` con `dt` en el `rAF` que ya existe. Nada de un loop nuevo.
  - Ahora la estatua redibuja en cada frame mientras gira. Mantené el DPR en 1,5 como máximo en escritorio y bajalo a **1,25 en celular** si hace falta para que no caliente el teléfono.
  - No recalcules sombras, materiales ni el raycast por el giro automático. El raycast sigue siendo una vez por frame **y solo cuando el mouse está sobre el canvas**.
  - Mientras arrastrás la mesa, la estatua puede seguir girando, pero si la medición muestra frames largos, que el giro se pause durante el arrastre.
- **Celular:**
  - Que el giro automático no interfiera con el swipe horizontal para girar ni con el scroll vertical.
  - Probalo con 4× CPU throttling, 390×844 táctil, scrolleando por encima de la estatua mientras gira: que el scroll no tartamudee.
- Lo mismo para la estatua del paso 1 del taller: gira lento hasta que el usuario la toca.

---

## 2. Pantalla de carga con el hombre de Vitruvio

Recuperá **la pantalla de carga con el hombre de Vitruvio que había antes**: mismo dibujo, misma animación y mismo texto o porcentaje, si tenía.

- Adaptala a la estética actual: papel y tinta de día, la versión de noche si `tn-noche` está activo (leelo antes del primer pintado para que no haya un destello claro de noche), Pirata One para el título y el violeta stencil para el detalle o el progreso.
- **Qué espera:**
  - las fuentes (`document.fonts.ready`),
  - la primera textura de la mesa lista y el primer frame del WebGL,
  - el modelo del David cargado (o un tope de tiempo).
- **No bloquea de más:**
  - mínimo ~0,6 s para que no parpadee si carga rápido,
  - **tope de 4 s**: si algo tarda más, la pantalla se va igual y lo que falta aparece cuando llega.
- **Salida:** con la misma mancha de tinta de las transiciones (o un fundido si no se puede), así se siente parte del sitio.
- **Solo en la primera carga de la sesión** (`sessionStorage` con try/catch). Al navegar entre Inicio, Artista e Info no vuelve a aparecer: ahí sigue la transición de tinta.
- Sin JavaScript o con error, que no quede tapando la página (el CSS la oculta sola después de unos segundos, o arranca oculta si no hay JS).
- **Con `prefers-reduced-motion`:** el dibujo quieto y un fundido.
- Que no sume peso innecesario. Si el dibujo es SVG, inline. Si es imagen, liviana (webp) y precargada.

---

## 3. El detalle de Vitruvio en la estatua del David

Recuperá **el detalle de Vitruvio que tenía antes la estatua** (en el hero y donde aparecía), tal cual era. Por ejemplo, si eran el círculo y el cuadrado de proporciones en trazo de tinta detrás o alrededor del David, con sus medidas y marcas, o lo que sea que había.

- Encontralo en el historial y portalo con el mismo diseño y la misma animación, si tenía.
- Adaptá los colores a los tokens actuales (tinta y violeta de día, hueso y violeta de noche).
- Tiene `pointer-events:none`:
  - no le roba clics ni gestos a la estatua ni a la mesa,
  - no cambia el raycast: la estatua sigue bloqueando solo el cuerpo,
  - si quedó dentro de una zona de lectura, no la agrandes.
- Si gira con la estatua o queda fijo, hacé lo que hacía antes. Si antes no había giro automático, dejalo **fijo** mientras el David gira lento delante. Queda mejor.
- Que se vea bien en celular sin tapar los botones de zona ni la etiqueta "Tocá la estatua".

---

## Verificación

1. Capturas de la versión vieja (pantalla de carga y detalle de Vitruvio) al lado de las nuevas, día y noche, a 390 y 1366 px.
2. **Giro automático:**
   - gira al entrar en pantalla,
   - se detiene al pasar el mouse, al girar con el mouse o el dedo y al tocar,
   - vuelve suave a los 3 s,
   - no gira fuera de pantalla, ni con la hoja abierta, ni con reduced-motion.
3. **Rendimiento con 4× CPU throttling**, comparado con los números del arreglo anterior:
   - fps del arrastre de la mesa con la estatua girando en pantalla,
   - INP de los clics,
   - scroll en celular emulado sobre la estatua.
4. **Pantalla de carga:**
   - primera carga, recarga en la misma sesión (no aparece) y sesión nueva (aparece),
   - red lenta (Slow 4G): se va a los 4 s como máximo,
   - modo noche sin destello.
5. Prueba de clics de Playwright en verde y `npm run verificar` en verde.
6. Nada commiteado hasta que te dé el OK.
