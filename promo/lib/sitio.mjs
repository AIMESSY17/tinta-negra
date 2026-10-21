// Levanta el sitio con el Vite del proyecto (sin tocar sus scripts) y abre Chrome con GPU.
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';

export const RAIZ = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
export const PROMO = path.join(RAIZ, 'promo');

export async function levantarSitio(port = 5199) {
  const vite = await import(pathToFileURL(path.join(RAIZ, 'node_modules/vite/dist/node/index.js')).href);
  const server = await vite.createServer({
    root: RAIZ, configFile: path.join(RAIZ, 'vite.config.js'), logLevel: 'error',
    server: { port, strictPort: true, host: '127.0.0.1' },
  });
  await server.listen();
  return { url: `http://127.0.0.1:${port}/`, cerrar: () => server.close() };
}

// Chrome del sistema en headless usa la GPU real (WebGL por ANGLE/D3D11);
// si no está instalado, cae al Chromium de Playwright.
export async function abrirNavegador() {
  const args = ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--hide-scrollbars'];
  for (const channel of ['chrome', 'msedge', undefined]) {
    try { return await chromium.launch({ headless: true, channel, args }); } catch { /* siguiente */ }
  }
  throw new Error('No encontré Chrome, Edge ni Chromium de Playwright (npx playwright install chromium).');
}
