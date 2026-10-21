// Títulos que se "tatúan" letra por letra: cada letra entra con temblor de aguja,
// tinta fresca violeta que se seca a negro.
import { state } from './state.js';

export function tattooize(el, { delay = 0, step = .055 } = {}) {
  if (!el || el.dataset.tattoo) return;
  const text = el.textContent;
  el.dataset.tattoo = '1';
  el.setAttribute('aria-label', text);
  el.textContent = '';
  let i = 0;
  text.split(/(\s+)/).forEach(w => {
    if (/^\s+$/.test(w)) { el.append(' '); return; }
    const word = document.createElement('span');
    word.className = 'tw';
    word.setAttribute('aria-hidden', 'true');
    for (const ch of w) {
      const s = document.createElement('span');
      s.textContent = ch;
      s.style.setProperty('--i', i);
      s.style.setProperty('--dx', ((i * 37) % 5 - 2) * .35 + 'px');
      s.style.setProperty('--dy', ((i * 53) % 5 - 2) * .3 + 'px');
      word.append(s);
      i++;
    }
    el.append(word);
  });
  el.style.setProperty('--td', delay + 's');
  el.style.setProperty('--ts', step + 's');
  el.classList.add('tattoo');
}

// tatúa cuando entra en pantalla
export function tattooOnView(el, opts) {
  tattooize(el, opts);
  if (state.reduced) { el.classList.add('inked'); return; }
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); el.classList.add('inked'); } }, { threshold: .4 });
  io.observe(el);
}
