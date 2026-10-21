// Movimientos "humanos": curvas Bézier con desvío lateral, easing y ritmo en tiempo real.
// El azar es con semilla, así cada corrida graba los mismos gestos.

export function azar(semilla = 7) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const suave = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const dormir = ms => new Promise(r => setTimeout(r, ms));

export function crearHumano(page, semilla = 7) {
  const rnd = azar(semilla);
  let x = 270, y = 480;

  // lleva el mouse de (x, y) a (tx, ty) por una curva, al ritmo de un cuadro (~16 ms)
  async function mover(tx, ty, { ms, curva = .16 } = {}) {
    const dx = tx - x, dy = ty - y, dist = Math.hypot(dx, dy);
    if (dist < 1) return;
    ms ??= Math.min(1300, Math.max(320, 260 + dist * 1.5));
    const nx = -dy / dist, ny = dx / dist;
    const o1 = (rnd() - .5) * 2 * curva * dist, o2 = (rnd() - .5) * 2 * curva * dist;
    const p0 = [x, y], p3 = [tx, ty];
    const p1 = [x + dx * .3 + nx * o1, y + dy * .3 + ny * o1];
    const p2 = [x + dx * .72 + nx * o2, y + dy * .72 + ny * o2];
    const t0 = Date.now();
    for (;;) {
      const t = Math.min(1, (Date.now() - t0) / ms), e = suave(t), u = 1 - e;
      const px = u * u * u * p0[0] + 3 * u * u * e * p1[0] + 3 * u * e * e * p2[0] + e * e * e * p3[0];
      const py = u * u * u * p0[1] + 3 * u * u * e * p1[1] + 3 * u * e * e * p2[1] + e * e * e * p3[1];
      await page.mouse.move(px, py);
      if (t >= 1) break;
      await dormir(14);
    }
    x = tx; y = ty;
  }

  // recorre varios puntos encadenando curvas sin frenar del todo entre ellas
  async function recorrer(puntos, msPorTramo) {
    for (const [px, py] of puntos) await mover(px, py, { ms: msPorTramo, curva: .22 });
  }

  async function clic(tx, ty, opts) {
    if (tx !== undefined) await mover(tx, ty, opts);
    await dormir(60 + rnd() * 60);
    await page.mouse.down();
    await dormir(55 + rnd() * 35);
    await page.mouse.up();
  }

  async function clicEn(locator, { fx = .5, fy = .5, ...opts } = {}) {
    const b = await locator.boundingBox();
    if (!b) throw new Error(`No encontré ${locator}`);
    await clic(b.x + b.width * fx, b.y + b.height * fy, opts);
  }

  async function arrastrar(tx, ty, ms = 900) {
    await page.mouse.down();
    await dormir(60);
    await mover(tx, ty, { ms, curva: .05 });
    await dormir(40);
    await page.mouse.up();
  }

  // tipea con ritmo irregular, como una persona
  async function escribir(texto) {
    for (const c of texto) {
      await page.keyboard.type(c);
      await dormir(c === ' ' ? 60 + rnd() * 50 : 32 + rnd() * 45);
    }
  }

  // scroll con easing (el sitio usa scroll-behavior: smooth, por eso 'instant')
  async function scrollA(destino, ms = 1200) {
    await page.evaluate(([to, ms]) => new Promise(res => {
      const y0 = scrollY, t0 = performance.now();
      const e = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
      const f = now => {
        const t = Math.min(1, (now - t0) / ms);
        scrollTo({ top: y0 + (to - y0) * e(t), behavior: 'instant' });
        if (t < 1) requestAnimationFrame(f); else res();
      };
      requestAnimationFrame(f);
    }), [destino, ms]);
  }

  return {
    mover, recorrer, clic, clicEn, arrastrar, escribir, scrollA,
    pausa: ms => dormir(ms),
    // ubica el mouse sin animar (antes de empezar a grabar)
    async ubicar(tx, ty) { x = tx; y = ty; await page.mouse.move(tx, ty); },
    get pos() { return [x, y]; },
    rnd,
  };
}
