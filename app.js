/* =========================================================
   TFG · Nodo IoT para el microclima del invernadero
   Presentación: navegación, escalado y piezas interactivas
   ========================================================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = (x, d = 1) => x.toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d });
const C = { mint: '#7fe0b4', amber: '#f6b74a', coral: '#ff7d63', sky: '#86c5ff', lilac: '#b9a3ff', ink: '#eef4f1', muted: '#9fb1ae', dim: '#6d807d', bg: '#0a1720', grid: 'rgba(255,255,255,.10)' };
const onEnter = {};          // id de diapositiva -> función al entrar
const onFit = [];            // funciones a repetir cuando cambia el tamaño
let S = 1;                   // escala actual del lienzo 1600 × 900

function setupCanvas(c) {
  const k = Math.max(1, (window.devicePixelRatio || 1) * S);
  const w = c.clientWidth, h = +c.getAttribute('height');
  c.width = Math.round(w * k); c.height = Math.round(h * k); c.style.height = h + 'px';
  const ctx = c.getContext('2d'); ctx.setTransform(k, 0, 0, k, 0, 0);
  return { ctx, w, h };
}
function seg(el, cb) {
  if (typeof el === 'string') el = $('#' + el);
  $$('button', el).forEach(b => b.addEventListener('click', () => {
    $$('button', el).forEach(x => x.classList.remove('on')); b.classList.add('on'); cb(b.dataset.v, b);
  }));
}

/* ---------------- Escalado: cada diapositiva cabe entera ---------------- */
function fit() {
  const mobile = window.innerWidth < 760;
  document.body.classList.toggle('mobile', mobile);
  S = mobile ? 1 : Math.min(window.innerWidth / 1600, window.innerHeight / 900);
  document.documentElement.style.setProperty('--s', S);
  applyMobileSummaries(mobile);
  onFit.forEach(f => f());
}
window.addEventListener('resize', fit);

/* ---------------- Navegación ---------------- */
const track = $('#track');
const slides = $$('.slide');
let cur = 0;
slides.forEach(s => $$('.rv', s).forEach((el, i) => el.style.setProperty('--i', i)));

const MOBILE_SUMMARIES = {
  estado: [
    ['Nuestro nodo', 'Mide aire, CO₂, luz y suelo; incorpora solar e incertidumbre por dato.'],
    ['Referencia más cercana', 'Săcăleanu et al. coincide en casi todo, pero no publica la incertidumbre.'],
  ],
  hardware: [
    ['ESP32-C6', 'Cerebro del nodo, conectividad Wi-Fi/Thread y bajo consumo.'],
    ['Cuatro capas', 'Cinco sensores, filtrado local, MQTT y panel ThingsBoard.'],
  ],
  adquisicion: [
    ['Un dato / 10 s', 'Cada sensor usa su ritmo y filtro propios.'],
    ['Hacia la nube', 'Media de 5 min filtrada antes de diezmar.'],
  ],
  aliasing: [
    ['Sin filtro', 'La variación rápida puede parecer una señal lenta falsa.'],
    ['Con filtro', 'El FIR reduce el aliasing antes de diezmar.'],
  ],
  freertos: [
    ['Prioridades', 'ADC 5 · I2C/1-Wire 3 · tratamiento 4 · red/publicación 2.'],
    ['Resultado', 'FreeRTOS evita las pérdidas: 500 de 500 muestras.'],
  ],
  incertidumbre: [
    ['Tipo A', 'Dispersion estadística de las muestras.'],
    ['Tipo B', 'Tolerancias del fabricante y referencias de calibración.'],
  ],
  validacion: [
    ['Temperatura', 'Validada con referencias fijas.'],
    ['CO₂', 'Sin contraste independiente; se expresa con cautela.'],
  ],
  disposicion: [
    ['Nodos', 'Dos posiciones fijas para representar microclimas distintas.'],
    ['Cobertura', 'Comprobación en tiempo real desde ThingsBoard.'],
  ],
  topologias: [
    ['Prototipo', 'Wi-Fi y MQTT para el banco de pruebas.'],
    ['Despliegue', 'Thread o LoRaWAN según alcance y consumo.'],
  ],
  plataforma: [
    ['ThingsBoard', 'Visualización, historial y avisos.'],
    ['Node-RED', 'Nodos virtuales con datos meteorológicos externos.'],
  ],
  consumo: [
    ['Actual', '495 mAh/día con deep sleep medido.'],
    ['Diseño', 'Objetivo de 180 mAh/día.'],
  ],
  solar: [
    ['Panel', '3 W dimensionado para Alfaro.'],
    ['Estado', 'Diseño PVGIS; autonomía por ensayar en campo.'],
  ],
  dormir: [
    ['Modo activo', 'Mide, filtra y transmite.'],
    ['Deep sleep', 'Despierta periódicamente y conserva el filtrado.'],
  ],
  limites: [
    ['Lo probado', 'Calibración y consumo en banco de pruebas.'],
    ['Siguiente paso', 'Ensayo continuo en el invernadero.'],
  ],
};

function applyMobileSummaries(mobile) {
  slides.forEach(slide => {
    const summary = slide.querySelector('.mobile-summary');
    if (!mobile) {
      slide.classList.remove('mobile-slide');
      summary?.remove();
      return;
    }
    const items = MOBILE_SUMMARIES[slide.id];
    slide.classList.toggle('mobile-slide', Boolean(items));
    if (!items || summary) return;
    const box = document.createElement('div');
    box.className = 'mobile-summary';
    box.innerHTML = items.map(([title, text]) => `<article><strong>${title}</strong><p>${text}</p></article>`).join('');
    slide.querySelector('.stage')?.appendChild(box);
  });
}

const resetScroll = () => {
  if (document.body.classList.contains('mobile')) return;
  if (document.body.scrollLeft || document.documentElement.scrollLeft || document.body.scrollTop) {
    document.body.scrollLeft = 0;
    document.documentElement.scrollLeft = 0;
    document.body.scrollTop = 0;
  }
};
document.addEventListener('scroll', e => { if (!document.body.classList.contains('mobile') && (e.target === document || e.target === document.body)) resetScroll(); }, true);

function go(i, push = true) {
  resetScroll();
  i = Math.max(0, Math.min(slides.length - 1, i));
  const prevS = slides[cur];
  if (prevS && cur !== i) { prevS.classList.add('leaving'); setTimeout(() => prevS.classList.remove('leaving'), 900); }
  cur = i;
  if (document.body.classList.contains('mobile')) {
    track.style.transform = 'none';
    slides[i].scrollIntoView({ block: 'start', behavior: push ? 'smooth' : 'auto' });
  } else {
    track.style.transform = `translate3d(0,${-i * window.innerHeight}px,0)`;
  }
  slides.forEach((s, k) => { const on = k === i; s.classList.toggle('active', on); s.inert = !on; if (on) s.scrollTop = 0; });
  const s = slides[i];
  $('#prog').style.width = (i / (slides.length - 1) * 100) + '%';
  if ($('#railNum')) $('#railNum').textContent = s.dataset.num || '·';
  $('#prev').disabled = i === 0; $('#next').disabled = i === slides.length - 1;
  if (push) try { history.replaceState(null, '', '#' + s.id); } catch (e) {}
  tip.classList.remove('on');
  if (onEnter[s.id]) setTimeout(onEnter[s.id], 350);
  runCounters(s);
}
$('#prev').onclick = () => go(cur - 1);
$('#next').onclick = () => go(cur + 1);
document.addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g) { e.stopPropagation(); go(+g.dataset.go); } });

document.addEventListener('keydown', e => {
  const t = e.target, tag = t.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  if (['ArrowDown', 'ArrowRight', 'PageDown'].includes(e.key) || (e.key === ' ' && tag !== 'BUTTON' && tag !== 'A')) { e.preventDefault(); go(cur + 1); }
  else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); go(cur - 1); }
  else if (e.key === 'Home') go(0);
  else if (e.key === 'End') go(slides.length - 1);
});

let tx = null, ty = null;
track.addEventListener('touchstart', e => {
  if (document.body.classList.contains('mobile')) { tx = null; ty = null; return; }
  if (e.target.closest('input,canvas')) { tx = null; return; }
  tx = e.touches[0].clientX; ty = e.touches[0].clientY;
}, { passive: true });
track.addEventListener('touchend', e => {
  if (tx === null) return;
  const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
  if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx) * 1.4) go(cur + (dy < 0 ? 1 : -1));
  tx = null;
}, { passive: true });

let wheelLock = false;
window.addEventListener('wheel', e => {
  if (document.body.classList.contains('mobile') || wheelLock || Math.abs(e.deltaY) < 24) return;
  e.preventDefault();
  wheelLock = true;
  go(cur + (e.deltaY > 0 ? 1 : -1));
  setTimeout(() => wheelLock = false, 900);
}, { passive: false });

/* ---------------- Contadores ---------------- */
function runCounters(s) {
  $$('.count', s).forEach(el => {
    const to = +el.dataset.to, dec = +(el.dataset.dec || 0), t0 = performance.now(), D = 1100;
    const step = now => { const p = Math.min(1, Math.max(0, (now - t0 - 300) / D)); el.textContent = fmt(to * (1 - Math.pow(1 - p, 3)), dec); if (p < 1) requestAnimationFrame(step); };
    el.textContent = fmt(0, dec); requestAnimationFrame(step);
  });
}

/* ---------------- Glosario ---------------- */
const GLOS = {
  fir: ['FIR', 'Filtro de respuesta finita: una media ponderada de las últimas muestras, con pesos elegidos para cortar mejor las frecuencias altas.'],
  diezmar: ['Diezmar', 'Quedarse con una de cada M muestras para bajar el ritmo de datos.'],
  aliasing: ['Aliasing', 'Una componente rápida que, al muestrear despacio, aparece como una variación lenta que no existe.'],
  freertos: ['FreeRTOS', 'Sistema operativo de tiempo real: reparte el procesador entre tareas según su prioridad.'],
  gum: ['GUM', 'Guía para la expresión de la incertidumbre de medida: el método de referencia para estimar y combinar incertidumbres.'],
  cierzo: ['Cierzo', 'Viento del noroeste, frío y seco, típico del valle del Ebro.'],
  bochorno: ['Bochorno', 'Viento del sureste, cálido, típico del valle del Ebro.'],
  margen: ['Margen de condensación', 'Diferencia entre la temperatura del aire y su punto de rocío. Cuanto más pequeño, más cerca está el agua de condensar.'],
  rocio: ['Punto de rocío', 'Temperatura a la que, si se enfría, el aire empieza a condensar agua.'],
  hsp: ['HSP', 'Horas de sol pico: la energía solar de un día expresada como horas a 1000 W/m².'],
  pvgis: ['PVGIS', 'Herramienta de la Comisión Europea con datos de radiación solar para cualquier punto de Europa.'],
  lp: ['Núcleo LP', 'Coprocesador de bajo consumo del ESP32-C6: puede seguir trabajando mientras el núcleo principal duerme.'],
};
const tip = $('#tip');
function showTip(el) {
  const g = GLOS[el.dataset.t]; if (!g) return;
  tip.innerHTML = `<b>${g[0]}</b>${g[1]}`; tip.classList.add('on');
  const r = el.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
  const x = Math.min(window.innerWidth - tw - 12, Math.max(12, r.left + r.width / 2 - tw / 2));
  let y = r.top - th - 10; if (y < 10) y = r.bottom + 10;
  tip.style.left = x + 'px'; tip.style.top = y + 'px';
}
$$('.term').forEach(el => {
  el.tabIndex = 0;
  el.addEventListener('mouseenter', () => showTip(el));
  el.addEventListener('focus', () => showTip(el));
  el.addEventListener('mouseleave', () => tip.classList.remove('on'));
  el.addEventListener('blur', () => tip.classList.remove('on'));
  el.addEventListener('click', e => { e.stopPropagation(); showTip(el); });
});
document.addEventListener('click', e => { if (!e.target.closest('.term')) tip.classList.remove('on'); });

/* ---------------- 01 · Hueco del mercado ---------------- */
$$('.gs-pt').forEach(b => {
  const show = () => { $('#gsInfo').textContent = b.dataset.i; };
  b.addEventListener('mouseenter', show); b.addEventListener('focus', show); b.addEventListener('click', show);
});

/* ---------------- 02 · Tarjetas que giran ---------------- */
$$('.flip').forEach(f => f.addEventListener('click', e => { if (!e.target.closest('[data-go]')) f.classList.toggle('on'); }));

/* ---------------- 03 · Matriz del estado de la cuestión ---------------- */
(() => {
  const t = $('#matrix'), d = $('#matrixD');
  const ICON = { y: '<span class="ic y">✓</span>', n: '<span class="ic n">✗</span>', p: '<span class="ic p" title="en diseño"></span>', u: '<span class="ic u">–</span>' };
  const rows = $$('tbody tr', t);
  rows.forEach(tr => {
    const v = tr.dataset.v.split(' ');
    v.forEach(x => { const td = document.createElement('td'); td.className = 'c-' + x; td.innerHTML = ICON[x]; tr.appendChild(td); });
    const cov = v.reduce((a, x) => a + (x === 'y' ? 1 : x === 'p' ? 0.5 : 0), 0);
    const td = document.createElement('td');
    td.innerHTML = `<div class="covbar"><div class="t"><i data-w="${cov / 6 * 100}"></i></div><span>${fmt(cov, cov % 1 ? 1 : 0)}/6</span></div>`;
    tr.appendChild(td);
    tr.addEventListener('click', () => {
      rows.forEach(x => x.classList.remove('pick')); tr.classList.add('pick');
      d.innerHTML = `<b>${tr.cells[0].querySelector('b').textContent}.</b> ${tr.dataset.d}`;
    });
  });
  onEnter.estado = () => $$('.covbar i', t).forEach((i, k) => { i.style.width = '0'; setTimeout(() => i.style.width = i.dataset.w + '%', 150 + k * 90); });
  let sel = null;
  $$('th[data-col]', t).forEach(th => th.addEventListener('click', () => {
    const c = +th.dataset.col; sel = sel === c ? null : c;
    $$('th', t).forEach(x => x.classList.toggle('sel', sel !== null && +x.dataset.col === sel));
    rows.forEach(tr => [...tr.cells].forEach((td, k) => {
      td.classList.remove('hl', 'dim');
      if (sel === null || k === 0 || k === 7) return;
      td.classList.add(k === sel && (td.classList.contains('c-y') || td.classList.contains('c-p')) ? 'hl' : 'dim');
    }));
    if (sel !== null) {
      const name = tr => tr.cells[0].querySelector('b').textContent;
      const yes = rows.filter(tr => tr.cells[sel].classList.contains('c-y')).map(name);
      const des = rows.filter(tr => tr.cells[sel].classList.contains('c-p')).map(name);
      d.innerHTML = `<b>${th.textContent}:</b> ${yes.length ? yes.join(', ') : 'nadie'}${des.length ? ' · en diseño: ' + des.join(', ') : ''}.`;
    } else d.textContent = 'Pulsa una fila o una columna.';
  }));
})();

/* ---------------- 04 · Arquitectura ---------------- */
(() => {
  const D = {
    per: ['Percepción', ['<b>ESP32-C6</b> con cinco sensores.', 'Filtra en el propio nodo: cada sensor con su ritmo y su filtro.', 'Calcula variables derivadas: <b>punto de rocío</b>, <b>VPD</b> y <b>margen de condensación</b>.', 'Cada dato lleva su incertidumbre estimada.']],
    red: ['Red', ['Prototipo: <b>Wi-Fi y MQTT</b>.', 'Despliegue: <b>Thread</b> (malla) o <b>LoRaWAN</b> (largo alcance).', 'Si se cae la red, los mensajes esperan en una cola y se reenvían con su hora.']],
    app: ['Aplicación', ['<b>ThingsBoard</b>: panel del plano al detalle de cada nodo y aviso de condensación.', '<b>Node-RED</b>: simula dos nodos más con datos de Open-Meteo y CAMS.']],
  };
  const show = k => { $('#archD').innerHTML = `<div class="lab">Capa</div><h3>${D[k][0]}</h3><ul>${D[k][1].map(x => `<li>${x}</li>`).join('')}</ul>`; };
  $$('.layer').forEach(b => b.addEventListener('click', () => { $$('.layer').forEach(x => x.classList.remove('on')); b.classList.add('on'); show(b.dataset.k); }));
  show('per');
})();

/* ---------------- 05 · Hardware ---------------- */
(() => {
  const S5 = {
    esp: { n: 'ESP32-C6', c: '#dfe7e4', bus: 'all', what: 'El cerebro del nodo: mide, filtra, calcula la incertidumbre y envía.', tiles: [['Radio', 'Wi-Fi y 802.15.4 (Thread)'], ['Núcleos', 'Principal + bajo consumo (LP)'], ['Bus I2C', 'SDA GPIO6 · SCL GPIO5'], ['Precio', '6,49 €']] },
    sht: { n: 'SHT31-D', c: C.mint, bus: 'i2c', sub: 'T y HR del aire', what: 'Temperatura y humedad relativa del aire.', tiles: [['Conexión', 'I2C'], ['Muestreo', '1 Hz'], ['Filtro', 'Media de 10'], ['Precio', '3,19 €']], N: 10, pulse: 2 },
    scd: { n: 'SCD30', c: C.coral, bus: 'i2c', sub: 'CO₂ · NDIR · 5 V', what: 'CO₂ por infrarrojo no dispersivo (NDIR). Es el que más consume: alrededor del 90 % del total.', tiles: [['Conexión', 'I2C, alimentado a 5 V'], ['Muestreo', '0,5 Hz'], ['Filtro', 'FIR de 27 coeficientes'], ['Precio', '16,61 €']], N: 5, pulse: 3 },
    as: { n: 'AS7341', c: C.lilac, bus: 'i2c', sub: 'Espectro de luz', what: 'Espectro de la luz en varios canales. Su lectura es lenta: unos 0,6 s.', tiles: [['Conexión', 'I2C'], ['Muestreo', '0,2 Hz'], ['Filtro', 'Media de 2'], ['Precio', '9,03 €']], N: 2, pulse: 4 },
    ds: { n: 'DS18B20', c: C.amber, bus: 'ow', sub: 'T del sustrato', what: 'Temperatura del sustrato, con sonda.', tiles: [['Conexión', '1-Wire · GPIO4'], ['Muestreo', '0,5 Hz'], ['Filtro', 'Media de 5'], ['Precio', '1,27 €']], N: 5, pulse: 3 },
    hw: { n: 'HW-390', c: C.sky, bus: 'adc', sub: 'Humedad del suelo', what: 'Humedad del suelo, capacitivo. Lleva un filtro RC antes del ADC.', tiles: [['Conexión', 'ADC · GPIO1'], ['Muestreo', '50 Hz'], ['Filtro', 'RC (2 × 10 kΩ, 470 nF, unos 17 Hz) + media de 500'], ['Precio', 'Venía en un kit']], N: 500, pulse: 0.8 },
  };
  const ICON = {
    sht: '<path d="M-4 -13 v15 a7 7 0 1 0 8 0 v-15 a4 4 0 0 0 -8 0z" fill="none" stroke="#0a1720" stroke-width="2.6"/><circle cy="6" r="3.5" fill="#0a1720"/><path d="M11 -9 q5 7 0 10 q-5 -3 0 -10z" fill="#0a1720"/>',
    scd: '<text y="5" text-anchor="middle" font-size="13" font-weight="800" fill="#0a1720" font-family="Space Grotesk">CO₂</text>',
    as: '<g fill="#0a1720"><rect x="-13" y="-2" width="4" height="10" rx="1"/><rect x="-7" y="-9" width="4" height="17" rx="1"/><rect x="-1" y="-13" width="4" height="21" rx="1"/><rect x="5" y="-6" width="4" height="14" rx="1"/><rect x="11" y="0" width="4" height="8" rx="1"/></g>',
    ds: '<g fill="none" stroke="#0a1720" stroke-width="2.6" stroke-linecap="round"><path d="M-12 -10 q8 0 8 8"/><rect x="-4" y="-2" width="9" height="16" rx="4" fill="#0a1720"/></g>',
    hw: '<g stroke="#0a1720" stroke-width="3.2" stroke-linecap="round" fill="none"><path d="M-8 -12 h16"/><path d="M-6 -12 v20 l3 5"/><path d="M6 -12 v20 l-3 5"/></g>',
  };
  const POS = { sht: [30, 14], scd: [325, 14], as: [620, 14], ds: [30, 418], hw: [600, 418] };
  const W = 235, H = 84;
  const WIRE = {
    sht: [`M${30 + 95} ${14 + H} V120`, `M${30 + 135} ${14 + H} V136`],
    scd: [`M${325 + 95} ${14 + H} V120`, `M${325 + 135} ${14 + H} V136`],
    as: [`M${620 + 95} ${14 + H} V120`, `M${620 + 135} ${14 + H} V136`],
    ds: [`M152 418 V300 H330`],
    hw: [`M760 418 V300 H730 l-5 -8 l-10 16 l-10 -16 l-10 16 l-5 -8 H550`],
  };
  const PULSE = { sht: 'M125 98 V120 H380 V180', scd: 'M420 98 V120 H380 V180', as: 'M715 98 V120 H380 V180', ds: 'M152 418 V300 H330', hw: 'M760 418 V300 H550' };
  let h = '';
  // bus I2C
  h += `<g class="sg" data-k="bus" data-bus="i2c" style="--glow:${C.mint}">
    <path class="wire" d="M20 120 H860" stroke="${C.mint}" opacity=".75"/><path class="wire" d="M20 136 H860" stroke="${C.sky}" opacity=".75"/>
    <text x="860" y="113" text-anchor="end" font-size="12" fill="${C.mint}" font-family="JetBrains Mono">SDA</text><text x="860" y="152" text-anchor="end" font-size="12" fill="${C.sky}" font-family="JetBrains Mono">SCL</text>
    <path class="wire" d="M380 120 V180" stroke="${C.mint}"/><path class="wire" d="M410 136 V180" stroke="${C.sky}"/>
    <text x="372" y="166" text-anchor="end" font-size="13" fill="${C.mint}" font-family="JetBrains Mono">GPIO6</text><text x="418" y="166" font-size="13" fill="${C.sky}" font-family="JetBrains Mono">GPIO5</text></g>`;
  // placa
  h += `<g class="sg" data-k="esp" data-bus="all" style="--glow:#dfe7e4">
    <rect class="mod" x="330" y="180" width="220" height="225" rx="16" fill="#13262e" stroke="rgba(255,255,255,.35)" stroke-width="2"/>
    <path d="M352 200 h18 v12 h12 v-12 h12 v12 h12 v-12 h12" fill="none" stroke="#c9a24a" stroke-width="3"/>
    ${[0, 1, 2, 3, 4, 5, 6].map(i => `<rect x="337" y="${232 + i * 22}" width="9" height="9" rx="2" fill="#c9a24a" opacity=".8"/><rect x="534" y="${232 + i * 22}" width="9" height="9" rx="2" fill="#c9a24a" opacity=".8"/>`).join('')}
    <rect x="380" y="240" width="120" height="110" rx="10" fill="#0b151a" stroke="rgba(255,255,255,.25)"/>
    <text x="440" y="292" text-anchor="middle" font-size="19" font-weight="700" fill="#fff" font-family="Space Grotesk">ESP32-C6</text>
    <text x="440" y="314" text-anchor="middle" font-size="12" fill="${C.muted}" font-family="JetBrains Mono">RISC-V · Wi-Fi · 802.15.4</text>
    <rect x="418" y="392" width="44" height="14" rx="5" fill="#8a9a97"/></g>`;
  // sensores
  Object.entries(POS).forEach(([k, [x, y]]) => {
    const s = S5[k];
    h += `<g class="sg" data-k="${k}" data-bus="${s.bus}" tabindex="0" role="button" aria-label="${s.n}" style="--glow:${s.c}">
      ${WIRE[k].map(d => `<path class="wire" d="${d}" stroke="${s.c}"/>`).join('')}
      ${k === 'hw' ? `<path d="M670 300 V318 M658 318 H682 M658 326 H682 M670 326 V340 M660 340 H680 M664 345 H676" stroke="${s.c}" stroke-width="3" fill="none"/><text x="600" y="374" font-size="12" fill="${s.c}" font-family="JetBrains Mono">RC ≈ 17 Hz</text><text x="556" y="290" font-size="13" fill="${s.c}" font-family="JetBrains Mono">GPIO1 · ADC</text>` : ''}
      ${k === 'ds' ? `<text x="170" y="290" font-size="13" fill="${s.c}" font-family="JetBrains Mono">GPIO4 · 1-Wire</text>` : ''}
      <rect class="mod" x="${x}" y="${y}" width="${W}" height="${H}" rx="16" fill="${s.c}" fill-opacity=".14" stroke="${s.c}" stroke-width="2"/>
      <circle cx="${x + 42}" cy="${y + H / 2}" r="27" fill="${s.c}"/>
      <g transform="translate(${x + 42} ${y + H / 2})">${ICON[k]}</g>
      <text x="${x + 82}" y="${y + 38}" font-size="21" font-weight="700" fill="#fff" font-family="Space Grotesk">${s.n}</text>
      <text x="${x + 82}" y="${y + 62}" font-size="14" fill="${C.muted}" font-family="Space Grotesk">${s.sub}</text>
      ${(k === 'hw' ? [0, .27, .54] : [0]).map(d => `<circle r="6" fill="${s.c}" style="filter:drop-shadow(0 0 6px ${s.c})"><animateMotion dur="${s.pulse}s" begin="${d}s" repeatCount="indefinite" path="${PULSE[k]}"/></circle>`).join('')}
    </g>`;
  });
  const board = $('#board');
  if (board) board.innerHTML = h;

  const cost = [['ESP32-C6', 6.49, '#dfe7e4', 'esp'], ['SHT31-D', 3.19, C.mint, 'sht'], ['SCD30', 16.61, C.coral, 'scd'], ['AS7341', 9.03, C.lilac, 'as'], ['DS18B20', 1.27, C.amber, 'ds']];
  const costHtml = `<div><div class="lab" style="margin-bottom:6px">Coste del prototipo · 36,59 €</div><div class="costbar">${cost.map(([n, v, c, k]) => `<div style="flex:${v};background:${c}" title="${n}: ${fmt(v, 2)} €" data-k="${k}">${v > 5 ? fmt(v, 2) + ' €' : ''}</div>`).join('')}</div><div class="tiny" style="margin-top:6px">Nodo completo con panel, batería y caja: de 85 a 128 € de material.</div></div>`;

  function show(k) {
    const s = S5[k];
    $$('#board .sg').forEach(g => g.classList.toggle('on', g.dataset.k === k));
    let ticker = '';
    if (s.N) {
      const n = Math.min(s.N, 50), per = 10 / n;
      ticker = `<div class="ticker" style="--tc:${s.c}"><div class="cap">Ventana de 10 s, en tiempo real${s.N > 50 ? ' (cada punto = 10 muestras)' : ''}:</div>
        <div class="row">${Array.from({ length: n }, (_, i) => `<i style="animation-delay:${(i * per).toFixed(2)}s"></i>`).join('')}</div>
        <div class="cap"><b style="color:${s.c}">${s.N} muestras</b> → filtro → <b>1 dato cada 10 s</b></div></div>`;
    }
    $('#hwD').innerHTML = `<div class="lab" style="color:${s.c};margin:0">${k === 'esp' ? 'Microcontrolador' : 'Sensor'}</div><h3 style="color:${s.c}">${s.n}</h3><p class="what">${s.what}</p>
      <div class="tiles">${s.tiles.map(([a, b]) => `<div>${a}<b>${b}</b></div>`).join('')}</div>${ticker}${costHtml}`;
    $$('#hwD .costbar div').forEach(d => d.addEventListener('click', () => show(d.dataset.k)));
  }
  show('scd');
  if (!board) return;

  $$('#board .sg').forEach(g => {
    if (g.dataset.k === 'bus') return;
    g.addEventListener('click', () => show(g.dataset.k));
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(g.dataset.k); } });
  });
  seg('busSel', v => {
    $$('#board .sg').forEach(g => g.classList.toggle('off', v !== 'all' && g.dataset.bus !== v && g.dataset.k !== 'esp'));
    show({ all: 'esp', i2c: 'sht', ow: 'ds', adc: 'hw' }[v]);
  });
  seg('modelMode', v => {
    const model = v === 'model';
    const wiring = v === 'wiring';
    const schematic = v === 'schematic';
    $('#board').classList.toggle('off', !schematic);
    $('#hardwareRef').classList.toggle('on', wiring);
    $('#proto3d').classList.toggle('on', model);
    $('#busSel').classList.toggle('hidden', !schematic);
    $('#modelHint').style.display = model ? 'inline' : 'none';
  });
  const proto = $('#proto3d'), assembly = $('#protoAssembly');
  let rx = 24, rz = -5, dragging = false, px = 0, py = 0;
  proto.addEventListener('pointerdown', e => {
    dragging = true; px = e.clientX; py = e.clientY;
    proto.setPointerCapture(e.pointerId); proto.classList.add('dragging');
  });
  proto.addEventListener('pointermove', e => {
    if (!dragging) return;
    rz += (e.clientX - px) * .35; rx = Math.max(8, Math.min(55, rx - (e.clientY - py) * .25));
    px = e.clientX; py = e.clientY;
    assembly.style.transform = `rotateX(${rx}deg) rotateZ(${rz}deg)`;
  });
  proto.addEventListener('pointerup', () => { dragging = false; proto.classList.remove('dragging'); });
  proto.addEventListener('pointercancel', () => { dragging = false; proto.classList.remove('dragging'); });
  proto.addEventListener('dblclick', () => {
    rx = 24; rz = -5;
    assembly.style.transform = `rotateX(${rx}deg) rotateZ(${rz}deg)`;
  });
})();

/* ---------------- 06 · Cadena de adquisición ---------------- */
(() => {
  const P = [
    { n: 'SHT31-D', r: '1 Hz', T: 1, N: 10, f: 'Media de 10', s: 'Temperatura y humedad del aire.' },
    { n: 'SCD30', r: '0,5 Hz', T: 2, N: 5, f: 'FIR de 27 coeficientes', s: 'Con 5 muestras, una media no basta.' },
    { n: 'DS18B20', r: '0,5 Hz', T: 2, N: 5, f: 'Media de 5', s: 'Temperatura del sustrato.' },
    { n: 'AS7341', r: '0,2 Hz', T: 5, N: 2, f: 'Media de 2', s: 'Lectura lenta, de unos 0,6 s.' },
    { n: 'HW-390', r: '50 Hz', T: 0.02, N: 500, f: 'RC + media de 500', s: 'El RC de unos 17 Hz limpia antes del ADC.' },
  ];
  const draw = i => {
    const p = P[i], nd = Math.min(p.N, 40);
    const dots = Array.from({ length: nd }, (_, k) => `<i style="animation-delay:${(k / nd).toFixed(2)}s"></i>`).join('');
    const fd = '<span class="flowdot"></span>';
    $('#pipe').innerHTML = `
      <div class="pstep hlt"><span class="k">Sensor</span><span class="v">${p.n}</span><span class="s">Muestrea a ${p.r}</span><div class="dots">${dots}</div>${fd}</div>
      <div class="pstep"><span class="k">Filtro</span><span class="v">${p.f}</span><span class="s">${p.s}</span>${fd}</div>
      <div class="pstep"><span class="k">Un dato cada</span><span class="v">10 s</span><span class="eq">${p.N} × ${fmt(p.T, p.T < 1 ? 2 : 0)} s = 10 s</span>${fd}</div>
      <div class="pstep"><span class="k">Hacia la nube</span><span class="v">Media de 5 min</span><span class="s">Filtrada antes de diezmar.</span>${fd}</div>
      <div class="pstep"><span class="k">Plataforma</span><span class="v">ThingsBoard</span><span class="s">Dentro del cupo del plan gratuito.</span></div>`;
  };
  seg('pipeSel', v => draw(+v)); draw(0);
})();

/* ---------------- 06·b · Aliasing ---------------- */
(() => {
  const FS = 10, T = 24, A_SLOW = 1, F_SLOW = 0.06, A_FAST = 0.6;
  let f = 1.9, M = 10, filt = 'media';
  const c = $('#aC');
  const sig = t => A_SLOW * Math.sin(2 * Math.PI * F_SLOW * t) + A_FAST * Math.sin(2 * Math.PI * f * t + 0.7);
  function firCoefs(M) {
    const L = 4 * M + 1, fc = 0.8 * 0.5 / M, h = [], mid = (L - 1) / 2; let s = 0;
    for (let n = 0; n < L; n++) { const k = n - mid; const sinc = k === 0 ? 2 * fc : Math.sin(2 * Math.PI * fc * k) / (Math.PI * k); const w = 0.42 - 0.5 * Math.cos(2 * Math.PI * n / (L - 1)) + 0.08 * Math.cos(4 * Math.PI * n / (L - 1)); h.push(sinc * w); s += sinc * w; }
    return h.map(x => x / s);
  }
  const coefs = () => filt === 'media' ? Array(M).fill(1 / M) : firCoefs(M);
  function gain(h, fr) { const mid = (h.length - 1) / 2; let re = 0, im = 0; h.forEach((v, n) => { re += v * Math.cos(2 * Math.PI * fr * (n - mid) / FS); im += v * Math.sin(2 * Math.PI * fr * (n - mid) / FS); }); return Math.hypot(re, im); }
  function draw() {
    const { ctx, w, h } = setupCanvas(c); const pad = 34;
    const X = t => pad + (t / T) * (w - pad - 14), Y = v => (h - 20) / 2 - v * ((h - 20) / 2 - 20) / 1.7;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pad, Y(0)); ctx.lineTo(w - 14, Y(0)); ctx.stroke();
    ctx.fillStyle = C.muted; ctx.font = '12px JetBrains Mono'; for (let t = 0; t <= T; t += 4) ctx.fillText(t + ' s', X(t) - 8, h - 8);
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.2; ctx.beginPath();
    for (let i = 0; i <= T * FS; i++) { const t = i / FS; i ? ctx.lineTo(X(t), Y(sig(t))) : ctx.moveTo(X(t), Y(sig(t))); } ctx.stroke();
    ctx.strokeStyle = C.mint; ctx.lineWidth = 2.5; ctx.setLineDash([7, 5]); ctx.beginPath();
    for (let i = 0; i <= 400; i++) { const t = i / 400 * T, v = A_SLOW * Math.sin(2 * Math.PI * F_SLOW * t); i ? ctx.lineTo(X(t), Y(v)) : ctx.moveTo(X(t), Y(v)); } ctx.stroke(); ctx.setLineDash([]);
    const hc = coefs(), mid = (hc.length - 1) / 2, unf = [], fil = [];
    for (let i = 0; i <= T * FS; i += M) { const t = i / FS; unf.push([t, sig(t)]); let a = 0; hc.forEach((v, n) => { a += v * sig((i + (n - mid)) / FS); }); fil.push([t, a]); }
    const line = (pts, col) => { ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1]))); ctx.stroke(); ctx.fillStyle = col; pts.forEach(p => { ctx.beginPath(); ctx.arc(X(p[0]), Y(p[1]), 3.6, 0, 7); ctx.fill(); }); };
    line(unf, C.coral); line(fil, C.sky);
    const fo = FS / M, ny = fo / 2, clean = x => fmt(x, 2).replace(/,?0+$/, '');
    $('#aNy').textContent = clean(fo) + ' Hz · ' + clean(ny) + ' Hz';
    const fa = Math.abs(f - Math.round(f / fo) * fo), aliased = f > ny + 1e-9;
    $('#aAl').textContent = aliased ? (fa < 1e-6 ? '0 Hz (deriva fija)' : fmt(fa, 2) + ' Hz (' + fmt(1 / fa, 1) + ' s)') : 'ella misma: cabe';
    const g = gain(hc, f);
    $('#aAmp').textContent = fmt(A_FAST, 2) + ' → ' + fmt(A_FAST * g, 2);
    const v = $('#aV');
    if (!aliased) { v.className = 'verdict ok'; v.textContent = 'La componente rápida está por debajo del límite de Nyquist: no hay aliasing.'; }
    else if (g < 0.1) { v.className = 'verdict ok'; v.textContent = 'Sin filtrar aparece una variación lenta que no existe (coral). Filtrando antes de diezmar casi desaparece (azul).'; }
    else { v.className = 'verdict warn'; v.textContent = 'Sin filtrar aparece una variación falsa. Con este filtro aún se cuela un ' + Math.round(g * 100) + ' %' + (filt === 'media' ? ': prueba el FIR selectivo.' : '.'); }
  }
  $('#aFr').addEventListener('input', e => { f = +e.target.value; $('#aF').textContent = fmt(f, 1) + ' Hz'; draw(); });
  $('#aMr').addEventListener('input', e => { M = +e.target.value; $('#aM').textContent = M; draw(); });
  seg('aFilt', v => { filt = v; draw(); });
  onFit.push(draw); onEnter.aliasing = draw;
})();

/* ---------------- 07 · FreeRTOS ---------------- */
(() => {
  $$('.rt-priority-row').forEach(row => row.addEventListener('click', () => {
    $$('.rt-priority-row').forEach(x => x.classList.remove('on'));
    row.classList.add('on');
  }));
  $$('.rt-step').forEach(step => step.addEventListener('click', () => {
    $$('.rt-step').forEach(x => x.classList.remove('on'));
    step.classList.add('on');
  }));
  $('#rtToggle').addEventListener('click', e => {
    const solved = e.currentTarget.getAttribute('aria-pressed') !== 'true';
    e.currentTarget.setAttribute('aria-pressed', String(solved));
    $('#rtMetric').innerHTML = solved ? '500<small>/500</small>' : '431<small>/500</small>';
    $('#rtMetric').style.color = solved ? 'var(--mint)' : 'var(--coral)';
    $('#rtResultText').textContent = solved
      ? 'FreeRTOS asignó prioridad 5 al ADC. El AS7341 dejó de expulsar las muestras: 0 % de pérdidas.'
      : '13,9 % de muestras perdidas con el AS7341 bloqueando el planificador cooperativo.';
  });
})();

/* ---------------- 08 · Incertidumbre ---------------- */
(() => {
  const T = {
    a: '<b>Tipo A:</b> la dispersión de las muestras dentro de la ventana. Si el valor baila mucho en esos 10 s, la U crece.',
    b: '<b>Tipo B:</b> la tolerancia del fabricante, de la hoja de datos. En el CO₂, además, la referencia de recalibración de ±40 ppm.',
    k: '<b>Factor de cobertura:</b> <span class="mono">k = 1,65</span> si una contribución rectangular aporta más del 90 % de u<sub>c</sub>²; si no, <span class="mono">k = 2</span>.',
  };
  const p = $('#uTabTxt'); seg($('#uTabs .seg'), v => { p.innerHTML = T[v]; }); p.innerHTML = T.a;
  const s = $('#uS'), r = $('#uUr'), V = 89, TH = 90, X = v => 40 + (v - 84) / (96 - 84) * 520;
  function draw() {
    const U = +r.value; $('#uU').textContent = '± ' + fmt(U, 1) + ' %';
    const lo = V - U, hi = V + U, cross = hi > TH;
    let g = ''; for (let v = 84; v <= 96; v++) g += `<line x1="${X(v)}" y1="80" x2="${X(v)}" y2="86" stroke="rgba(255,255,255,.4)"/><text x="${X(v)}" y="101" font-size="11" text-anchor="middle" fill="${C.muted}" font-family="JetBrains Mono">${v}</text>`;
    s.innerHTML = `<line x1="40" y1="80" x2="560" y2="80" stroke="rgba(255,255,255,.3)"/>${g}
      <rect x="${X(TH)}" y="10" width="${560 - X(TH)}" height="70" fill="rgba(255,125,99,.15)"/>
      <line x1="${X(TH)}" y1="6" x2="${X(TH)}" y2="86" stroke="${C.coral}" stroke-width="2" stroke-dasharray="4 3"/>
      <text x="${X(TH) + 6}" y="24" font-size="12" fill="${C.coral}" font-family="Space Grotesk" font-weight="600">aviso: 90 %</text>
      <rect x="${X(Math.max(84, lo))}" y="46" width="${Math.max(2, X(Math.min(96, hi)) - X(Math.max(84, lo)))}" height="16" rx="8" fill="${cross ? C.amber : C.mint}" opacity=".9"/>
      <circle cx="${X(V)}" cy="54" r="7" fill="#fff"/>
      <text x="${X(V)}" y="38" font-size="13" text-anchor="middle" fill="#fff" font-family="JetBrains Mono" font-weight="600">89 ± ${fmt(U, 1)}</text>
      <text x="300" y="117" font-size="11" text-anchor="middle" fill="${C.dim}" font-family="Space Grotesk">humedad relativa (%)</text>`;
    const v = $('#uV');
    if (!cross) { v.className = 'verdict ok'; v.textContent = 'Todo el intervalo queda por debajo del 90 %: el 89 % es un «no» claro.'; }
    else { v.className = 'verdict warn'; v.textContent = 'El intervalo llega al ' + fmt(hi, 1) + ' %: no se puede descartar que la humedad real ya pase del umbral.'; }
  }
  r.addEventListener('input', draw); draw();
})();

/* ---------------- 09 · Validación ---------------- */
(() => {
  const D = {
    t: ['+2,8 <small>°C</small>', 'El SCD30 marca 2,8 °C más que el SHT31-D. ¿Mide mal? Cambia a punto de rocío.'],
    td: ['0,08 <small>°C</small>', 'Los puntos de rocío coinciden: 12,52 frente a 12,60 °C. El aire es el mismo: el SCD30 se calienta a sí mismo. Es <b>autocalentamiento</b>, no error de medida.'],
  };
  const show = k => { $('#vDiff').innerHTML = D[k][0]; $('#vTxt').innerHTML = D[k][1]; };
  seg('vSeg', show); show('t');
})();

/* ---------------- 10 · Plano del túnel ---------------- */
(() => {
  const s = $('#map'), K = 10, X = x => 40 + x * K, Y = y => 26 + y * K;
  const info = {
    n1: ['Nodo 1 · centro (18; 3) m', 'Es el nodo real, el prototipo, y el que lleva los sensores de suelo (DS18B20 y HW-390). Está en la posición central del reparto uniforme, lejos de las puertas: representa la zona media del cultivo.'],
    n2: ['Nodo 2 · puerta norte (4; 6) m', 'En el reparto uniforme estaría a 6 m. Se acerca a la puerta norte porque por ahí entra el cierzo: es donde antes cambia el aire.'],
    n3: ['Nodo 3 · puerta sur (32; 6) m', 'En el reparto uniforme estaría a 30 m. Se acerca a la puerta sur porque por ahí entra el bochorno: la otra zona donde el aire cambia antes.'],
  };
  let h = `<defs><marker id="ab" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0L8 4L0 8z" fill="${C.sky}"/></marker><marker id="ar" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0L8 4L0 8z" fill="${C.coral}"/></marker></defs>`;
  h += `<rect x="${X(0)}" y="${Y(0)}" width="${36 * K}" height="${9 * K}" rx="4" fill="rgba(127,224,180,.06)" stroke="${C.mint}" stroke-width="1.6"/>`;
  h += `<line x1="${X(0)}" y1="${Y(3)}" x2="${X(0)}" y2="${Y(6)}" stroke="#0b1a22" stroke-width="4"/><line x1="${X(36)}" y1="${Y(3)}" x2="${X(36)}" y2="${Y(6)}" stroke="#0b1a22" stroke-width="4"/>`;
  h += `<text x="${X(0)}" y="${Y(0) - 8}" font-size="10" fill="${C.sky}" font-family="Space Grotesk" font-weight="600">Puerta norte · cierzo</text>`;
  h += `<text x="${X(36)}" y="${Y(0) - 8}" font-size="10" fill="${C.coral}" text-anchor="end" font-family="Space Grotesk" font-weight="600">bochorno · Puerta sur</text>`;
  for (let y = 1.5; y < 9; y += 1.5) h += `<line x1="${X(1)}" y1="${Y(y)}" x2="${X(35)}" y2="${Y(y)}" stroke="rgba(127,224,180,.2)" stroke-width="2.5" stroke-linecap="round"/>`;
  [6, 18, 30].forEach(x => h += `<line x1="${X(x)}" y1="${Y(0)}" x2="${X(x)}" y2="${Y(9)}" stroke="${C.amber}" stroke-dasharray="2 3" stroke-width=".8"/><text x="${X(x)}" y="${Y(9) + 12}" font-size="9" text-anchor="middle" fill="${C.amber}" font-family="JetBrains Mono">${x} m</text>`);
  h += `<rect x="${X(0)}" y="${Y(0)}" width="${36 * K}" height="${0.8 * K}" fill="rgba(255,255,255,.05)" stroke="rgba(255,255,255,.3)" stroke-dasharray="2 3" stroke-width=".7"/>`;
  h += `<path d="M${X(-3.2)} ${Y(4.5)} h20" stroke="${C.sky}" stroke-width="2.5" marker-end="url(#ab)"/><path d="M${X(39.2)} ${Y(4.5)} h-20" stroke="${C.coral}" stroke-width="2.5" marker-end="url(#ar)"/>`;
  [['n1', 18, 3, '1'], ['n2', 4, 6, '2'], ['n3', 32, 6, '3']].forEach(([id, x, y, l]) => {
    h += `<g class="node" data-id="${id}" tabindex="0" role="button" aria-label="${info[id][0]}"><circle cx="${X(x)}" cy="${Y(y)}" r="10" fill="${C.mint}" stroke="#0a1720" stroke-width="2"/><text x="${X(x)}" y="${Y(y) + 4}" font-size="11" font-weight="700" fill="#0a1720" text-anchor="middle" font-family="Space Grotesk" pointer-events="none">${l}</text></g>`;
  });
  s.innerHTML = h;
  const pick = id => {
    $$('.node circle', s).forEach(c => c.setAttribute('fill', C.mint)); $(`[data-id="${id}"] circle`, s).setAttribute('fill', C.amber);
    $('#mapInfo').innerHTML = `<div class="lab">Por qué está ahí</div><h3>${info[id][0]}</h3><p>${info[id][1]}</p>`;
  };
  $$('.node', s).forEach(g => { g.addEventListener('click', () => pick(g.dataset.id)); g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(g.dataset.id); } }); });
})();

/* ---------------- 11 · Topologías ---------------- */
(() => {
  const mv = (path, col, dur, delay = 0) => `<circle r="5" fill="${col}" style="filter:drop-shadow(0 0 5px ${col})"><animateMotion dur="${dur}s" begin="${delay}s" repeatCount="indefinite" path="${path}"/></circle>`;
  const node = (x, y, r = 12) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#0a1720" stroke="${C.mint}" stroke-width="3"/>`;
  const lbl = (x, y, t, col = '#0a1720', fs = 12) => `<text x="${x}" y="${y}" fill="${col}" text-anchor="middle" font-size="${fs}" font-weight="700" font-family="Space Grotesk">${t}</text>`;
  const T = [
    { t: 'Estrella con Wi-Fi', tag: 'El prototipo', p: 'Cada nodo habla directamente con el punto de acceso. No hace falta nada más que el router.',
      svg: () => { const P = [[60, 40], [340, 40], [60, 200], [340, 200]]; let h = ''; P.forEach(([x, y]) => h += `<line x1="200" y1="120" x2="${x}" y2="${y}" stroke="${C.sky}" stroke-width="2" opacity=".7"/>`); P.forEach(([x, y], i) => h += mv(`M${x} ${y} L200 120`, C.amber, 1.8, i * .4)); h += `<rect x="174" y="98" width="52" height="44" rx="10" fill="${C.sky}"/>` + lbl(200, 125, 'AP', '#0a1720', 14); P.forEach(([x, y]) => h += node(x, y)); return h; } },
    { t: 'Malla con Thread', tag: 'Recomendada para Alfaro', p: 'Los nodos se pasan los mensajes entre ellos hasta el router de borde, en la caseta, a menos de 40 m. La radio 802.15.4 ya está en el ESP32-C6.',
      svg: () => { const N = [[50, 70], [150, 50], [250, 80], [100, 180], [210, 190]]; const E = [[0, 1], [1, 2], [0, 3], [1, 3], [1, 4], [2, 4], [3, 4]]; let h = ''; E.forEach(([a, b]) => h += `<line x1="${N[a][0]}" y1="${N[a][1]}" x2="${N[b][0]}" y2="${N[b][1]}" stroke="${C.mint}" stroke-width="2" opacity=".6"/>`); h += `<line x1="250" y1="80" x2="345" y2="130" stroke="${C.mint}" stroke-width="2" stroke-dasharray="5 4"/><line x1="210" y1="190" x2="345" y2="130" stroke="${C.mint}" stroke-width="2" stroke-dasharray="5 4"/>`; h += mv('M50 70 L150 50 L250 80 L345 130', C.amber, 3); h += mv('M100 180 L210 190 L345 130', C.amber, 2.4, .8); h += `<rect x="320" y="107" width="54" height="46" rx="10" fill="${C.amber}"/>` + lbl(347, 135, 'BR', '#0a1720', 14) + lbl(347, 172, 'caseta', C.muted, 11); N.forEach(([x, y]) => h += node(x, y)); return h; } },
    { t: 'Estrella de estrellas · LoRaWAN', tag: 'Explotaciones grandes', p: 'Cada nodo habla con una o varias pasarelas, y las pasarelas con el servidor de red. El ESP32-C6 no tiene radio LoRa: haría falta un módulo aparte.',
      svg: () => { const G = [[110, 120], [290, 120]]; const N = [[40, 210], [110, 220], [180, 210], [220, 210], [290, 220], [360, 210]]; let h = ''; G.forEach(([x, y]) => h += `<line x1="200" y1="30" x2="${x}" y2="${y}" stroke="${C.amber}" stroke-width="2.5" opacity=".8"/>`); N.forEach(([x, y], i) => { const g = G[i < 3 ? 0 : 1]; h += `<line x1="${g[0]}" y1="${g[1]}" x2="${x}" y2="${y}" stroke="${C.sky}" stroke-width="1.6" opacity=".6"/>`; h += mv(`M${x} ${y} L${g[0]} ${g[1]} L200 30`, C.sky, 2.6, i * .35); }); h += `<line x1="110" y1="120" x2="220" y2="210" stroke="${C.sky}" stroke-width="1.2" stroke-dasharray="3 3" opacity=".6"/>`; h += `<rect x="164" y="10" width="72" height="38" rx="10" fill="#dfe7e4"/>` + lbl(200, 34, 'servidor'); G.forEach(([x, y]) => h += `<rect x="${x - 26}" y="${y - 17}" width="52" height="34" rx="8" fill="${C.amber}"/>` + lbl(x, y + 4, 'pasarela', '#0a1720', 10)); N.forEach(([x, y]) => h += node(x, y, 9)); return h; } },
  ];
  const show = i => { const t = T[i]; $('#topoSvg').innerHTML = `<svg viewBox="0 0 400 240">${t.svg()}</svg>`; $('#topoTxt').innerHTML = `<div class="lab">${t.tag}</div><h3>${t.t}</h3><p>${t.p}</p>`; };
  seg('topoSel', v => show(+v)); show(1);
})();

/* ---------------- 12 · Condensación ---------------- */
(() => {
  const a = 17.62, b = 243.12;
  function upd() {
    const T = +$('#cTr').value, H = +$('#cHr').value;
    $('#cT').textContent = fmt(T, 1) + ' °C'; $('#cH').textContent = H + ' %';
    const g = Math.log(H / 100) + a * T / (b + T), Td = b * g / (a - g), m = T - Td;
    $('#cTd').textContent = fmt(Td, 1) + ' °C'; $('#cM').textContent = fmt(m, 1) + ' °C';
    const v = $('#cV');
    if (m < 2) { v.className = 'verdict bad'; v.textContent = '⚠ Aviso de condensación: margen por debajo de 2 °C.'; }
    else if (m < 4) { v.className = 'verdict warn'; v.textContent = 'Sin aviso, pero el margen es estrecho.'; }
    else { v.className = 'verdict ok'; v.textContent = 'Sin riesgo de condensación.'; }
  }
  $('#cTr').addEventListener('input', upd); $('#cHr').addEventListener('input', upd); upd();
})();

/* ---------------- 13 · Consumo ---------------- */
(() => {
  const d = [['Siempre activo (v8)', 1900, 'medido · unos 80 mA de media', C.coral], ['Con deep sleep', 495, 'medido · 11,3 mA dormido, unos 130 mA despierto', C.amber], ['Consumo de diseño', 180, 'estimado', C.mint], ['Diseño con SCD41', 33, 'estimado', C.sky]];
  $('#bars').innerHTML = '<div class="lab">mAh al día</div>' + d.map(([n, v, s, c]) => `<div class="row"><div><b>${n}</b><div class="sub">${s}</div></div><div class="track2"><div class="fill" data-w="${Math.max(1.2, v / 1900 * 100)}" style="background:${c};box-shadow:0 0 18px ${c}55"></div></div><div class="val">≈ ${v.toLocaleString('es-ES')} mAh/día</div></div>`).join('');
  onEnter.consumo = () => { $$('#bars .fill').forEach((f, i) => { f.style.width = '0'; setTimeout(() => f.style.width = f.dataset.w + '%', 120 + i * 140); }); };
})();

/* ---------------- 14 · Solar ---------------- */
(() => {
  const r = $('#sCr'), cap = $('#sCap'), PANEL = 2.4 * 495;
  function upd() {
    const Cn = +r.value; $('#sCv').textContent = Cn.toLocaleString('es-ES') + ' mAh/día';
    $('#sPan').textContent = '≈ ' + Math.round(PANEL).toLocaleString('es-ES') + ' mAh/día';
    const ratio = PANEL / Cn; $('#sRat').textContent = fmt(ratio, 1) + ' ×';
    const K = +cap.value; $('#sAut').textContent = K > 0 ? fmt(K / Cn, 1) + ' días' : 'falta dato';
    $$('.preset').forEach(b => b.classList.toggle('on', +b.dataset.v === Cn));
    const v = $('#sV');
    if (ratio < 1) { v.className = 'verdict bad'; v.textContent = 'En el peor diciembre el panel no cubre ni el consumo diario.'; }
    else if (ratio < 2) { v.className = 'verdict warn'; v.textContent = 'El panel cubre el consumo, con poco margen para recargar tras días nublados.'; }
    else { v.className = 'verdict ok'; v.textContent = 'El panel cubre el consumo con margen para recargar tras días sin sol.'; }
  }
  r.addEventListener('input', upd); cap.addEventListener('input', upd); $$('.preset').forEach(b => b.addEventListener('click', () => { r.value = b.dataset.v; upd(); })); upd();
})();

/* ---------------- 15 · Modos de sueño ---------------- */
$$('.strip').forEach(st => {
  const m = +st.dataset.m; let h = '';
  for (let i = 0; i < 60; i++) {
    const x = 2 + i * 1.62;
    if (m === 0) h += `<i style="left:${x}%;background:${C.sky}"></i>`;
    if (m === 1 && i % 15 === 0) h += `<i style="left:${x}%;background:${C.coral}"></i>`;
    if (m === 2) h += `<i style="left:${x}%;background:${i % 15 === 14 ? C.mint : 'rgba(127,224,180,.4)'};${i % 15 === 14 ? 'top:5px;height:30px;width:6px' : 'height:12px;top:14px'}"></i>`;
  }
  st.innerHTML = h;
});

/* ---------------- Arranque ---------------- */
fit();
const first = slides.findIndex(s => '#' + s.id === location.hash);
go(first >= 0 ? first : 0, false);
requestAnimationFrame(resetScroll); setTimeout(resetScroll, 50);
window.addEventListener('hashchange', () => { const i = slides.findIndex(s => '#' + s.id === location.hash); if (i >= 0 && i !== cur) go(i, false); });
