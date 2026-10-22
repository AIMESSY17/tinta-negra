// Transición de tinta (recuperada de la versión anterior): View Transitions con una mancha que se abre
// desde el punto del clic. Ahora el frente de la mancha lleva un borde violeta (var(--stencil), de día y de noche).
// Con prefers-reduced-motion: solo un fundido corto. Sin soporte: un fundido del contenido.
import { state } from './state.js';

export function inkTransition(point, update) {
  const root = document.documentElement;
  if (!document.startViewTransition) {
    update();
    const main = document.getElementById('main');
    if (!state.reduced) main?.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });
    return null;
  }
  const x = point?.x ?? innerWidth / 2, y = point?.y ?? innerHeight / 2;
  root.style.setProperty('--vt-x', x + 'px');
  root.style.setProperty('--vt-y', y + 'px');
  root.classList.add(state.reduced ? 'vt-fade' : 'vt-ink');
  let borde = null;
  const t = document.startViewTransition(() => {
    update();
    if (!state.reduced) { borde = document.createElement('div'); borde.className = 'vt-borde'; borde.setAttribute('aria-hidden', 'true'); document.body.append(borde); }
  });
  t.finished.finally(() => { root.classList.remove('vt-ink', 'vt-fade'); borde?.remove(); });
  return t;
}

// punto de un evento de puntero o del centro de un elemento
export function pointOf(e, el) {
  if (e && e.clientX) return { x: e.clientX, y: e.clientY };
  const r = (el || e?.currentTarget)?.getBoundingClientRect?.();
  return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
}
