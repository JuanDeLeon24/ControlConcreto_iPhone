/* Control Concreto – interfaz para iPhone (web app instalable, funciona sin señal). */
'use strict';
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MIME_PDF = 'application/pdf';

const I = {
  atras: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  mas: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>',
  sumar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  editar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg>',
  camara: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M4 8h3l1.5-2.2h7L17 8h3a1.2 1.2 0 0 1 1.2 1.2v8.6A1.2 1.2 0 0 1 20 19H4a1.2 1.2 0 0 1-1.2-1.2V9.2A1.2 1.2 0 0 1 4 8z"/><circle cx="12" cy="13.2" r="3.6"/></svg>',
  cerrar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  compartir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>',
  basura: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>'
};

/* ================= Almacenamiento local (IndexedDB) ================= */
const DB = {
  db: null,
  abrir() {
    return new Promise((res, rej) => {
      const r = indexedDB.open('control-concreto', 1);
      r.onupgradeneeded = () => {
        const d = r.result;
        ['jornadas', 'fotos', 'minis'].forEach(n => d.createObjectStore(n, { keyPath: 'id' }));
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
const E = { jornadas: [], minis: new Map(), logo: null, ultimo: {}, vista: { n: 'inicio' } };
const getJ = id => E.jornadas.find(j => j.id === id);
const buscarMixer = id => { for (const j of E.jornadas) { const m = j.mixers.find(x => x.id === id); if (m) return { j, m }; } return null; };

async function cargar() {
  await DB.abrir();
  E.jornadas = await DB.todos('jornadas');
  for (const m of await DB.todos('minis')) E.minis.set(m.id, URL.createObjectURL(m.blob));
  const lg = await DB.get('ajustes', 'logo'); if (lg && lg.v) ponerLogo(lg.v);
  const ul = await DB.get('ajustes', 'ultimo'); if (ul) E.ultimo = ul.v || {};
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { }
}
function ponerLogo(blob) {
  if (E.logo) URL.revokeObjectURL(E.logo.url);
  E.logo = blob ? { blob, url: URL.createObjectURL(blob) } : null;
}
async function guardarJ(j) {
  try {
    await DB.put('jornadas', j);
    const i = E.jornadas.findIndex(x => x.id === j.id);
    if (i >= 0) E.jornadas[i] = j; else E.jornadas.push(j);
    return true;
  } catch (e) { toast('No se pudo guardar. Revisa el espacio del teléfono.'); return false; }
}
async function borrarFoto(id) {
  await DB.del('fotos', id); await DB.del('minis', id);
  const u = E.minis.get(id); if (u) URL.revokeObjectURL(u); E.minis.delete(id);
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
  const d = document.createElement('div');
  d.className = 'modal';
  d.innerHTML = `<div class="caja" role="alertdialog" aria-modal="true"><h3>${esc(titulo)}</h3><p>${esc(texto)}</p>
    <div class="fila"><button class="btn sec" data-no>Cancelar</button><button class="btn peligro" data-si>${esc(accion)}</button></div></div>`;
  document.body.appendChild(d);
  d.querySelector('[data-no]').onclick = () => d.remove();
  d.querySelector('[data-si]').onclick = () => { d.remove(); fn(); };
}

function aBlob(cv, tipo, q) { return new Promise((res, rej) => cv.toBlob(b => b ? res(b) : rej(new Error('toBlob')), tipo, q)); }
async function imagenDe(blob) {
  const url = URL.createObjectURL(blob);
  try { const img = new Image(); img.src = url; await img.decode(); return img; } finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
}
async function cargarImagen(blob, maxLado) {
  const img = await imagenDe(blob);
  const s = Math.min(1, maxLado / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(img.naturalWidth * s)); c.height = Math.max(1, Math.round(img.naturalHeight * s));
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c;
}
async function compartirArchivo(blob, nombre) {
  const file = new File([blob], nombre, { type: blob.type });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: nombre }); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 5000);
}

/* ================= Pantalla de inicio ================= */
function marcaHTML() {
  const logo = E.logo ? `<img src="${E.logo.url}" alt="Logo de la empresa">`
    : `<button class="sinlogo" data-acc="logo"><span>Construcciones</span><b>EL CONDOR S.A.</b><small>Toca para agregar el logo</small></button>`;
  return `<div class="marca">${logo}<span class="div"></span><span class="proy">Control llegadas de concreto a obra</span></div>`;
}

function renderInicio() {
  const grupos = {};
  E.jornadas.forEach(j => (grupos[j.fecha] = grupos[j.fecha] || []).push(j));
  const fechas = Object.keys(grupos).sort().reverse();
  let h = `<div class="barra"><h1>Control de concreto<small>PS-TUNEL 011 | Revestimiento del túnel</small></h1>
    <button class="ico" data-acc="menu" aria-label="Más opciones">${I.mas}</button></div><main>${marcaHTML()}`;
  if (esIOS && !instalada()) {
    h += `<div class="instalar"><b>Para usarla sin señal:</b> en Safari toca <b>Compartir</b> y luego <b>“Agregar a inicio”</b>. Desde ahí ábrela siempre con su ícono.</div>`;
  }
  if (!fechas.length) h += `<div class="vacio"><b>Sin jornadas todavía</b>Toca “Nueva jornada” para crear la del día y empezar a registrar cada mixer que llegue a obra.</div>`;
  fechas.forEach(f => {
    const lista = grupos[f].sort((a, b) => (a.turno + a.creada).localeCompare(b.turno + b.creada));
    const vol = lista.reduce((s, j) => s + T.volumen(j), 0);
    h += `<div class="dia"><span class="n">${T.fecha(f).getDate()}</span><span class="r">${esc(T.diaResto(f))}</span><span class="v">${T.fmt(vol, 2)} m³</span></div>`;
    lista.forEach(j => {
      const meta = [j.frente, j.tramo ? `Tramo ${j.tramo}` : ''].filter(Boolean).join(', ');
      h += `<button class="jcard ${j.turno === 'Noche' ? 'noche' : ''}" data-j="${j.id}"><span class="franja"></span>
        <span class="txt"><span class="t">Turno ${j.turno.toLowerCase()}</span><br><span class="s">${j.mixers.length} ${j.mixers.length === 1 ? 'mixer' : 'mixers'}${meta ? ', ' + esc(meta) : ''}</span></span>
        <span class="vol">${T.fmt(T.volumen(j), 2)}<small>m³</small></span></button>`;
    });
  });
  h += `</main><button class="fab" data-acc="nueva">${I.sumar}Nueva jornada</button>`;
  $('#app').innerHTML = h;
}

/* ================= Detalle de jornada ================= */
function renderJornada(j) {
  const r = resumen(j);
  let h = `<div class="barra"><button class="ico" data-acc="atras" aria-label="Volver a jornadas">${I.atras}</button>
    <h1>${T.fechaCorta(j.fecha)}<small>Turno ${j.turno.toLowerCase()}</small></h1>
    <button class="ico" data-acc="editarJ" aria-label="Editar datos de la jornada">${I.editar}</button></div><main>`;
  h += `<div class="datos"><dl><dt>Nombre</dt><dd>${esc(j.nombre) || '–'}</dd><dt>Frente</dt><dd>${esc(j.frente) || '–'}</dd>
    <dt>Tramo</dt><dd>${esc(j.tramo) || '–'}</dd><dt>Fecha</dt><dd>${esc(T.fechaLarga(j.fecha))}</dd></dl>
    <button class="enlace" data-acc="editarJ">Editar datos de la jornada</button></div>`;
  h += `<div class="stats"><div class="stat"><b>${r.n}</b><span>Mixers</span></div><div class="stat"><b>${T.fmt(r.vol, 2)}</b><span>m³ vaciados</span></div>
    <div class="stat"><b>${r.descargue != null ? Math.round(r.descargue) : '–'}</b><span>min descargue prom.</span></div></div>`;
  if (!j.mixers.length) h += `<div class="vacio"><b>Ningún mixer registrado</b>Toca “Agregar mixer” cuando llegue el primero.</div>`;
  j.mixers.forEach((m, i) => {
    const horas = [m.llegada && `Llegó ${m.llegada}`, m.inicio && `descargue ${m.inicio}${m.fin ? ' a ' + m.fin : ''}`].filter(Boolean).join(', ');
    const det = [m.asObra && `Asent. obra ${m.asObra}"`, m.temp && `${m.temp} °C`, m.loc].filter(Boolean).join(', ');
    const mini = E.minis.get(m.id);
    h += `<div class="mx"><button class="abrir" data-m="${m.id}"><span class="num">${i + 1}</span>
      <span class="info"><span class="c">${esc(m.codigo)}</span><span class="s">${esc(horas || 'Sin horas')}</span>
      ${det ? `<span class="s">${esc(det)}</span>` : ''}${!m.fin ? '<span class="falta">Falta hora de fin de descargue</span>' : ''}</span>
      <span class="q">${m.cant ? T.fmt(T.num(m.cant), 2) : '–'}<small>m³</small></span></button>
      <button class="foto ${mini ? 'con' : ''}" data-f="${m.id}" aria-label="${mini ? 'Ver foto de la remisión' : 'Tomar foto de la remisión'}">${mini ? `<img src="${mini}" alt="">` : I.camara}</button></div>`;
  });
  h += `</main><div class="dock"><button class="btn sec" data-acc="exportar" ${j.mixers.length ? '' : 'disabled'}>Exportar</button>
    <button class="btn prim" data-acc="agregar">${I.sumar}Agregar mixer</button></div>`;
  $('#app').innerHTML = h;
}

function render() {
  const j = E.vista.n === 'jornada' && getJ(E.vista.id);
  if (j) renderJornada(j); else { E.vista = { n: 'inicio' }; renderInicio(); }
}
function irA(vista) {
  E.vista = vista;
  if (vista.n === 'jornada') history.pushState({ j: vista.id }, '');
  render(); window.scrollTo(0, 0);
}
window.addEventListener('popstate', () => { if (E.vista.n === 'jornada') { E.vista = { n: 'inicio' }; render(); } });

/* Clics en la pantalla principal */
$('#app').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const j = E.vista.n === 'jornada' ? getJ(E.vista.id) : null;
  if (b.dataset.j) return irA({ n: 'jornada', id: b.dataset.j });
  if (b.dataset.m && j) return formMixer(j, j.mixers.find(x => x.id === b.dataset.m));
  if (b.dataset.f) return E.minis.has(b.dataset.f) ? verFoto(b.dataset.f) : tomarFoto(b.dataset.f);
  switch (b.dataset.acc) {
    case 'menu': return menu();
    case 'logo': return $('#inLogo').click();
    case 'nueva': return formJornada(null);
    case 'atras': return history.state && history.state.j ? history.back() : (E.vista = { n: 'inicio' }, render());
    case 'editarJ': return formJornada(j);
    case 'agregar': return formMixer(j, null);
    case 'exportar': return elegirExport(j);
  }
});

/* ================= Formulario de jornada ================= */
function formJornada(j) {
  const nuevo = !j, u = E.ultimo;
  const v = j || { fecha: T.hoy(), turno: T.turnoActual(), nombre: u.nombre || '', frente: u.frente || '', tramo: u.tramo || '' };
  let turno = v.turno === 'Noche' ? 'Noche' : 'Día';
  abrirSheet({
    titulo: nuevo ? 'Nueva jornada' : 'Datos de la jornada', alta: true,
    accion: { texto: 'Guardar', fn: () => guardar() },
    cuerpo: `<div class="f"><label for="jNombre">Nombre</label><input id="jNombre" autocomplete="name" autocapitalize="words" value="${esc(v.nombre)}"></div>
      <div class="f"><label for="jFrente">Frente</label><input id="jFrente" value="${esc(v.frente)}"></div>
      <div class="fila2"><div class="f" id="fFecha"><label for="jFecha">Fecha</label><input type="date" id="jFecha" value="${esc(v.fecha)}"></div>
      <div class="f"><label for="jTramo">Tramo</label><input id="jTramo" value="${esc(v.tramo)}"></div></div>
      <div class="f"><label>Turno</label><div class="seg" id="jTurno"><button type="button" data-v="Día" aria-pressed="${turno === 'Día'}">Día</button><button type="button" data-v="Noche" aria-pressed="${turno === 'Noche'}">Noche</button></div></div>
      <button class="btn prim ancho" id="jGuardar">${nuevo ? 'Crear jornada' : 'Guardar cambios'}</button>
      ${nuevo ? '' : '<div class="seccion">Zona de cuidado</div><button class="btn peligro ancho" id="jBorrar">Eliminar jornada completa</button>'}`
  });
  document.querySelectorAll('#jTurno button').forEach(b => b.onclick = () => {
    turno = b.dataset.v; document.querySelectorAll('#jTurno button').forEach(x => x.setAttribute('aria-pressed', x === b));
  });
  $('#jGuardar').onclick = () => guardar();
  if (!nuevo) $('#jBorrar').onclick = () => confirmar('Eliminar jornada',
    `Se borrará la jornada del ${T.fechaCorta(j.fecha)} con sus ${j.mixers.length} mixers y sus fotos. No se puede deshacer.`, 'Eliminar', async () => {
      for (const m of j.mixers) await borrarFoto(m.id);
      await DB.del('jornadas', j.id); E.jornadas = E.jornadas.filter(x => x.id !== j.id);
      cerrarSheet(); E.vista = { n: 'inicio' }; render(); toast('Jornada eliminada');
    });
  async function guardar() {
    const fecha = $('#jFecha').value;
    if (!fecha) { $('#fFecha').classList.add('err'); toast('Indica la fecha de la jornada'); return; }
    const d = { fecha, turno, nombre: $('#jNombre').value.trim(), frente: $('#jFrente').value.trim(), tramo: $('#jTramo').value.trim() };
    if (nuevo) {
      const dup = E.jornadas.find(x => x.fecha === d.fecha && x.turno === d.turno && x.frente === d.frente && x.tramo === d.tramo);
      if (dup) { cerrarSheet(); irA({ n: 'jornada', id: dup.id }); toast('Esa jornada ya existía; la abrí para continuar'); return; }
    }
    const nj = nuevo ? { id: T.uid(), creada: new Date().toISOString(), mixers: [], ...d } : { ...j, ...d };
    if (!(await guardarJ(nj))) return;
    E.ultimo = { nombre: d.nombre, frente: d.frente, tramo: d.tramo };
    DB.put('ajustes', { k: 'ultimo', v: E.ultimo }).catch(() => { });
    cerrarSheet();
    if (nuevo) irA({ n: 'jornada', id: nj.id }); else render();
    toast(nuevo ? 'Jornada creada' : 'Cambios guardados');
  }
}

/* ================= Formulario de mixer ================= */
const FRACCIONES = ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'];
function sugerenciasLoc() {
  const s = new Set(); E.jornadas.forEach(j => j.mixers.forEach(m => m.loc && s.add(m.loc.trim()))); return [...s].slice(-15).reverse();
}
function campoHora(id, label, valor) {
  return `<div class="f"><label for="${id}">${label}</label><div class="hora"><input type="time" id="${id}" value="${esc(valor)}">
    <button type="button" class="mini" data-ahora="${id}">Ahora</button><button type="button" class="borrar" data-limpiar="${id}" aria-label="Borrar ${label}">${I.cerrar}</button></div></div>`;
}
function campoAsent(id, label, valor) {
  return `<div class="f"><label for="${id}">${label}</label><input id="${id}" inputmode="decimal" value="${esc(valor)}" placeholder='Ej: 7 1/4'>
    <div class="chips" data-asent="${id}"><button type="button" class="chip" data-fr="0">Exacto</button>${FRACCIONES.map(f => `<button type="button" class="chip" data-fr="${f}">${f}</button>`).join('')}</div>
    <div class="hint">Escribe el número entero y toca la fracción.</div></div>`;
}

function formMixer(j, m) {
  if (!j) return;
  const nuevo = !m, n = nuevo ? j.mixers.length + 1 : j.mixers.indexOf(m) + 1;
  const v = m || { codigo: '', llegada: T.ahora(), inicio: '', fin: '', cant: '', asPlanta: '', asObra: '', temp: '', loc: j.mixers.length ? j.mixers[j.mixers.length - 1].loc : '', obs: '' };
  abrirSheet({
    titulo: nuevo ? `Mixer ${n}` : `Editar mixer ${n}`, alta: true,
    accion: { texto: 'Guardar', fn: () => guardar() },
    cuerpo: `<div class="f" id="fCod"><label for="mCod">Código mixer / remisión</label><input id="mCod" autocapitalize="characters" value="${esc(v.codigo)}"><div class="msg" id="mCodMsg"></div></div>
      <div class="seccion">Horas</div>${campoHora('mLleg', 'Hora de llegada', v.llegada)}${campoHora('mIni', 'Hora inicio descargue', v.inicio)}${campoHora('mFin', 'Hora fin descargue', v.fin)}
      <div id="mAviso"></div>
      <div class="seccion">Concreto</div>
      <div class="fila2"><div class="f"><label for="mCant">Cantidad (m³)</label><input id="mCant" inputmode="decimal" value="${esc(v.cant)}"></div>
      <div class="f"><label for="mTemp">Temperatura (°C)</label><input id="mTemp" inputmode="decimal" value="${esc(v.temp)}"></div></div>
      ${campoAsent('mAsP', 'Asentamiento en planta (")', v.asPlanta)}${campoAsent('mAsO', 'Asentamiento en obra (")', v.asObra)}
      <div class="msg" id="mNumMsg" style="color:var(--peligro);margin:-6px 0 10px"></div>
      <div class="seccion">Ubicación</div>
      <div class="f"><label for="mLoc">Localización <span style="font-weight:400;color:var(--suave)">(módulo, abscisa, hastial…)</span></label><input id="mLoc" value="${esc(v.loc)}"><div class="chips" id="mLocSug"></div></div>
      <div class="f"><label for="mObs">Observación</label><textarea id="mObs">${esc(v.obs)}</textarea></div>
      <button class="btn prim ancho" id="mGuardar">${nuevo ? 'Guardar mixer' : 'Guardar cambios'}</button>
      ${nuevo ? '' : '<div style="height:10px"></div><button class="btn peligro ancho" id="mBorrar">Eliminar este mixer</button>'}<div style="height:20px"></div>`
  });
  const cuerpo = $('#sheetCuerpo');
  cuerpo.querySelectorAll('[data-ahora]').forEach(b => b.onclick = () => { $('#' + b.dataset.ahora).value = T.ahora(); avisos(); });
  cuerpo.querySelectorAll('[data-limpiar]').forEach(b => b.onclick = () => { $('#' + b.dataset.limpiar).value = ''; avisos(); });
  ['mLleg', 'mIni', 'mFin'].forEach(id => $('#' + id).addEventListener('change', avisos));
  function avisos() {
    const L = T.toMin($('#mLleg').value), S = T.toMin($('#mIni').value), F = T.toMin($('#mFin').value), w = [];
    if (L != null && S != null && S < L) w.push('El inicio de descargue es anterior a la llegada.');
    if (S != null && F != null && F < S) w.push('El fin de descargue es anterior al inicio.');
    $('#mAviso').innerHTML = w.length ? `<div class="avisobox">${w.join(' ')} Si el turno cruzó la medianoche está bien; si no, revisa la hora.</div>` : '';
  }
  avisos();
  // fracciones del asentamiento
  cuerpo.querySelectorAll('[data-asent]').forEach(box => {
    const inp = $('#' + box.dataset.asent);
    const pintar = () => {
      const t = inp.value.trim(), frac = t.includes(' ') ? t.slice(t.indexOf(' ') + 1).trim() : (t.includes('/') ? t : '');
      box.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c.dataset.fr === '0' ? (t !== '' && !t.includes('/')) : frac === c.dataset.fr));
    };
    box.querySelectorAll('.chip').forEach(c => c.onclick = () => {
      const t = inp.value.trim(), ent = (t.split(/[ \-]/)[0] || '').match(/^\d+$/) ? t.split(/[ \-]/)[0] : '';
      inp.value = c.dataset.fr === '0' ? ent : (ent ? `${ent} ${c.dataset.fr}` : c.dataset.fr);
      pintar(); $('#mNumMsg').textContent = '';
    });
    inp.addEventListener('input', pintar); pintar();
  });
  // sugerencias de localización
  const sug = sugerenciasLoc();
  const pintarSug = () => {
    const t = $('#mLoc').value.trim().toLowerCase();
    $('#mLocSug').innerHTML = sug.filter(s => s.toLowerCase() !== t && (!t || s.toLowerCase().includes(t))).slice(0, 10)
      .map(s => `<button type="button" class="chip" data-loc="${esc(s)}">${esc(s)}</button>`).join('');
  };
  $('#mLoc').addEventListener('input', pintarSug); pintarSug();
  $('#mLocSug').onclick = e => { const c = e.target.closest('[data-loc]'); if (c) { $('#mLoc').value = c.dataset.loc; pintarSug(); } };
  $('#mCod').addEventListener('input', () => { $('#fCod').classList.remove('err'); $('#mCodMsg').textContent = ''; });
  $('#mGuardar').onclick = () => guardar();
  if (!nuevo) $('#mBorrar').onclick = () => confirmar('Eliminar mixer', `Se borrará el mixer ${m.codigo || n} y la foto de su remisión. Los demás conservan su orden.`, 'Eliminar', async () => {
    await borrarFoto(m.id);
    const nj = { ...j, mixers: j.mixers.filter(x => x.id !== m.id) };
    if (await guardarJ(nj)) { cerrarSheet(); render(); toast('Mixer eliminado'); }
  });

  async function guardar() {
    const codigo = $('#mCod').value.trim();
    if (!codigo) { $('#fCod').classList.add('err'); $('#mCodMsg').textContent = 'Escribe el código del mixer o el número de remisión.'; $('#mCod').focus(); return; }
    const vals = { cant: $('#mCant').value, temp: $('#mTemp').value, asP: $('#mAsP').value, asO: $('#mAsO').value };
    const malo = [['Cantidad', vals.cant], ['Temperatura', vals.temp]].find(([, x]) => x.trim() && T.num(x) == null);
    if (malo) { $('#mNumMsg').textContent = `${malo[0]} debe ser un número`; return; }
    const maloA = [['Asentamiento en planta', vals.asP], ['Asentamiento en obra', vals.asO]].find(([, x]) => x.trim() && T.pulgadas(x) == null);
    if (maloA) { $('#mNumMsg').textContent = `${maloA[0]}: escríbelo como 7, 7 1/4 o 7.25`; return; }
    const nm = {
      id: m ? m.id : T.uid(), codigo, llegada: $('#mLleg').value, inicio: $('#mIni').value, fin: $('#mFin').value,
      cant: T.limpiar(vals.cant), temp: T.limpiar(vals.temp), asPlanta: T.normalizarPulg(vals.asP), asObra: T.normalizarPulg(vals.asO),
      loc: $('#mLoc').value.trim(), obs: $('#mObs').value.trim()
    };
    const nj = { ...j, mixers: nuevo ? [...j.mixers, nm] : j.mixers.map(x => x.id === nm.id ? nm : x) };
    if (await guardarJ(nj)) { cerrarSheet(); render(); toast(nuevo ? 'Mixer guardado' : 'Cambios guardados'); }
  }
}

/* ================= Fotos de remisiones: cámara, recorte, filtro ================= */
let fotoPara = null;
function tomarFoto(id) { fotoPara = id; const i = $('#inCamara'); i.value = ''; i.click(); }
function elegirGaleria(id) { fotoPara = id; const i = $('#inGaleria'); i.value = ''; i.click(); }
async function alElegirFoto(e) {
  const f = e.target.files && e.target.files[0]; if (!f || !fotoPara) return;
  try { abrirRecorte(fotoPara, await cargarImagen(f, 2400)); }
  catch (err) { toast('No se pudo leer la foto'); }
}
$('#inCamara').onchange = alElegirFoto; $('#inGaleria').onchange = alElegirFoto;

const P = $('#pantalla');
let alRedimensionar = null;
function cerrarPantalla() {
  P.hidden = true; P.innerHTML = '';
  if (alRedimensionar) { window.removeEventListener('resize', alRedimensionar); alRedimensionar = null; }
}

function abrirRecorte(id, fuente) {
  P.hidden = false;
  P.innerHTML = `<div class="pbarra"><button class="ico" id="rCerrar" aria-label="Cancelar">${I.cerrar}</button><h2>Ajusta el recorte</h2></div>
    <p class="pinstr">Arrastra los cuatro puntos a las esquinas de la remisión</p>
    <div class="lienzo" id="rLz"><canvas id="rCv"></canvas><div class="procesando" id="rProc" hidden><div class="giro"></div><span>Aplicando filtro de escaneo…</span></div></div>
    <div class="pbotones"><button class="btn oscuro" id="rRep">Repetir</button><button class="btn oscuro" id="rGir">Girar</button><button class="btn claro" id="rOk">Guardar</button></div>`;
  let src = fuente, esq = iniciales(src), activo = -1, ultimo = null, geo = null;
  const cv = $('#rCv'), lz = $('#rLz'), ctx = cv.getContext('2d');
  function iniciales(c) { const mx = c.width * 0.06, my = c.height * 0.06; return [[mx, my], [c.width - mx, my], [c.width - mx, c.height - my], [mx, c.height - my]]; }
  function medir() {
    const r = lz.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    const s = Math.min(r.width / src.width, r.height / src.height);
    geo = { w: r.width, h: r.height, s, ox: (r.width - src.width * s) / 2, oy: (r.height - src.height * s) / 2, dpr };
    dibujar();
  }
  const aPant = p => [geo.ox + p[0] * geo.s, geo.oy + p[1] * geo.s];
  function dibujar() {
    if (!geo) return;
    ctx.setTransform(geo.dpr, 0, 0, geo.dpr, 0, 0); ctx.clearRect(0, 0, geo.w, geo.h);
    ctx.drawImage(src, geo.ox, geo.oy, src.width * geo.s, src.height * geo.s);
    const pts = esq.map(aPant);
    ctx.beginPath(); ctx.rect(0, 0, geo.w, geo.h); ctx.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(p => ctx.lineTo(p[0], p[1])); ctx.closePath();
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fill('evenodd');
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(p => ctx.lineTo(p[0], p[1])); ctx.closePath();
    ctx.strokeStyle = '#A0BEE7'; ctx.lineWidth = 2; ctx.stroke();
    pts.forEach((p, i) => { ctx.beginPath(); ctx.arc(p[0], p[1], i === activo ? 15 : 11, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#002F5C'; ctx.stroke(); });
    if (activo >= 0) lupa(pts);
  }
  function lupa(pts) {
    const L = 120, z = 2.5, q = esq[activo], m = 8;
    const lado = Math.min(L / (geo.s * z), src.width, src.height);
    const sx = Math.min(Math.max(0, q[0] - lado / 2), src.width - lado), sy = Math.min(Math.max(0, q[1] - lado / 2), src.height - lado);
    const cx = pts[activo][0] < geo.w / 2 ? geo.w - L / 2 - m : L / 2 + m, cy = L / 2 + m;
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, L / 2, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#000'; ctx.fillRect(cx - L / 2, cy - L / 2, L, L);
    ctx.drawImage(src, sx, sy, lado, lado, cx - L / 2, cy - L / 2, L, L); ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, L / 2, 0, Math.PI * 2); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    const k = L / lado, px = cx - L / 2 + (q[0] - sx) * k, py = cy - L / 2 + (q[1] - sy) * k;
    ctx.beginPath(); ctx.moveTo(px - 9, py); ctx.lineTo(px + 9, py); ctx.moveTo(px, py - 9); ctx.lineTo(px, py + 9); ctx.strokeStyle = '#A0BEE7'; ctx.stroke();
  }
  const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  cv.onpointerdown = e => {
    const [x, y] = pos(e), pts = esq.map(aPant);
    let best = -1, bd = 1e9; pts.forEach((p, i) => { const d = Math.hypot(p[0] - x, p[1] - y); if (d < bd) { bd = d; best = i; } });
    if (bd < 48) { activo = best; ultimo = [x, y]; cv.setPointerCapture(e.pointerId); dibujar(); }
  };
  cv.onpointermove = e => {
    if (activo < 0) return;
    const [x, y] = pos(e), q = esq[activo];
    esq[activo] = [Math.min(src.width, Math.max(0, q[0] + (x - ultimo[0]) / geo.s)), Math.min(src.height, Math.max(0, q[1] + (y - ultimo[1]) / geo.s))];
    ultimo = [x, y]; dibujar();
  };
  cv.onpointerup = cv.onpointercancel = () => { activo = -1; dibujar(); };
  alRedimensionar = () => medir(); window.addEventListener('resize', alRedimensionar);
  requestAnimationFrame(medir);

  $('#rCerrar').onclick = cerrarPantalla;
  $('#rRep').onclick = () => { cerrarPantalla(); tomarFoto(id); };
  $('#rGir').onclick = () => {
    const c = document.createElement('canvas'); c.width = src.height; c.height = src.width;
    const g = c.getContext('2d'); g.translate(c.width, 0); g.rotate(Math.PI / 2); g.drawImage(src, 0, 0);
    src = c; esq = iniciales(src); medir();
  };
  $('#rOk').onclick = async () => {
    $('#rProc').hidden = false; ['rRep', 'rGir', 'rOk', 'rCerrar'].forEach(b => $('#' + b).disabled = true);
    await new Promise(r => setTimeout(r, 60));
    try {
      const w = src.width, h = src.height, d = src.getContext('2d').getImageData(0, 0, w, h).data;
      const g = new Uint8Array(w * h);
      for (let i = 0, k = 0; i < g.length; i++, k += 4) g[i] = (d[k] * 299 + d[k + 1] * 587 + d[k + 2] * 114) / 1000;
      const r = Escaner.enderezar(g, w, h, esq, 2000), f = Escaner.filtro(r.g, r.w, r.h);
      const out = document.createElement('canvas'); out.width = r.w; out.height = r.h;
      const oc = out.getContext('2d'), im = oc.createImageData(r.w, r.h);
      for (let i = 0, k = 0; i < f.length; i++, k += 4) { im.data[k] = im.data[k + 1] = im.data[k + 2] = f[i]; im.data[k + 3] = 255; }
      oc.putImageData(im, 0, 0);
      const blob = await aBlob(out, 'image/jpeg', 0.9);
      const ms = 240 / Math.max(r.w, r.h), mc = document.createElement('canvas');
      mc.width = Math.max(1, Math.round(r.w * ms)); mc.height = Math.max(1, Math.round(r.h * ms));
      mc.getContext('2d').drawImage(out, 0, 0, mc.width, mc.height);
      const mini = await aBlob(mc, 'image/jpeg', 0.85);
      await DB.put('fotos', { id, blob }); await DB.put('minis', { id, blob: mini });
      const viejo = E.minis.get(id); if (viejo) URL.revokeObjectURL(viejo);
      E.minis.set(id, URL.createObjectURL(mini));
      cerrarPantalla(); render(); toast('Remisión guardada');
    } catch (err) {
      console.error(err); $('#rProc').hidden = true; ['rRep', 'rGir', 'rOk', 'rCerrar'].forEach(b => $('#' + b).disabled = false);
      toast('No se pudo procesar la foto');
    }
  };
}

async function verFoto(id) {
  const reg = await DB.get('fotos', id), bm = buscarMixer(id);
  if (!reg || !bm) return;
  const url = URL.createObjectURL(reg.blob);
  P.hidden = false;
  P.innerHTML = `<div class="pbarra"><button class="ico" id="vCerrar" aria-label="Cerrar">${I.cerrar}</button><h2>Remisión ${esc(bm.m.codigo)}</h2>
    <button class="ico" id="vComp" aria-label="Compartir foto">${I.compartir}</button><button class="ico" id="vBorrar" aria-label="Eliminar foto">${I.basura}</button></div>
    <div class="lienzo" id="vLz" style="touch-action:none;overflow:hidden"><img id="vImg" src="${url}" alt="Remisión"></div>
    <div class="pbotones"><button class="btn oscuro" id="vCam">Tomar de nuevo</button><button class="btn oscuro" id="vGal">Desde galería</button></div>`;
  const cerrar = () => { URL.revokeObjectURL(url); cerrarPantalla(); };
  // zoom con dos dedos y desplazamiento
  const img = $('#vImg'), lz = $('#vLz'), toques = new Map();
  let esc_ = 1, tx = 0, ty = 0, base = null, ultimoToque = 0;
  const aplicar = () => { img.style.transform = `translate(${tx}px,${ty}px) scale(${esc_})`; };
  lz.onpointerdown = e => {
    lz.setPointerCapture(e.pointerId); toques.set(e.pointerId, [e.clientX, e.clientY]);
    if (toques.size === 1) { const ahora = Date.now(); if (ahora - ultimoToque < 300) { esc_ = esc_ > 1 ? 1 : 2.5; tx = ty = 0; aplicar(); } ultimoToque = ahora; }
    base = null;
  };
  lz.onpointermove = e => {
    if (!toques.has(e.pointerId)) return;
    const prev = toques.get(e.pointerId); toques.set(e.pointerId, [e.clientX, e.clientY]);
    if (toques.size === 2) {
      const [a, b] = [...toques.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (base) { esc_ = Math.min(6, Math.max(1, esc_ * d / base)); if (esc_ === 1) tx = ty = 0; aplicar(); }
      base = d;
    } else if (toques.size === 1 && esc_ > 1) { tx += e.clientX - prev[0]; ty += e.clientY - prev[1]; aplicar(); }
  };
  lz.onpointerup = lz.onpointercancel = e => { toques.delete(e.pointerId); base = null; };

  $('#vCerrar').onclick = cerrar;
  $('#vComp').onclick = () => compartirArchivo(reg.blob, T.nombreArchivo(`Remision_${bm.m.codigo}`, '.jpg'));
  $('#vCam').onclick = () => { cerrar(); tomarFoto(id); };
  $('#vGal').onclick = () => { cerrar(); elegirGaleria(id); };
  $('#vBorrar').onclick = () => confirmar('Eliminar foto', `Se borrará la foto de la remisión ${bm.m.codigo}.`, 'Eliminar', async () => {
    await borrarFoto(id); cerrar(); render(); toast('Foto eliminada');
  });
}

/* ================= Exportar ================= */
function elegirExport(j) {
  abrirSheet({
    titulo: 'Exportar jornada',
    cuerpo: `<p style="margin-top:0">¿En qué formato quieres el resumen del ${T.fechaCorta(j.fecha)}?</p>
      <div class="pila"><button class="btn prim ancho" id="xPdf">PDF (planilla para imprimir y firmar)</button>
      <button class="btn cian ancho" id="xXls">Excel (.xlsx)</button></div>`
  });
  $('#xPdf').onclick = () => generar('PDF', () => generarPDF(j));
  $('#xXls').onclick = () => generar('Excel', async () => { const r = Excel.jornada(j); return { blob: new Blob(r.partes, { type: MIME_XLSX }), nombre: r.nombre }; });
}
async function generar(tipo, fn) {
  cerrarSheet(); toast(`Generando ${tipo}…`, 0);
  try {
    const { blob, nombre } = await fn();
    $('#toast').classList.remove('ver');
    abrirSheet({
      titulo: `${tipo} listo`,
      cuerpo: `<p style="margin-top:0;overflow-wrap:anywhere">${esc(nombre)}</p>
        <div class="pila"><button class="btn prim ancho" id="lComp">${I.compartir}Compartir o guardar en Archivos</button></div>
        <p class="hint" style="color:var(--suave);font-size:.85rem">Desde ahí puedes verlo, enviarlo por WhatsApp o correo, o guardarlo en “Archivos”.</p>`
    });
    $('#lComp').onclick = () => compartirArchivo(blob, nombre);
  } catch (e) { console.error(e); toast(`No se pudo generar el ${tipo}`); }
}

async function generarPDF(j) {
  const PW = 792, PH = 612, M = 28, K = 2.5, r = resumen(j);
  const AZUL = '#002F5C', CLARO = '#DEE8F6', LINEA = '#46505C', TINTA = '#14191E';
  const FUENTE = '-apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif';
  const paginas = []; let ctx = null;
  const fuente = (t, b) => `${b ? 'bold ' : ''}${t}px ${FUENTE}`;
  function nueva() {
    const cv = document.createElement('canvas'); cv.width = PW * K; cv.height = PH * K;
    ctx = cv.getContext('2d'); ctx.setTransform(K, 0, 0, K, 0, 0); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, PW, PH);
    paginas.push(cv);
  }
  function lineas(t, size, bold, maxW) {
    ctx.font = fuente(size, bold); const res = [];
    for (const par of String(t).split('\n')) {
      let l = '';
      for (const w of par.split(' ')) { const p = l ? l + ' ' + w : w; if (!l || ctx.measureText(p).width <= maxW) l = p; else { res.push(l); l = w; } }
      res.push(l);
    }
    return res;
  }
  const alto = (t, size, w, pad = 3) => !t ? 0 : lineas(t, size, false, w - 2 * pad).length * size * 1.2 + 2 * pad;
  function celda(x, y, w, h, t, o = {}) {
    const { size = 8, bold = false, color = TINTA, align = 'left', fondo = null, pad = 3 } = o;
    if (fondo) { ctx.fillStyle = fondo; ctx.fillRect(x, y, w, h); }
    ctx.strokeStyle = LINEA; ctx.lineWidth = 0.6; ctx.strokeRect(x, y, w, h);
    if (t === '' || t == null) return;
    const ls = lineas(t, size, bold, w - 2 * pad), lh = size * 1.2;
    let ty = y + (h - ls.length * lh) / 2 + size * 0.93;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.fillStyle = color; ctx.font = fuente(size, bold); ctx.textAlign = align;
    const tx = align === 'center' ? x + w / 2 : align === 'right' ? x + w - pad : x + pad;
    for (const l of ls) { ctx.fillText(l, tx, ty); ty += lh; }
    ctx.restore();
  }
  nueva();
  const ancho = PW - 2 * M, limite = PH - M - 16; let y = M;
  // Encabezado
  celda(M, y, 120, 46, E.logo ? '' : 'CONSTRUCCIONES\nEL CONDOR S.A.', { size: 8, bold: true, color: AZUL, align: 'center' });
  if (E.logo) {
    const lg = await imagenDe(E.logo.blob), s = Math.min(108 / lg.naturalWidth, 36 / lg.naturalHeight);
    ctx.drawImage(lg, M + (120 - lg.naturalWidth * s) / 2, y + (46 - lg.naturalHeight * s) / 2, lg.naturalWidth * s, lg.naturalHeight * s);
  }
  celda(M + 120, y, ancho - 240, 46, 'CONTROL LLEGADAS DE CONCRETO A OBRA', { size: 13, bold: true, color: AZUL, align: 'center' });
  celda(M + ancho - 120, y, 120, 46, 'PS-TUNEL 011', { size: 10, bold: true, color: AZUL, align: 'center' });
  y += 46;
  const wI = [56, 220, 50, 180, 50, 180];
  const filaInfo = tx => { let x = M; tx.forEach((t, i) => { celda(x, y, wI[i], 18, t, i % 2 === 0 ? { size: 8, bold: true, color: AZUL, fondo: CLARO } : { size: 8.5 }); x += wI[i]; }); y += 18; };
  filaInfo(['Nombre:', j.nombre, 'Frente:', j.frente, 'Tramo:', j.tramo]);
  filaInfo(['Fecha:', `${T.fechaCorta(j.fecha)}  (${T.fechaLarga(j.fecha)})`, 'Turno:', j.turno === 'Noche' ? 'Día [   ]      Noche [ X ]' : 'Día [ X ]      Noche [   ]', '', '']);
  y += 8;
  // Tabla
  const cols = [38, 78, 50, 56, 52, 40, 58, 58, 54, 120, 132];
  const tit = ['Orden\nllegada', 'Código mixer /\nremisión', 'Hora\nllegada', 'Hora inicio\ndescargue', 'Hora fin\ndescargue', 'Cant.\n(m³)', 'Asentamiento\nen planta (")', 'Asentamiento\nen obra (")', 'Temperatura\n(°C)', 'Localización', 'Observación'];
  const centradas = new Set([0, 2, 3, 4, 5, 6, 7, 8]);
  const encabezado = () => { let x = M; tit.forEach((t, i) => { celda(x, y, cols[i], 30, t, { size: 7, bold: true, color: '#fff', align: 'center', fondo: AZUL }); x += cols[i]; }); y += 30; };
  encabezado();
  const filas = j.mixers.map((m, i) => [String(i + 1), m.codigo, m.llegada, m.inicio, m.fin, m.cant ? T.fmt(T.num(m.cant), 2) : '', m.asPlanta, m.asObra, m.temp, m.loc, m.obs]);
  while (filas.length < 10) filas.push([String(filas.length + 1), '', '', '', '', '', '', '', '', '', '']);
  for (const f of filas) {
    const h = Math.max(18, ...f.map((t, i) => alto(t, 8, cols[i])));
    if (y + h > limite) { nueva(); y = M; encabezado(); }
    let x = M; f.forEach((t, i) => { celda(x, y, cols[i], h, t, { size: 8, align: centradas.has(i) ? 'center' : 'left' }); x += cols[i]; }); y += h;
  }
  if (y + 18 > limite) { nueva(); y = M; }
  const w5 = cols.slice(0, 5).reduce((a, b) => a + b, 0), wR = cols.slice(6).reduce((a, b) => a + b, 0), tot = { size: 8, bold: true, color: AZUL, fondo: CLARO };
  celda(M, y, w5, 18, 'TOTAL VACIADO', { ...tot, align: 'right' });
  celda(M + w5, y, cols[5], 18, T.fmt(r.vol, 2), { ...tot, align: 'center' });
  celda(M + w5 + cols[5], y, wR, 18, `${r.n} ${r.n === 1 ? 'mixer' : 'mixers'}`, tot);
  y += 32;
  // Resumen y firmas
  const datos = filasResumen(r), hRes = 16 + datos.length * 15;
  if (y + hRes > limite) { nueva(); y = M; }
  celda(M, y, 360, 16, 'Resumen de la jornada', { size: 8.5, bold: true, color: '#fff', fondo: AZUL });
  let yy = y + 16;
  datos.forEach(([k, v]) => { celda(M, yy, 200, 15, k, { size: 7.8, bold: true, color: AZUL, fondo: CLARO }); celda(M + 200, yy, 160, 15, v, { size: 8 }); yy += 15; });
  const sx = M + 400, sw = 150, sy = y + hRes - 22;
  ctx.strokeStyle = LINEA; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + sw, sy); ctx.moveTo(sx + sw + 36, sy); ctx.lineTo(sx + 2 * sw + 36, sy); ctx.stroke();
  ctx.fillStyle = TINTA; ctx.font = fuente(8); ctx.textAlign = 'left';
  ctx.fillText('Elaboró' + (j.nombre ? `: ${j.nombre}` : ''), sx, sy + 12); ctx.fillText('Revisó / Vo. Bo.', sx + sw + 36, sy + 12);
  // Anexo de remisiones (2 por página)
  const conFoto = j.mixers.map((m, i) => ({ m, n: i + 1 })).filter(x => E.minis.has(x.m.id));
  for (let k = 0; k < conFoto.length; k += 2) {
    nueva();
    ctx.fillStyle = AZUL; ctx.font = fuente(12, true); ctx.textAlign = 'left'; ctx.fillText('ANEXO – REMISIONES DE PLANTA', M, M + 12);
    ctx.fillStyle = LINEA; ctx.font = fuente(8.5); ctx.fillText(`Jornada ${T.fechaCorta(j.fecha)}, turno ${j.turno.toLowerCase()}${j.tramo ? ', tramo ' + j.tramo : ''}`, M, M + 26);
    const aw = (ancho - 16) / 2, arriba = M + 38, ah = PH - M - 16 - arriba - 16;
    for (let q = 0; q < 2 && k + q < conFoto.length; q++) {
      const { m, n } = conFoto[k + q], reg = await DB.get('fotos', m.id); if (!reg) continue;
      const img = await imagenDe(reg.blob), s = Math.min(aw / img.naturalWidth, ah / img.naturalHeight);
      const w = img.naturalWidth * s, h = img.naturalHeight * s, x0 = M + q * (aw + 16) + (aw - w) / 2;
      ctx.drawImage(img, x0, arriba, w, h); ctx.strokeStyle = LINEA; ctx.lineWidth = 0.6; ctx.strokeRect(x0, arriba, w, h);
      ctx.fillStyle = AZUL; ctx.font = fuente(8.5, true);
      ctx.fillText(`Mixer ${n}  |  ${m.codigo}${m.llegada ? '  |  llegada ' + m.llegada : ''}`, x0, arriba + h + 12);
    }
  }
  // Pie de página y conversión a PDF
  const gen = 'Generado el ' + new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }), salida = [];
  for (let i = 0; i < paginas.length; i++) {
    const cv = paginas[i], c = cv.getContext('2d');
    c.setTransform(K, 0, 0, K, 0, 0); c.fillStyle = '#888'; c.font = fuente(7);
    c.textAlign = 'left'; c.fillText(gen, M, PH - 12);
    c.textAlign = 'right'; c.fillText(`Página ${i + 1} de ${paginas.length}`, PW - M, PH - 12);
    const b = await aBlob(cv, 'image/jpeg', 0.9);
    salida.push({ bytes: new Uint8Array(await b.arrayBuffer()), w: cv.width, h: cv.height });
    cv.width = cv.height = 1;
  }
  const base = `Concreto_${j.fecha}_${j.turno}` + (j.tramo ? `_Tramo-${j.tramo}` : '');
  return { blob: new Blob(pdfDeJpegs(salida, PW, PH), { type: MIME_PDF }), nombre: T.nombreArchivo(base, '.pdf') };
}

/* ================= Menú, logo y copias de seguridad ================= */
function menu() {
  const nM = E.jornadas.reduce((s, j) => s + j.mixers.length, 0);
  abrirSheet({
    titulo: 'Opciones',
    cuerpo: `<div class="lista">
      <button id="oLogo">${E.logo ? 'Cambiar logo' : 'Agregar logo de la empresa'}</button>
      ${E.logo ? '<button id="oQuitar">Quitar logo</button>' : ''}
      <button id="oHist">Exportar historial a Excel</button>
      <button id="oResp">Guardar copia de seguridad</button>
      <button id="oRest">Restaurar copia de seguridad</button>
      <p>Los registros se guardan en este iPhone (${E.jornadas.length} jornadas, ${nM} mixers). La copia de seguridad guarda los datos, no las fotos, y es compatible con la app de Android.</p></div>`
  });
  $('#oLogo').onclick = () => { cerrarSheet(); $('#inLogo').click(); };
  if (E.logo) $('#oQuitar').onclick = async () => { await DB.del('ajustes', 'logo'); ponerLogo(null); cerrarSheet(); render(); toast('Logo quitado'); };
  $('#oHist').onclick = () => {
    if (!E.jornadas.some(j => j.mixers.length)) { cerrarSheet(); toast('Todavía no hay mixers registrados'); return; }
    generar('Excel', async () => { const r = Excel.historial(E.jornadas); return { blob: new Blob(r.partes, { type: MIME_XLSX }), nombre: r.nombre }; });
  };
  $('#oResp').onclick = () => {
    const datos = { app: 'control-concreto', version: 1, jornadas: E.jornadas.map(j => ({ id: j.id, fecha: j.fecha, turno: j.turno, nombre: j.nombre, frente: j.frente, tramo: j.tramo, creada: j.creada, mixers: j.mixers })) };
    compartirArchivo(new Blob([JSON.stringify(datos, null, 1)], { type: 'application/json' }), `respaldo_concreto_${T.hoy()}.json`);
  };
  $('#oRest').onclick = () => { cerrarSheet(); const i = $('#inRespaldo'); i.value = ''; i.click(); };
}

$('#inLogo').onchange = async e => {
  const f = e.target.files && e.target.files[0]; if (!f) return;
  try {
    const c = await cargarImagen(f, 900), b = await aBlob(c, 'image/png');
    await DB.put('ajustes', { k: 'logo', v: b }); ponerLogo(b); render(); toast('Logo actualizado');
  } catch (err) { toast('No se pudo leer esa imagen'); }
};

$('#inRespaldo').onchange = async e => {
  const f = e.target.files && e.target.files[0]; if (!f) return;
  try {
    const d = JSON.parse(await f.text()); if (!d || !Array.isArray(d.jornadas)) throw 0;
    const txt = x => (x == null ? '' : String(x));
    let n = 0;
    for (const o of d.jornadas) {
      if (!o || !o.id || !o.fecha) continue;
      const j = {
        id: txt(o.id), fecha: txt(o.fecha), turno: o.turno === 'Noche' ? 'Noche' : 'Día', nombre: txt(o.nombre), frente: txt(o.frente), tramo: txt(o.tramo), creada: txt(o.creada),
        mixers: (Array.isArray(o.mixers) ? o.mixers : []).map(m => ({
          id: txt(m.id) || T.uid(), codigo: txt(m.codigo), llegada: txt(m.llegada), inicio: txt(m.inicio), fin: txt(m.fin), cant: txt(m.cant),
          asPlanta: txt(m.asPlanta), asObra: txt(m.asObra), temp: txt(m.temp), loc: txt(m.loc), obs: txt(m.obs)
        }))
      };
      if (await guardarJ(j)) n++;
    }
    E.vista = { n: 'inicio' }; render(); toast(`Se restauraron ${n} jornadas`);
  } catch (err) { toast('Ese archivo no es una copia válida de esta app'); }
};

document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#sheet').classList.contains('abierta')) cerrarSheet(); });

/* ================= Inicio ================= */
(async () => {
  try { await cargar(); }
  catch (e) {
    $('#app').innerHTML = '<main><div class="vacio"><b>No se pudo abrir el almacenamiento</b>Revisa que Safari no esté en modo privado y vuelve a abrir la app.</div></main>';
    return;
  }
  render();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { });
})();
