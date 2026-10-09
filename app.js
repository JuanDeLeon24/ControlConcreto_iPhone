/* Control de Avance Túnel 0 – PWA para iPhone (instalable, funciona sin señal) */
'use strict';
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const I = {
  atras: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  mas: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>',
  sumar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  editar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg>',
  camara: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M4 8h3l1.5-2.2h7L17 8h3a1.2 1.2 0 0 1 1.2 1.2v8.6A1.2 1.2 0 0 1 20 19H4a1.2 1.2 0 0 1-1.2-1.2V9.2A1.2 1.2 0 0 1 4 8z"/><circle cx="12" cy="13.2" r="3.6"/></svg>',
  cerrar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  compartir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>',
  basura: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
  filtro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16l-6 7v5l-4 2v-7L4 5z"/></svg>',
  buscar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
  grafico: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  tunel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3L3 21h18L12 3z"/><path d="M12 10l-4 11h8l-4-11z"/></svg>'
};

/* ================= Datos del Túnel 0 ================= */
const TUNEL_0 = {
  nombre: 'TÚNEL 0 - K6+178_K7+173',
  longitud: 995,
  abscisaInicial: 6178,
  abscisaFinal: 7173.35,
  modulos: 137,
  actividades: [
    { grupo: 'SOPORTE-REGULARIZADO', actividades: ['Excavación', 'Pernos', 'Concreto lanzado', 'Acero', 'Mallas'] },
    { grupo: 'IMPERMEABILIZACION', actividades: ['Geomembrana', 'Geodren vial', 'Tubería PVC'] },
    { grupo: 'SUBDRENAJES', actividades: ['Excavación', 'Relleno', 'Tubería', 'Cámaras'] },
    { grupo: 'VIGA BASE', actividades: ['Concreto 14 MPa', 'Concreto 28 MPa', 'Acero'] },
    { grupo: 'REVESTIMIENTO', actividades: ['Malla electrosoldada', 'Concreto 28 MPa', 'Fibra sintética', 'Microfibra'] },
    { grupo: 'GRANULARES', actividades: ['Relleno recebo', 'Base granular'] },
    { grupo: 'MEZCLA', actividades: ['Mezcla MSC-25', 'Riego imprimación'] },
    { grupo: 'PAVIMENTO', actividades: ['Pavimento concreto', 'Acero'] },
    { grupo: 'MOBILIARIO', actividades: ['Sumideros', 'Bordillos', 'Anclajes'] },
    { grupo: 'TANQUE', actividades: ['Excavación', 'Concreto', 'Acero'] },
    { grupo: 'SEÑALIZACION', actividades: ['Pintura', 'Tachas', 'Señales', 'Captafaros'] },
    { grupo: 'BROCALES', actividades: ['Excavación', 'Concreto', 'Acero', 'Geodren'] }
  ]
};

/* Generar módulos del Túnel 0 */
function generarModulos() {
  const modulos = [];
  let pkActual = 7173.0;
  for (let i = 1; i <= 137; i++) {
    const longitud = i <= 64 ? 7.5 : (i <= 74 ? 6.0 : 7.4);
    const pkFinal = pkActual - longitud;
    modulos.push({
      numero: i,
      pkInicial: pkActual,
      pkFinal: pkFinal,
      longitud: longitud,
      avance: Math.random() * 100,
      estado: 'En ejecución',
      actividades: TUNEL_0.actividades.map(g => ({
        grupo: g.grupo,
        actividades: g.actividades.map(a => ({ nombre: a, avance: Math.random() * 100 }))
      }))
    });
    pkActual = pkFinal;
  }
  return modulos;
}

/* ================= Almacenamiento local ================= */
const DB = {
  db: null,
  abrir() {
    return new Promise((res, rej) => {
      const r = indexedDB.open('control-tunel0', 1);
      r.onupgradeneeded = () => {
        const d = r.result;
        d.createObjectStore('modulos', { keyPath: 'numero' });
        d.createObjectStore('ajustes', { keyPath: 'k' });
      };
      r.onsuccess = () => { DB.db = r.result; res(); };
      r.onerror = () => rej(r.error);
    });
  },
  tx(store, modo, fn) {
    return new Promise((res, rej) => {
      const t = DB.db.transaction(store, modo), req = fn(t.objectStore(store));
      let out; if (req) req.onsuccess = () => { out = req.result; };
      t.oncomplete = () => res(out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
    });
  },
  todos: s => DB.tx(s, 'readonly', o => o.getAll()),
  get: (s, k) => DB.tx(s, 'readonly', o => o.get(k)),
  put: (s, v) => DB.tx(s, 'readwrite', o => o.put(v)),
  del: (s, k) => DB.tx(s, 'readwrite', o => o.delete(k))
};

/* ================= Estado ================= */
const E = { modulos: [], vista: 'inicio', filtro: 'todos', busqueda: '' };

async function cargar() {
  await DB.abrir();
  E.modulos = await DB.todos('modulos');
  if (E.modulos.length === 0) {
    E.modulos = generarModulos();
    for (const m of E.modulos) await DB.put('modulos', m);
  }
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { }
}

/* ================= Utilidades de interfaz ================= */
let toastT;
function toast(msg, ms = 3000) { const t = $('#toast'); t.textContent = msg; t.classList.add('ver'); clearTimeout(toastT); if (ms) toastT = setTimeout(() => t.classList.remove('ver'), ms); }
const esIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const instalada = () => window.navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;

let alCerrar = null;
function abrirSheet({ titulo, cuerpo, pie = '', accion = null, alta = false, onCerrar = null }) {
  $('#sheetTitulo').textContent = titulo;
  $('#sheetCuerpo').innerHTML = cuerpo;
  $('#sheetPie').innerHTML = pie;
  $('#sheetAccion').innerHTML = accion ? `<button class="accion" id="sheetOk">${esc(accion.texto)}</button>` : '';
  if (accion) $('#sheetOk').onclick = accion.fn;
  $('#sheet').classList.toggle('alta', alta);
  $('#scrim').classList.add('abierta'); $('#sheet').classList.add('abierta');
  $('#sheetCuerpo').scrollTop = 0;
  alCerrar = onCerrar;
}
function cerrarSheet() {
  $('#scrim').classList.remove('abierta'); $('#sheet').classList.remove('abierta');
  if (alCerrar) { const f = alCerrar; alCerrar = null; f(); }
}
$('#sheetCerrar').onclick = cerrarSheet; $('#scrim').onclick = cerrarSheet;

function confirmar(titulo, texto, accion, fn) {
  abrirSheet({
    titulo, cuerpo: `<p>${esc(texto)}</p>`,
    accion: { texto: accion, fn: () => { cerrarSheet(); fn(); } },
    pie: '<button class="btn" onclick="cerrarSheet()">Cancelar</button>'
  });
}

/* ================= Vistas ================= */
function colorAvance(avance) {
  if (avance <= 0) return '#9E9E9E';
  if (avance < 25) return '#E53935';
  if (avance < 50) return '#FF9800';
  if (avance < 75) return '#FDD835';
  if (avance < 100) return '#1E88E5';
  return '#43A047';
}

function vistaInicio() {
  const totalAvance = E.modulos.reduce((s, m) => s + m.avance, 0) / E.modulos.length;
  const modulosCompletados = E.modulos.filter(m => m.avance >= 100).length;
  const modulosEnEjecucion = E.modulos.filter(m => m.avance > 0 && m.avance < 100).length;
  const modulosNoIniciados = E.modulos.filter(m => m.avance <= 0).length;

  return `
    <div class="hero">
      <div class="hero-icono">${I.tunel}</div>
      <h1>Control de Avance</h1>
      <p class="subtitulo">${TUNEL_0.nombre}</p>
      <div class="stats">
        <div class="stat"><span class="stat-num">${totalAvance.toFixed(1)}%</span><span class="stat-label">Avance Total</span></div>
        <div class="stat"><span class="stat-num">${E.modulos.length}</span><span class="stat-label">Módulos</span></div>
        <div class="stat"><span class="stat-num">${TUNEL_0.longitud} m</span><span class="stat-label">Longitud</span></div>
      </div>
    </div>
    <div class="menu">
      <button class="menu-item" onclick="vistaModulos()">
        <span class="menu-icono">${I.tunel}</span>
        <span class="menu-texto">Módulos</span>
        <span class="menu-desc">${E.modulos.length} módulos</span>
      </button>
      <button class="menu-item" onclick="vistaActividades()">
        <span class="menu-icono">${I.grafico}</span>
        <span class="menu-texto">Actividades</span>
        <span class="menu-desc">${TUNEL_0.actividades.length} grupos</span>
      </button>
      <button class="menu-item" onclick="vistaFiltros()">
        <span class="menu-icono">${I.filtro}</span>
        <span class="menu-texto">Filtros</span>
        <span class="menu-desc">Buscar y filtrar</span>
      </button>
      <button class="menu-item" onclick="vistaDashboard()">
        <span class="menu-icono">${I.grafico}</span>
        <span class="menu-texto">Dashboard</span>
        <span class="menu-desc">KPIs y gráficos</span>
      </button>
    </div>
    <div class="info-tunel">
      <h3>Información del Túnel</h3>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">Abscisa Inicial</span><span class="info-valor">K6+178</span></div>
        <div class="info-item"><span class="info-label">Abscisa Final</span><span class="info-valor">K7+173</span></div>
        <div class="info-item"><span class="info-label">Módulos Completados</span><span class="info-valor">${modulosCompletados}</span></div>
        <div class="info-item"><span class="info-label">En Ejecución</span><span class="info-valor">${modulosEnEjecucion}</span></div>
        <div class="info-item"><span class="info-label">No Iniciados</span><span class="info-valor">${modulosNoIniciados}</span></div>
      </div>
    </div>
  `;
}

function vistaModulos() {
  const modulosFiltrados = E.modulos.filter(m => {
    if (E.filtro === 'completados' && m.avance < 100) return false;
    if (E.filtro === 'en-ejecucion' && (m.avance <= 0 || m.avance >= 100)) return false;
    if (E.filtro === 'no-iniciados' && m.avance > 0) return false;
    if (E.busqueda && !m.numero.toString().includes(E.busqueda)) return false;
    return true;
  });

  return `
    <div class="barra-nav">
      <button class="btn-nav" onclick="vistaInicio()">${I.atras}</button>
      <h2>Módulos del Túnel 0</h2>
      <button class="btn-nav" onclick="vistaFiltros()">${I.filtro}</button>
    </div>
    <div class="busqueda">
      <input type="text" placeholder="Buscar módulo..." value="${esc(E.busqueda)}" oninput="E.busqueda=this.value; vistaModulos()">
    </div>
    <div class="lista-modulos">
      ${modulosFiltrados.map(m => `
        <div class="modulo" onclick="detalleModulo(${m.numero})">
          <div class="modulo-header">
            <span class="modulo-num">Módulo ${m.numero}</span>
            <span class="modulo-avance" style="color:${colorAvance(m.avance)}">${m.avance.toFixed(1)}%</span>
          </div>
          <div class="modulo-info">
            <span>K${m.pkInicial.toFixed(2)} - K${m.pkFinal.toFixed(2)}</span>
            <span>${m.longitud.toFixed(1)} m</span>
          </div>
          <div class="barra-progreso">
            <div class="barra-relleno" style="width:${m.avance}%;background:${colorAvance(m.avance)}"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function vistaActividades() {
  return `
    <div class="barra-nav">
      <button class="btn-nav" onclick="vistaInicio()">${I.atras}</button>
      <h2>Actividades Cobrables</h2>
      <span></span>
    </div>
    <div class="lista-actividades">
      ${TUNEL_0.actividades.map(g => `
        <div class="grupo-actividad">
          <h3>${esc(g.grupo)}</h3>
          <div class="actividades">
            ${g.actividades.map(a => `<span class="actividad">${esc(a)}</span>`).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function vistaFiltros() {
  return `
    <div class="barra-nav">
      <button class="btn-nav" onclick="vistaInicio()">${I.atras}</button>
      <h2>Filtros</h2>
      <span></span>
    </div>
    <div class="filtros">
      <button class="filtro-btn ${E.filtro === 'todos' ? 'activo' : ''}" onclick="E.filtro='todos'; vistaModulos()">Todos</button>
      <button class="filtro-btn ${E.filtro === 'completados' ? 'activo' : ''}" onclick="E.filtro='completados'; vistaModulos()">Completados</button>
      <button class="filtro-btn ${E.filtro === 'en-ejecucion' ? 'activo' : ''}" onclick="E.filtro='en-ejecucion'; vistaModulos()">En Ejecución</button>
      <button class="filtro-btn ${E.filtro === 'no-iniciados' ? 'activo' : ''}" onclick="E.filtro='no-iniciados'; vistaModulos()">No Iniciados</button>
    </div>
  `;
}

function vistaDashboard() {
  const totalAvance = E.modulos.reduce((s, m) => s + m.avance, 0) / E.modulos.length;
  const modulosCompletados = E.modulos.filter(m => m.avance >= 100).length;
  const metrosEjecutados = E.modulos.filter(m => m.avance >= 100).reduce((s, m) => s + m.longitud, 0);
  const metrosFaltantes = TUNEL_0.longitud - metrosEjecutados;

  return `
    <div class="barra-nav">
      <button class="btn-nav" onclick="vistaInicio()">${I.atras}</button>
      <h2>Dashboard</h2>
      <span></span>
    </div>
    <div class="dashboard">
      <div class="kpi">
        <span class="kpi-valor">${totalAvance.toFixed(1)}%</span>
        <span class="kpi-label">Avance Total</span>
      </div>
      <div class="kpi">
        <span class="kpi-valor">${metrosEjecutados.toFixed(1)} m</span>
        <span class="kpi-label">Metros Ejecutados</span>
      </div>
      <div class="kpi">
        <span class="kpi-valor">${metrosFaltantes.toFixed(1)} m</span>
        <span class="kpi-label">Metros Faltantes</span>
      </div>
      <div class="kpi">
        <span class="kpi-valor">${modulosCompletados}</span>
        <span class="kpi-label">Módulos Completados</span>
      </div>
    </div>
  `;
}

function detalleModulo(numero) {
  const m = E.modulos.find(x => x.numero === numero);
  if (!m) return;

  abrirSheet({
    titulo: `Módulo ${m.numero}`,
    cuerpo: `
      <div class="detalle-modulo">
        <div class="detalle-row"><span>Abscisa Inicial:</span><span>K${m.pkInicial.toFixed(2)}</span></div>
        <div class="detalle-row"><span>Abscisa Final:</span><span>K${m.pkFinal.toFixed(2)}</span></div>
        <div class="detalle-row"><span>Longitud:</span><span>${m.longitud.toFixed(1)} m</span></div>
        <div class="detalle-row"><span>Avance:</span><span style="color:${colorAvance(m.avance)}">${m.avance.toFixed(1)}%</span></div>
        <div class="barra-progreso grande">
          <div class="barra-relleno" style="width:${m.avance}%;background:${colorAvance(m.avance)}"></div>
        </div>
        <h4>Actividades</h4>
        ${m.actividades.map(g => `
          <div class="detalle-grupo">
            <strong>${esc(g.grupo)}</strong>
            ${g.actividades.map(a => `
              <div class="detalle-actividad">
                <span>${esc(a.nombre)}</span>
                <span style="color:${colorAvance(a.avance)}">${a.avance.toFixed(0)}%</span>
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>
    `,
    pie: '<button class="btn" onclick="cerrarSheet()">Cerrar</button>'
  });
}

/* ================= Navegación ================= */
function vistaInicio() { E.vista = 'inicio'; render(); }
function vistaModulos() { E.vista = 'modulos'; render(); }
function vistaActividades() { E.vista = 'actividades'; render(); }
function vistaFiltros() { E.vista = 'filtros'; render(); }
function vistaDashboard() { E.vista = 'dashboard'; render(); }

function render() {
  const p = $('#pantalla');
  p.innerHTML = E.vista === 'inicio' ? vistaInicio() :
                E.vista === 'modulos' ? vistaModulos() :
                E.vista === 'actividades' ? vistaActividades() :
                E.vista === 'filtros' ? vistaFiltros() :
                E.vista === 'dashboard' ? vistaDashboard() : vistaInicio();
  p.hidden = false;
}

/* ================= Inicialización ================= */
cargar().then(() => {
  render();
  if (!instalada() && esIOS) {
    toast('Para instalar como app: Compartir → Añadir a pantalla de inicio', 5000);
  }
}).catch(e => {
  toast('Error al cargar: ' + e.message);
});
