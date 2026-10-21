// Pistas que se van solas: cada una se muestra hasta que el usuario hace esa acción una vez,
// y no vuelve a aparecer (tampoco en visitas futuras).
const KEY = 'tn-hints';
let done = {};
try { done = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { done = {}; }

export const hintDone = k => !!done[k];

// oculta las pistas ya usadas que estén en el DOM
export function applyHints(root = document) {
  root.querySelectorAll('[data-hint]').forEach(el => el.classList.toggle('hint-gone', !!done[el.dataset.hint]));
}

export function completeHint(k) {
  if (done[k]) return;
  done[k] = 1;
  try { localStorage.setItem(KEY, JSON.stringify(done)); } catch {}
  document.querySelectorAll(`[data-hint="${k}"]`).forEach(el => el.classList.add('hint-gone'));
}
