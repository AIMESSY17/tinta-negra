// Transiciones con tinta: View Transitions API con una máscara de mancha que se abre (o se cierra)
// desde el punto del clic. Sin soporte, se ejecuta el cambio tal cual y quedan las animaciones de siempre.
import { state } from './state.js';

export const vtSupported = () => !!document.startViewTransition && !state.reduced;

export function inkTransition(point, update, { close = false } = {}) {
  if (!vtSupported()) { update(); return null; }
  const root = document.documentElement;
  const x = point?.x ?? innerWidth / 2, y = point?.y ?? innerHeight / 2;
  root.style.setProperty('--vt-x', x + 'px');
  root.style.setProperty('--vt-y', y + 'px');
  root.classList.add('vt-ink');
  root.classList.toggle('vt-close', close);
  const t = document.startViewTransition(update);
  t.finished.finally(() => root.classList.remove('vt-ink', 'vt-close'));
  return t;
}

// punto de un evento de puntero o del centro de un elemento
export function pointOf(e, el) {
  if (e && e.clientX) return { x: e.clientX, y: e.clientY };
  const r = (el || e?.currentTarget)?.getBoundingClientRect?.();
  return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
}
