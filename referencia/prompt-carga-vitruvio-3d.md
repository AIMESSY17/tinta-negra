# Pantalla de carga: falta la parte 3D (del Vitruvio a la estatua)

La pantalla de carga que hiciste (`src/ui/carga.js`) quedó a medias. Dibuja el Vitruvio de frente, lo da vuelta al perfil aplastándolo en X (`uScaleX = |cos|`) y sale con la mancha de tinta.

**La intro original era otra cosa.** Así estaba en el prompt original (`prompt-claude-code.md`, punto 5.1):

> El Hombre de Vitruvio de frente (`frente.png`) aparece trazo por trazo, revelado con tinta. Gira y se transforma en el de perfil (`perfil.png`), y **desde ese perfil se materializa la estatua 3D de mármol, que termina el giro y queda en el hero**. Rápido: menos de 3 s, y saltable con un toque.

Lo que falta es justo lo más lindo:
- un **giro en 3D real** del dibujo (con perspectiva, no un aplastado en X),
- la **materialización del David de mármol** desde el perfil,
- el **viaje de la estatua hasta su lugar en el hero**.

El resto del sitio quedó perfecto: **no toques nada fuera de la carga y la entrada de la estatua**.

---

## 0. Buscá la versión original

Estuvo implementada en la primera versión del sitio (la captura `promo/carrusel/capturas/intro-dibujo.jpg` es de ahí: el Vitruvio con trama sobre un pedestal de piedra, "De motu corporis · estudio para tinta" y "Clic o Esc para saltar").

- `git log --all --oneline -- '*intro*' '*carga*'`, `git log --all -S "perfil" --oneline`, `git log --all -S "materializ" -i --oneline`, `git log --all -S "motu corporis" --oneline`.
- Si encontrás el código original, **portalo tal cual** (timeline, shaders y materialización) y adaptalo solo a los tokens actuales y al modo noche.
- Si no está completo, implementalo como se describe abajo.
- Antes de seguir, mostrame una captura o un GIF del original, si existe.

---

## 1. Secuencia (total ~2,6–3 s una vez cargado)

1. **0–1,1 s · Dibujo:** el Vitruvio de frente aparece trazo por trazo con la tinta violeta fresca que se seca a negro. Es lo que ya tenés con el Sobel y la trama: mantenelo.
2. **1,1–1,7 s · Giro 3D real:**
   - el dibujo es una **lámina en 3D** que gira sobre el eje Y con perspectiva (en Three.js un plano, o con una matriz de proyección en tu shader),
   - a los 90° se cambia la textura de frente por la de perfil, que termina de entrar,
   - con una sombra o un brillo leve de papel al girar, así se siente un objeto y no una imagen.
3. **1,7–2,5 s · Materialización:**
   - desde el perfil dibujado aparece **el David de mármol real** (el mismo modelo y el mismo material del hero), parado en la misma posición, de perfil (rotación Y que coincide con el perfil del dibujo),
   - efecto de **disolución con tinta**: un umbral de ruido (fbm 3D en espacio de objeto) recorre la estatua de abajo hacia arriba. Lo que todavía no está materializado no se dibuja (`discard`), y el borde del frente de disolución brilla en **violeta stencil** como tinta fresca,
   - al mismo tiempo el dibujo del perfil se desvanece en el mismo frente: se lee como "el dibujo se vuelve mármol",
   - el pedestal de piedra de la intro se transforma en el pedestal del David (o el pedestal aparece con el mismo efecto).
4. **2,5–3 s · Termina el giro y viaja al hero:**
   - la estatua **termina el giro** (de perfil a su ángulo de reposo del hero), con easing suave,
   - en paralelo se **mueve y se escala desde el centro de la pantalla hasta su lugar exacto en el hero** (FLIP: medí el rectángulo del contenedor de la estatua en el hero y animá hacia ahí),
   - el papel de la carga se abre con la **mancha de tinta** de las transiciones y deja ver el sitio,
   - al llegar, la estatua queda **en el hero ya funcionando**: hover por zonas, giro, giro lento automático y el detalle vitruviano detrás (que se dibuja como ya hace).

**Si el sitio todavía no cargó** al terminar el paso 2, el perfil espera girando o "respirando" muy lento hasta que el David esté listo (tope de 4 s, como ahora). Si al tope el modelo sigue sin llegar, salí con la mancha como ahora y la estatua aparece en el hero con la materialización cuando llegue.

---

## 2. Cómo hacerlo sin costo extra

- **Un solo contexto 3D para la estatua.** La materialización usa **el mismo renderer, la misma escena y el mismo material** del hero. No cargues otro David ni crees otro WebGL.
  - Durante la carga, el canvas de la estatua del hero se pone `position:fixed`, encima de la capa de la carga (z-index), centrado donde está el dibujo, y con FLIP vuelve a su contenedor al final.
  - O, si es más simple, la cámara de la estatua encuadra el mismo modelo en un rectángulo centrado y al final interpola al encuadre del hero.
  - Elegí lo más estable y explicalo.
- La disolución es un `onBeforeCompile` (o un uniform `uMaterializa`) en el material de mármol existente.
  - Cuando llega a 1 se desactiva (define o rama que se saltea), así el hero **no paga nada** después de la intro.
- El dibujo del Vitruvio sigue en su canvas 2D o WebGL actual. Al terminar, se libera como ya hace (`loseContext`).
- El modelo del David se empieza a cargar **lo antes posible** (`modulepreload` o `preload` del `.glb` en `index.html`) para que la materialización casi nunca tenga que esperar.
- **DPR:** el de la estatua, 1,5 máximo (1,25 en celular).
- No bloquees el hilo principal durante la carga: nada de decodificar imágenes grandes de la mesa en el mismo frame que la materialización (`img.decode()` y escalonado).

---

## 3. Reglas que se mantienen

- Solo la **primera vez de la sesión** (`tn-carga` en `sessionStorage`).
- **Saltable** con un toque, un clic, Escape, Enter o rueda. Al saltar, la estatua va directo a su lugar en el hero (sin materialización) y la mancha se abre.
- **Modo noche** desde el primer pintado:
  - papel oscuro,
  - el Vitruvio en trazo claro (hueso),
  - la materialización con el mismo violeta,
  - el mármol como se ve de noche en el hero.
- Con **`prefers-reduced-motion`:** el Vitruvio dibujado quieto, fundido corto, la estatua aparece en su lugar sin giro ni viaje.
- **Sin WebGL:** la carga queda quieta con el dibujo y sale con un fundido, como ahora.
- **Celular:** misma secuencia, adaptada al encuadre vertical. La estatua viaja al lugar que ocupa en el hero de celular. Nada de saltos de scroll al terminar (scroll bloqueado durante la carga y liberado al final, sin mover la posición).

---

## Verificación

1. Un **GIF o video** de la intro completa en escritorio (1366 px) y en celular (390 px), de día y de noche.
2. Capturas de cada etapa: dibujo, giro 3D a mitad (que se vea la perspectiva), materialización a mitad (borde violeta) y la estatua llegando al hero.
3. Que al terminar la estatua quede **exactamente** en su lugar y con su ángulo del hero, sin salto visible en el último frame.
4. **Red lenta (Slow 4G) y 4× CPU:**
   - el perfil espera bien,
   - el tope de 4 s funciona,
   - y después de la intro el arrastre de la mesa sigue a 60 fps y el INP de los clics sigue < 100 ms (los mismos números de antes).
5. Saltar en cada etapa (un clic en el dibujo, en el giro y en la materialización): siempre termina con la estatua en su lugar y sin errores en consola.
6. Recarga en la misma sesión: no aparece. Pestaña nueva: aparece.
7. Prueba de clics de Playwright y `npm run verificar` en verde.
