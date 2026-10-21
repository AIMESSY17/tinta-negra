// Detección de equipos débiles: arranca liviano si hay pocos núcleos o poca memoria,
// y pasa a liviano si los FPS medidos quedan por debajo de 40.
import { state, emit, addTicker } from './state.js';

export function initPerf() {
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 8;
  const saveData = navigator.connection?.saveData;
  const forced = new URLSearchParams(location.search).get('liviano');
  state.lite = forced === '1' || (forced !== '0' && (cores <= 2 || mem <= 2 || (cores <= 4 && mem <= 4) || saveData));
  document.documentElement.classList.toggle('lite', state.lite);
  if (state.lite || forced === '0') return;

  // muestreo de FPS: empieza a los 4 s (después de la carga) y mide ventanas de 2 s
  let t = 0, frames = 0, bad = 0;
  const stop = addTicker(dt => {
    t += dt;
    if (state.time < 4 || document.hidden) return;
    frames++;
    if (t < 2) return;
    const fps = frames / t;
    t = 0; frames = 0;
    bad = fps < 40 ? bad + 1 : 0;
    if (bad >= 2) { setLite(true); stop(); }
    if (state.time > 40) stop();
  });
}

export function setLite(v) {
  if (state.lite === v) return;
  state.lite = v;
  document.documentElement.classList.toggle('lite', v);
  emit('lite', v);
}
