# Material para Instagram

Desde la raíz del proyecto: `npm run promo` regenera todo. Hace tres pasos:

1. **Grabar** (`grabar.mjs`): levanta el sitio con Vite y abre Chrome con GPU. Graba cinco escenas con el mouse en curvas suaves, por screencast de DevTools, y las arma en MP4 a 30 fps.
   - Salida: `video/public/grabaciones/`.
   - También deja capturas para el carrusel en `carrusel/capturas/`.
   - El viewport es de 540×960 CSS a escala 2×. Así los cuadros salen de 1080×1920 y el sitio muestra su diseño de celular.
   - Para el diseño de escritorio, usá `--escala=1`.
2. **Reels** (`video/render.mjs`): Remotion arma un reel por cada entrada de `textos.json`. Salida: `salida/reels/*.mp4`.
3. **Carrusel** (`carrusel/render.mjs`): la plantilla HTML se renderiza a PNG de 1080×1350. Salida: `salida/carrusel/*.png`.

Cada paso también corre por separado, desde `promo/`:

```
npm run grabar              # o: node grabar.mjs pedido proceso
npm run reels               # o: node video/render.mjs reel-4-pedido
npm run carrusel
npm run studio              # vista previa interactiva de Remotion
```

## Textos

Todo lo editable está en `textos.json`: títulos, bajadas, notas, cierre, tu `@usuario` y los textos del carrusel. Después de editarlo, alcanza con `npm run reels` y `npm run carrusel`. No hace falta volver a grabar.

Por reel también podés recortar la grabación con `"desde"` y `"hasta"`, en segundos.

## Audio

Los reels se leen sin sonido. Para sumar música:

1. Copiá el archivo a `video/public/audio/pista.mp3`.
2. Poné `"audio": { "activo": true }` en `textos.json`.

## Notas

- Remotion es gratis para personas y empresas de hasta 3 empleados. Si crecés, revisá su licencia.
- La primera vez, Remotion descarga su Chrome headless (~120 MB).
