// Graba con el screencast de Chrome DevTools (cuadros JPEG con marca de tiempo) y arma
// un MP4 H.264 a 30 fps constantes con ffmpeg. La grabación nativa de Playwright sale en
// VP8 de baja calidad, así que no se usa.
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import ffmpeg from 'ffmpeg-static';

export async function grabar(page, accion, { fps = 30, ancho = 1080, alto = 1920 } = {}) {
  const cdp = await page.context().newCDPSession(page);
  const cuadros = [];
  const marcas = {};
  cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    cuadros.push({ t: metadata.timestamp, buf: Buffer.from(data, 'base64') });
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 94, maxWidth: ancho, maxHeight: alto, everyNthFrame: 1 });
  const marcar = nombre => { marcas[nombre] = Date.now() / 1000; };
  marcar('arranque');
  await accion(marcar);
  marcar('fin');
  await cdp.send('Page.stopScreencast');
  await cdp.detach().catch(() => {});
  return { cuadros, marcas, fps };
}

// Re-muestrea a fps constantes: en cada instante usa el último cuadro recibido
// (el screencast solo manda cuadros cuando algo cambia en pantalla).
export function remuestrear({ cuadros, fps }, desde, hasta) {
  const lista = [];
  let k = 0;
  const n = Math.round((hasta - desde) * fps);
  for (let i = 0; i < n; i++) {
    const t = desde + i / fps;
    while (k + 1 < cuadros.length && cuadros[k + 1].t <= t) k++;
    lista.push(cuadros[k].buf);
  }
  return lista;
}

export async function aMp4(lista, salida, { fps = 30, ancho = 1080, alto = 1920 } = {}) {
  const args = [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-vf', `scale=${ancho}:${alto}:flags=lanczos,format=yuv420p`,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-r', String(fps),
    '-movflags', '+faststart', salida,
  ];
  const p = spawn(ffmpeg, args, { stdio: ['pipe', 'inherit', 'inherit'] });
  const fin = new Promise((res, rej) => { p.on('close', c => (c ? rej(new Error(`ffmpeg salió con ${c}`)) : res())); p.on('error', rej); });
  for (const buf of lista) {
    if (!p.stdin.write(buf)) await new Promise(r => p.stdin.once('drain', r));
  }
  p.stdin.end();
  await fin;
}

export async function guardarCuadro({ cuadros }, t, salida) {
  let mejor = cuadros[0];
  for (const c of cuadros) if (Math.abs(c.t - t) < Math.abs(mejor.t - t)) mejor = c;
  await fs.writeFile(salida, mejor.buf);
}

export function fpsReales({ cuadros }, desde, hasta) {
  const n = cuadros.filter(c => c.t >= desde && c.t <= hasta).length;
  return n / Math.max(.001, hasta - desde);
}
