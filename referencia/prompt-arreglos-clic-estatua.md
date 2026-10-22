# Arreglos: clics, estatua en celular, transición entre secciones y fotos con piel

Son cuatro ajustes al rediseño crudo. No cambies nada de la estética, el desenfoque ni las intensidades del fondo.

---

## 1. URGENTE: no se puede hacer clic ni clic derecho

Desde que se agregó el arrastre de la mesa en escritorio, los clics no llegan a los botones y links, y el clic derecho no abre el menú. Seguramente se debe a que:
- el `pointerdown` global hace `preventDefault` o `setPointerCapture` apenas apretás,
- o una capa o el canvas quedó encima con `pointer-events`,
- o el `contextmenu` se cancela en toda la página.

Arreglalo así:

- **El `pointerdown` no hace `preventDefault` ni captura el puntero.** Solo guarda la posición inicial, y solo si el objetivo es mesa (no es `a, button, input, textarea, select, label, summary, [role=button], .chip, .zona, .obra, .hoja, .taller` ni el cuerpo de la estatua).
- **El arrastre empieza recién cuando el mouse se movió más de 5 px.** Recién ahí se llama a `setPointerCapture` y se pone el cursor `grabbing`.
- Si se soltó sin pasar los 5 px, es un clic normal: no se toca nada y el navegador lo procesa como siempre.
- Después de un arrastre real, cancelá **solo el `click` que viene justo después** (una vez, con un flag), para que soltar encima de un link no lo abra.
- **Clic derecho:**
  - En escritorio, el menú contextual funciona en todo el sitio. No bloquees `contextmenu` con mouse.
  - Solo en táctil, mientras se mantiene apretado para pintar, se evita el menú.
- El canvas del fondo tiene `pointer-events:none`. Revisá que ninguna capa decorativa invisible (velo, overlay de transición, etiqueta) quede encima con `pointer-events:auto` cuando no está activa.
- `user-select:none` se mantiene, pero no tiene que afectar los clics.

**Verificación:** con Playwright en escritorio, hacé clic en todos los links de la barra, "Reservar", "Reservar turno", "Ver trabajos", los botones de zona, los chips, una obra, el botón de modo noche y los links de contacto, y confirmá que cada uno hace lo que tiene que hacer. Probá también que el clic derecho abre el menú y que el arrastre de la mesa sigue funcionando.

---

## 2. La estatua tiene que girar en celular

Hoy en táctil no se puede rotar. Hacelo así, sin romper el scroll:

- **Deslizar horizontal sobre el cuerpo del David lo gira**, con inercia, igual que con el mouse en escritorio.
- El canvas de la estatua mantiene `touch-action:pan-y`. Así el navegador hace el scroll vertical y el gesto horizontal llega al JS.
- Decidí la dirección del gesto en los primeros 8–10 px:
  - si es más horizontal que vertical, es giro (no hay scroll),
  - si es más vertical, es scroll normal y la estatua no gira.
- El giro solo empieza si el dedo apoyó **sobre el cuerpo** (raycast con la tolerancia de 12 px que ya existe). Al lado del cuerpo sigue siendo mesa: gota y pintado.
- **Toque corto sobre el cuerpo**, sin desplazarse, sigue abriendo la hoja de esa zona. Un giro nunca abre la hoja.
- Así se llega a la espalda girando. El botón "Espalda" sigue existiendo.
- Opcional: una pista chica la primera vez ("deslizá para girar"), que desaparece al usarla (`localStorage` con try/catch).
- Lo mismo en el paso 1 del taller.

---

## 3. Recuperar la transición entre secciones que había antes

Antes del rediseño, el sitio tenía una transición de tinta al pasar entre secciones y páginas: la **mancha de tinta** con View Transitions. El rediseño la sacó.

- Buscala en el **historial de git** (commits anteriores al rediseño crudo: View Transitions, `::view-transition`, mancha o tinta) y recuperala con el mismo aspecto.
- Aplicala:
  - al pasar entre Inicio, Artista e Info (View Transitions entre documentos con `@view-transition { navigation: auto; }` y un fallback para los navegadores que no lo soportan),
  - al saltar a una sección desde la navegación o la barra inferior (Trabajos, Contacto, etc.),
  - al abrir y cerrar el taller, si ya lo tenía antes.
- Adaptá los colores a los tokens del crudo: tinta y violeta de día, y la versión de noche.
- El fondo WebGL no se reinicia entre páginas si se puede evitar. Si se reinicia, que la mancha lo tape.
- Con `prefers-reduced-motion`: solo un fundido corto.
- Probá que siga funcionando en celular y que no vuelvan los saltos de scroll.

---

## 4. Fotos con piel: tratamiento de color "flashero"

Las fotos reales de tatuajes (brazo, torso, espalda, etc.) muestran la piel, y en la grilla y en la hoja se ven como fotos comunes. Los bocetos sobre papel blanco quedan bien como están.

- En `config.js`, cada imagen tiene `tipo: 'foto' | 'boceto'`.
  - Llenalo mirando cada imagen.
  - Como respaldo, si falta el dato, detectalo al cargar: saturación promedio en un canvas chico, con un umbral razonable.
- **Las fotos llevan un duotono** con un filtro SVG (`feColorMatrix` a grises + `feComponentTransfer` tipo gradient map), así la piel nunca se ve como piel:
  - **Día:** sombras en `--tinta`, medios y luces hacia el **violeta stencil** brillante. El tatuaje queda negro intenso y la piel y el fondo pasan a violeta. Es el mismo lenguaje que el stencil de las obras al pasar el mouse, pero fijo.
  - **Noche:** el mismo criterio invertido al estilo del modo noche: fondo y piel en violeta profundo o negro violáceo, y el tatuaje en trazo claro (hueso). Usá las mismas tintas que ya usaste para las imágenes del Proceso de noche.
- Al pasar el mouse o tocar una foto, se intensifica (más contraste o un violeta más eléctrico), como el efecto actual de `.obra`.
- Los bocetos (`tipo: 'boceto'`) siguen exactamente como ahora: blanco y negro que pasa a stencil violeta.
- Aplica en la grilla de Inicio, el portafolio de Artista, la hoja de zona y el carrusel.
- Calibralo para que el tatuaje se lea bien siempre. Ese es el criterio para el contraste.

---

## Verificación final

1. Capturas pantalla por pantalla a 390 y 1366 px, día y noche, en las 3 páginas, con foco en la grilla de trabajos y la hoja de una zona con fotos.
2. Prueba de clics completa (punto 1).
3. En táctil emulado:
   - deslizar horizontal sobre el David lo gira,
   - deslizar vertical sobre el David hace scroll,
   - toque corto abre la hoja,
   - toque al lado del cuerpo deja una gota.
4. Navegación entre las 3 páginas y a secciones con la transición de tinta.
5. Corré `npm run verificar` (o el build) y mostrame las capturas.
