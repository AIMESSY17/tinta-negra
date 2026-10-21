# Proyecto: web demo para tatuadores ("Tinta Negra")

Vas a construir una web completa para un estudio de tatuajes. Es una **plantilla demo** que voy a vender a distintos tatuadores, así que tiene que impresionar en el primer segundo y, a la vez, poder clonarse para cada cliente cambiando solo un archivo de configuración y sus fotos.

Antes de escribir código, leé completos los archivos de `referencia/`. El hero ya está prototipado y funcionando ahí: reutilizá su lógica (shaders, efectos, interacción) en vez de reinventarla.

---

## 1. Concepto y estética (no negociable)

**"Un cuaderno de tatuador renacentista que cobra vida."** Todo lo que se ve parece hecho con tinta, papel, grafito o mármol. Nada de efectos "de computadora": sin glitch, sin neón, sin partículas brillantes, sin degradados de colores, sin 3D brilloso. Si un efecto se ve digital, reemplazalo por su versión en tinta (salpicadura, tinta corrida, trazo que se dibuja).

- **Paleta**: papel gris hueso `#e3e1dc`, tinta `#141317`, tinta suave `#4a4752`, y **un solo acento: violeta stencil `#6b38c7`**, el color del papel de calco de tatuaje. El violeta aparece solo en momentos clave (tinta fresca, hover, selección), nunca como color de relleno general.
- **Modo estudio** (oscuro): fondo `#1b1c21`, tinta clara `#ece8e1`, acento `#b79bff`. Al invertir, el violeta tiene que seguir siendo violeta, no su complementario: invertí la luminancia y conservá el tono.
- **Tipografías** (Google Fonts): `Pirata One` para títulos (gótica de tatuaje, con moderación), `IM Fell English` itálica para anotaciones manuscritas estilo cuaderno de Leonardo, `DM Mono` para textos chicos y de interfaz.
- **Textura**: grano de papel animado sutil y viñeta suave en todo el sitio.
- **Idioma**: español rioplatense (vos, tocá, arrastrá).

## 2. Stack y estructura

- **Vite + HTML/CSS/JS vanilla** (sin framework). **Three.js** para la estatua 3D, **GSAP + ScrollTrigger** para lo que dependa del scroll. WebGL2 crudo para el fondo (como en el prototipo).
- **Todo el contenido del cliente en `src/config.js`**: nombre del estudio, artista, bio, ciudad, dirección, WhatsApp, Instagram, horarios, precios orientativos, preguntas frecuentes, lista de flash disponibles y qué fotos van en cada zona del cuerpo. Ningún texto del cliente puede quedar escrito directo en el HTML.
- Para clonar el sitio a otro tatuador alcanza con cambiar `config.js` y las carpetas de imágenes. Dejá un `README.md` corto que explique exactamente ese proceso.
- Que se pueda publicar en Netlify o Vercel tal cual (`npm run build`).
- Optimizá las imágenes en el build (WebP, tamaños razonables) y cargá las pesadas en diferido.

## 3. Assets disponibles

```
img/fondo/            ~26 bocetos blackwork; algunos con detalles violeta. Ignorá download.png (es basura).
img/Cuerpo/brazo/     6 fotos reales de mangas de brazo
img/Cuerpo/torso/     4 fotos: OJO, dos son de ESPALDA y van a la zona espalda:
                        c18df315471070ba72c3cbd7b6333938.jpg y efdc2f6c941332e3a021645f6df571ba.jpg
                      las otras dos son de pecho y abdomen.
img/vitruvio/         frente.png y perfil.png (Hombre de Vitruvio, dominio público)
modelos/david.glb     el David de Miguel Ángel, original (Tripo, ~207k triángulos, sin UVs ni rig)
referencia/david-zonas.glb      el mismo David ya optimizado (~72k triángulos) con un atributo
                                 por vértice `_ZONE`: 0 base y tronco, 1 cabeza, 2 brazos,
                                 3 torso, 4 espalda, 5 piernas. Usá ESTE en la web. Va con escala x2
                                 (el modelo mide 1 unidad de alto con su base).
referencia/hero-prototipo.html  el prototipo funcionando del hero completo (fondo + estatua)
```

No hay fotos de las zonas cabeza ni piernas: usá bocetos de `img/fondo/` como muestra, con una etiqueta "bocetos de muestra", hasta que el cliente cargue las suyas. Tampoco hay foto del artista, del estudio, del proceso ni de cuidados: **todo eso se resuelve con código** (ver cada sección). Si falta algo, dejá un lugar claro en `config.js` para cargarlo después, nunca una imagen rota.

## 4. El fondo vivo (sistema global)

Es el alma del sitio. Va fijo detrás de toda la página. Copiá el sistema del prototipo y mantené todos sus comportamientos:

- **Lienzo infinito** de bocetos en grilla irregular, como hojas tiradas sobre una mesa: desplazamiento y rotación leve por hash determinístico. Se arrastra con inercia, deriva sola despacio y nunca está quieto.
- Los bocetos se dibujan con **blend multiplicativo** sobre papel, así las líneas superpuestas se mezclan y forman "híbridos".
- **Tres capas de profundidad** con parallax: atrás grandes y borrosos, en el medio los principales, adelante pocos y chicos.
- **Rastro de tinta del cursor**: una máscara ping-pong que revela debajo **otros** bocetos en las mismas posiciones, con borde orgánico y húmedo. La tinta fresca es violeta stencil, se seca a negro y el boceto revelado se desdibuja de lo claro a lo oscuro al secarse.
- **Clic o toque**: una gota de tinta que se expande y revela bocetos que se van dibujando solos.
- **Redibujo**: algunas hojas se borran y se vuelven a dibujar cada tanto, de los trazos oscuros a los claros.
- **Tinta que se corre**: al moverse rápido, las líneas dejan estela (mínimo de varias muestras en la dirección del movimiento) con una leve distorsión líquida.
- **Violeta que aparece y desaparece**: todo el fondo se ve en **blanco y negro**. Donde pasa el mouse (un halo más ancho que el rastro) y donde caen las gotas, los detalles **violeta** de los bocetos se encienden y se **desvanecen solos de vuelta a blanco y negro** en unos segundos. Ya está implementado en el prototipo con el canal B de la máscara: mantenelo.
- **Pincel fantasma**: si nadie toca nada por ~3,5 s, un pincel invisible recorre la pantalla.
- **En las secciones con texto**, el fondo se aquieta y se aclara alrededor del contenido (no desaparece) para que todo se lea bien.
- Un panel discreto "Efectos del fondo" permite prender y apagar cada efecto. Sirve para la demo de venta, porque el tatuador elige cuáles quiere. Ocultable desde `config.js`.

## 5. Secciones, en orden

Cada sección tiene que ser una **experiencia interactiva**, no un bloque de texto con fotos. Todas comparten la estética del punto 1.

### 5.1 Carga inicial: del dibujo a la estatua
El Hombre de Vitruvio de frente (`frente.png`) aparece trazo por trazo, revelado con tinta. Gira y se transforma en el de perfil (`perfil.png`), y desde ese perfil se materializa la estatua 3D de mármol, que termina el giro y queda en el hero. Rápido: menos de 3 s, y saltable con un toque.

### 5.2 Hero: el David de mármol
Tomalo del prototipo:
- El David en **mármol de Carrara limpio**: shader propio con luz cálida lateral, relleno frío, contraluz suave, vetas muy sutiles, especular bajo y un toque de subsuperficie en las sombras. **Sin efecto dibujo y sin tatuajes en la estatua.**
- Sobre un **pedestal clásico con molduras** (LatheGeometry), con sombra de contacto.
- Gira **arrastrando** y con el **scroll**. Si nadie toca nada, gira sola despacio, como en un pedestal de museo.
- **Cinco zonas**: cabeza, brazos, torso, espalda y piernas. Se detectan con raycast sobre el atributo `_ZONE`. Al pasar el cursor, la zona se ilumina en violeta (contraluz y velo suave, con pulso leve) y aparece junto al cursor una etiqueta manuscrita con 3 miniaturas: "Brazos · 6 trabajos · tocá para abrir".
- **Al tocar una zona**: cae una gota de tinta en el fondo y se abre una galería lateral (abajo, en celular) con las fotos reales en hojas con cinta, en grises que pasan a color al hover. La estatua se corre a un costado.
- Botones de zona abajo (Cabeza · Brazos · Torso · Espalda · Piernas). "Espalda" hace girar la estatua sola 180°.
- Detrás, el círculo y el cuadrado de proporciones vitruvianas, finos y semitransparentes, que se dibujan al entrar. Una nota manuscrita "girá para ver la espalda ⟶" que desaparece cuando el usuario gira.

### 5.3 El artista: su cuaderno
Un cuaderno de bocetos abierto que se hojea arrastrando la esquina o con el scroll. Cada doble página cuenta una parte de su historia (inicios, estilo, años de oficio, filosofía) con anotaciones manuscritas al margen y bocetos del fondo como ilustraciones. Al pasar la página, la tinta de la página nueva se dibuja.
- El retrato del artista aparece "raspando" la tinta con el cursor, con el mismo rastro del fondo.
- Si no hay retrato en `config.js`, mostrá un retrato dibujado de muestra.
- La firma del artista se traza sola al final, con una tipografía manuscrita animada como trazo.

### 5.4 Estilos: el fondo cambia de piel
Chips de estilos (blackwork, fine line, realismo, neotradicional: configurable). Al elegir uno, una ola de tinta barre la pantalla y el **lienzo infinito del fondo se re-puebla solo con trabajos de ese estilo**. Cada imagen tiene sus estilos definidos en `config.js`. "Todos" vuelve al fondo completo.

### 5.5 Flash disponibles: la hoja colgada
Una hoja de flash pinchada con chinches y cinta. Los diseños (bocetos de `img/fondo/` marcados como flash en la config, priorizando los que tienen violeta) se muestran como stencil violeta y, al pasar el cursor, se "tatúan" a negro. Cada uno muestra su tamaño y precio, ambos configurables.
- Al tocar **"Lo quiero"** cae un **sello de lacre violeta "RESERVADO"** con animación de estampado, y ese diseño se precarga en el pedido (5.9).

### 5.6 El proceso: un diseño, todas las etapas
Sección fija (pin) mientras se scrollea. **Un mismo boceto evoluciona en pantalla**, todo generado con filtros y shaders a partir de UN boceto de la config:
1. Idea: nota y garabato a mano.
2. Boceto en lápiz: grafito gris y trazo suave.
3. Línea final: tinta limpia.
4. Stencil: líneas violeta sobre **piel generada por código** (shader de piel con poros sutiles).
5. Recién tatuado: negro intenso, piel algo enrojecida y brillo de film.
6. Curado: tinta asentada y piel normal.

Cada etapa trae su explicación como anotación al margen. Acá la numeración tiene sentido porque es un orden real.

### 5.7 Cuidados: el dial de curación
Una **perilla tipo dial de máquina de tatuar** que se gira arrastrando, del día 1 al 30. El tatuaje sobre piel (generado, igual que en 5.6) evoluciona: rojo e hinchado, después brillo, descamación y al final curado. Al costado cambian los consejos de cada etapa (film, lavado, crema, sol, pileta). Los textos van en `config.js`.

### 5.8 Preguntas frecuentes: notas al margen
Las preguntas son anotaciones manuscritas en el borde del cuaderno. Al tocar una, la respuesta se escribe con tinta, como un trazo que avanza. Precios orientativos, seña, edad mínima, duración de sesión, etc., todo desde `config.js`.

### 5.9 Armá tu tatuaje (pedido por WhatsApp)
Nada de formulario aburrido: un taller en pasos con estética de hoja de stencil.
1. **Zona**: tocás la zona en una estatua chica (la misma del hero, reutilizada).
2. **Tamaño**: arrastrás una regla dibujada en centímetros.
3. **Estilo**: chips.
4. **Idea**: texto libre y referencia opcional (arrastrar una imagen o elegir un flash). WhatsApp no recibe imágenes por link: avisale al usuario que adjunte la referencia en el chat.
5. **Disponibilidad**: días y franja horaria.

Con todo eso se arma en vivo una **ficha de pedido** que parece una hoja de stencil firmada. El botón final abre `https://wa.me/<numero>?text=<mensaje>` con el mensaje armado y ordenado (zona, tamaño, estilo, idea, disponibilidad, flash elegido). Mostrá también el número como texto copiable por si el link no abre.

### 5.10 Cierre
La firma del artista se dibuja sola. Al lado, dirección, horarios, Instagram y WhatsApp, más un mapa simple **dibujado a mano** (SVG estilizado, sin iframe de Google Maps) con link a Google Maps.

**Navegación**: un índice discreto estilo nota al margen, que marca la sección actual.

## 6. Calidad, rendimiento y accesibilidad

- **Celular primero**: todo tiene que funcionar con el dedo (el toque reemplaza al hover, y el arrastre gira o mueve). Probalo a 390 px de ancho.
- **Equipos lentos**: detectá equipos débiles (pocos núcleos o memoria, o FPS bajos medidos) y pasá a una versión liviana: menos capas de fondo, menor resolución de máscara y la estatua con menos píxeles. Si no hay WebGL2, mostrá una versión estática digna.
- Limitá el devicePixelRatio (1,5 para el fondo y 2 para la estatua).
- Respetá `prefers-reduced-motion`: sin deriva, sin redibujo, sin estela ni pincel fantasma, y transiciones instantáneas.
- Foco de teclado visible, botones reales, `alt` en todas las fotos y contraste legible en ambos modos.
- Que no haya scroll horizontal en ninguna pantalla.
- Lighthouse: apuntá a buen rendimiento con un 3D pesado. Cargá Three.js y el modelo en diferido, después del primer pintado.

## 7. Cómo trabajar

1. Leé `referencia/hero-prototipo.html` completo y armá un plan breve de arquitectura (módulos: fondo, estatua, secciones, config) antes de codear.
2. Construí por fases y, al terminar cada una, levantá el servidor de desarrollo, revisalo en escritorio y en celular (390 px) y contame qué hiciste:
   - Fase 1: estructura, config, fondo vivo y hero (portados del prototipo).
   - Fase 2: carga inicial, artista y estilos.
   - Fase 3: flash, proceso y cuidados.
   - Fase 4: preguntas frecuentes, pedido por WhatsApp, cierre y navegación.
   - Fase 5: rendimiento, accesibilidad, modo liviano y README.
3. Si una decisión de diseño no está clara, elegí la opción más fiel a la estética del punto 1 y anotala en el README.
4. El contenido de demo usa el estudio ficticio "Tinta Negra" (blackwork y dark art). No inventes reseñas ni testimonios de personas: si querés esa sección, dejala preparada en la config para reseñas reales.
