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
const E = { jornadas: [], minis: new Map(), logo: null, ultimo: {}, vista: { n: 'inicio' }, cfg: cfgDesde({}), cat: { items: [], elementos: [] } };
const getJ = id => E.jornadas.find(j => j.id === id);
const buscarMixer = id => { for (const j of E.jornadas) { const m = j.mixers.find(x => x.id === id); if (m) return { j, m }; } return null; };

async function cargar() {
  await DB.abrir();
  E.jornadas = await DB.todos('jornadas');
  for (const m of await DB.todos('minis')) E.minis.set(m.id, URL.createObjectURL(m.blob));
  const lg = await DB.get('ajustes', 'logo'); if (lg && lg.v) ponerLogo(lg.v);
  const ul = await DB.get('ajustes', 'ultimo'); if (ul) E.ultimo = ul.v || {};
  const cf = await DB.get('ajustes', 'config'); E.cfg = cfgDesde(cf ? cf.v : {});
  const ct = await DB.get('ajustes', 'catalogo'); if (ct && ct.v) E.cat = { items: ct.v.items || [], elementos: ct.v.elementos || [] };
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
async function guardarCfg(c) { E.cfg = c; await DB.put('ajustes', { k: 'config', v: c }); }
async function guardarCat(c) { E.cat = c; await DB.put('ajustes', { k: 'catalogo', v: c }); }
const hayCatalogo = () => E.cat.items.length > 0 || E.cat.elementos.length > 0;

/* ================= Acceso de administrador (no guarda sesión ni contraseña) ================= */
const HUELLA_ADMIN = 'c3779fd0392ef3991a7c97d20ea7c57bb23c627e55097c525a4f3deca6e9ab6b';
function conAdmin(motivo, fn) {
  const d = document.createElement('div');
  d.className = 'modal';
  d.innerHTML = `<div class="caja" role="dialog" aria-modal="true"><h3>Acceso de administrador</h3>
    <p style="font-size:.92rem">Se necesita para ${esc(motivo)}.</p>
    <div class="f"><label for="adU">ID de usuario</label><input id="adU" autocapitalize="none" autocomplete="username" autocorrect="off"></div>
    <div class="f"><label for="adC">Contraseña</label><input id="adC" type="password" autocomplete="current-password"></div>
    <label style="display:flex;gap:8px;align-items:center;margin:-4px 0 12px;font-size:.9rem"><input type="checkbox" id="adVer"> Mostrar contraseña</label>
    <div class="msg" id="adMsg" style="color:var(--peligro);font-size:.88rem;min-height:1.2em;margin-bottom:8px"></div>
    <div class="fila"><button class="btn sec" data-no>Cancelar</button><button class="btn prim" data-si>Entrar</button></div></div>`;
  document.body.appendChild(d);
  const u = d.querySelector('#adU'), c = d.querySelector('#adC');
  d.querySelector('#adVer').onchange = e => { c.type = e.target.checked ? 'text' : 'password'; };
  d.querySelector('[data-no]').onclick = () => d.remove();
  const entrar = () => {
    if (sha256Hex(u.value.trim().toLowerCase() + '\n' + c.value) === HUELLA_ADMIN) { d.remove(); fn(); }
    else { c.value = ''; d.querySelector('#adMsg').textContent = 'ID o contraseña incorrectos'; c.focus(); }
  };
  d.querySelector('[data-si]').onclick = entrar;
  c.addEventListener('keydown', e => { if (e.key === 'Enter') entrar(); });
  setTimeout(() => u.focus(), 50);
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
/* Dentro de la app nativa de iPhone (Capacitor) se guarda el archivo y se abre el menú Compartir de iOS. */
function esNativo() { return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()); }
function aBase64(blob) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(',')[1]);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(blob);
  });
}
async function compartirNativo(blob, nombre) {
  const { Filesystem, Share } = window.Capacitor.Plugins;
  const data = await aBase64(blob);
  const r = await Filesystem.writeFile({ path: nombre, data, directory: 'CACHE' });
  try { await Share.share({ title: nombre, files: [r.uri] }); }
  catch (e) { if (!/cancel/i.test(String(e && e.message))) throw e; }
}
async function compartirArchivo(blob, nombre) {
  if (esNativo()) {
    try { await compartirNativo(blob, nombre); return; }
    catch (e) { console.error(e); }
  }
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
    : `<button class="sinlogo" data-acc="logo"><b>${esc(E.cfg.empresa)}</b><small>Toca para agregar el logo</small></button>`;
  const tit = E.cfg.titulo.toLowerCase().replace(/^./, x => x.toUpperCase());
  return `<div class="marca">${logo}<span class="div"></span><span class="proy">${esc(tit)}${E.cfg.proyecto ? '<br>' + esc(E.cfg.proyecto) : ''}</span></div>`;
}

function renderInicio() {
  const grupos = {};
  E.jornadas.forEach(j => (grupos[j.fecha] = grupos[j.fecha] || []).push(j));
  const fechas = Object.keys(grupos).sort().reverse();
  let h = `<div class="barra"><h1>Control de concreto<small>${esc([E.cfg.codigoFormato, E.cfg.area].filter(Boolean).join(' | '))}</small></h1>
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
      const meta = [j.frente, j.tramo].filter(Boolean).join(', ');
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
  h += `<div class="datos"><dl><dt>Nombre</dt><dd>${esc(j.nombre) || '–'}</dd><dt>${esc(E.cfg.etFrente)}</dt><dd>${esc(j.frente) || '–'}</dd>
    <dt>${esc(E.cfg.etTramo)}</dt><dd>${esc(j.tramo) || '–'}</dd><dt>Fecha</dt><dd>${esc(T.fechaLarga(j.fecha))}</dd></dl>
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
  h += `</main><div class="dock"><button class="btn sec" data-acc="exportar" ${j.mixers.length ? '' : 'disabled'}>Finalizar y resumen</button>
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
    case 'exportar': return verResumen(j);
  }
});

/* ================= Formulario de jornada ================= */
/* Lista para elegir de un catálogo, con buscador si es larga. */
function elegirDeLista(titulo, opciones, actual, fn) {
  const d = document.createElement('div');
  d.className = 'modal';
  d.innerHTML = `<div class="caja" role="dialog" aria-modal="true" style="max-height:80vh;display:flex;flex-direction:column"><h3>${esc(titulo)}</h3>
    ${opciones.length > 8 ? '<div class="f" style="margin-bottom:6px"><input id="elBus" placeholder="Buscar"></div>' : ''}
    <div class="lista" id="elLista" style="overflow:auto;flex:1"></div>
    <div class="fila" style="margin-top:10px"><button class="btn sec" data-no>Cerrar</button></div></div>`;
  document.body.appendChild(d);
  const pintar = t => {
    const q = Catalogo.norm(t || '');
    d.querySelector('#elLista').innerHTML = opciones.filter(o => !q || Catalogo.norm(o).includes(q))
      .map(o => `<button data-op="${esc(o)}" style="${o === actual ? 'background:#E6EEF8' : ''}">${esc(o)}</button>`).join('') || '<p>Sin resultados</p>';
  };
  pintar('');
  const bus = d.querySelector('#elBus'); if (bus) bus.oninput = () => pintar(bus.value);
  d.querySelector('#elLista').onclick = e => { const b = e.target.closest('[data-op]'); if (b) { d.remove(); fn(b.dataset.op); } };
  d.querySelector('[data-no]').onclick = () => d.remove();
}

function formJornada(j) {
  const nuevo = !j, u = E.ultimo, cfg = E.cfg, cat = E.cat;
  const frentesCat = Catalogo.frentes(cat), hayCat = hayCatalogo();
  let usarLista = hayCat && (j ? !!j.usaCatalogo : true);
  const v = j || { fecha: T.hoy(), turno: T.turnoActual(), nombre: u.nombre || '', frente: u.frente || '', tramo: u.tramo || '' };
  let turno = v.turno === 'Noche' ? 'Noche' : 'Día', frente = v.frente || '', tramo = v.tramo || '';
  if (nuevo && usarLista && frentesCat.length) {
    if (!frentesCat.includes(frente)) { frente = ''; tramo = ''; }
    else if (!Catalogo.tramos(cat, frente).includes(tramo)) tramo = '';
  }
  abrirSheet({
    titulo: nuevo ? 'Nueva jornada' : 'Datos de la jornada', alta: true,
    accion: { texto: 'Guardar', fn: () => guardar() },
    cuerpo: `<div class="f"><label for="jNombre">Nombre</label><input id="jNombre" autocomplete="name" autocapitalize="words" value="${esc(v.nombre)}"></div>
      ${hayCat ? `<div class="f"><label>${esc(cfg.etFrente)} y ${esc(cfg.etTramo.toLowerCase())}</label><div class="seg" id="jModo">
        <button type="button" data-v="1">De la lista</button><button type="button" data-v="0">Otro / no predefinido</button></div></div>` : ''}
      <div id="jLugar"></div>
      <div class="f" id="fFecha"><label for="jFecha">Fecha</label><input type="date" id="jFecha" value="${esc(v.fecha)}"></div>
      <div class="f"><label>Turno</label><div class="seg" id="jTurno"><button type="button" data-v="Día" aria-pressed="${turno === 'Día'}">Día</button><button type="button" data-v="Noche" aria-pressed="${turno === 'Noche'}">Noche</button></div></div>
      <button class="btn prim ancho" id="jGuardar">${nuevo ? 'Crear jornada' : 'Guardar cambios'}</button>
      ${nuevo ? '' : '<div class="seccion">Zona de cuidado</div><button class="btn peligro ancho" id="jBorrar">Eliminar jornada completa</button>'}`
  });
  const listaFrentes = () => usarLista && frentesCat.length > 0;
  function pintarLugar() {
    if ($('#jModo')) $('#jModo').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', (b.dataset.v === '1') === usarLista));
    if (listaFrentes()) {
      const ts = Catalogo.tramos(cat, frente);
      $('#jLugar').innerHTML = `<div class="f" id="fFrente"><label>${esc(cfg.etFrente)}</label><button type="button" class="btn sec ancho" id="jFrenteBtn" style="justify-content:space-between">${esc(frente || 'Elegir ' + cfg.etFrente.toLowerCase())}</button></div>
        <div class="f" id="fTramo"><label>${esc(cfg.etTramo)}${frente && !ts.length ? ` <span style="font-weight:400;color:var(--suave)">(sin ${esc(cfg.etTramo.toLowerCase())}s cargados)</span>` : ''}</label>
        <button type="button" class="btn sec ancho" id="jTramoBtn" ${ts.length ? '' : 'disabled'}>${esc(tramo || (ts.length ? 'Elegir ' + cfg.etTramo.toLowerCase() : '–'))}</button></div>
        <div class="msg" id="jMsg" style="color:var(--peligro);margin:-6px 0 10px"></div>`;
      $('#jFrenteBtn').onclick = () => elegirDeLista(cfg.etFrente, frentesCat, frente, op => {
        if (op !== frente) { frente = op; const t2 = Catalogo.tramos(cat, op); tramo = t2.length === 1 ? t2[0] : ''; }
        pintarLugar();
      });
      $('#jTramoBtn').onclick = () => elegirDeLista(cfg.etTramo, ts, tramo, op => { tramo = op; pintarLugar(); });
    } else {
      $('#jLugar').innerHTML = `<div class="f"><label for="jFrente">${esc(usarLista ? cfg.etFrente : cfg.etFrente + ' o actividad')}</label><input id="jFrente" value="${esc(frente)}"></div>
        <div class="f"><label for="jTramo">${esc(cfg.etTramo)}</label><input id="jTramo" value="${esc(tramo)}"></div>`;
      $('#jFrente').oninput = e => { frente = e.target.value; };
      $('#jTramo').oninput = e => { tramo = e.target.value; };
    }
  }
  pintarLugar();
  if ($('#jModo')) $('#jModo').querySelectorAll('button').forEach(b => b.onclick = () => {
    const op = b.dataset.v === '1';
    if (op && !usarLista && frentesCat.length) {
      if (!frentesCat.includes(frente)) { frente = ''; tramo = ''; }
      else if (!Catalogo.tramos(cat, frente).includes(tramo)) tramo = '';
    }
    usarLista = op; pintarLugar();
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
    if (listaFrentes()) {
      const ts = Catalogo.tramos(cat, frente);
      if (!frentesCat.includes(frente)) { $('#jMsg').textContent = `Elige el ${cfg.etFrente.toLowerCase()} de la lista`; return; }
      if (ts.length && !ts.includes(tramo)) { $('#jMsg').textContent = `Elige el ${cfg.etTramo.toLowerCase()} de la lista`; return; }
    }
    const d = { fecha, turno, nombre: $('#jNombre').value.trim(), frente: frente.trim(), tramo: tramo.trim(), usaCatalogo: usarLista };
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
function chipsOpciones(id, opciones, elegido) {
  return `<div class="chips" id="${id}">${[...opciones, OTRO].map(o => `<button type="button" class="chip ${o === elegido ? 'on' : ''}" data-op="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
}

function formMixer(j, m) {
  if (!j) return;
  const cfg = E.cfg, campos = cfg.campos, locs = E.cat.elementos, hayLista = locs.length > 0;
  const nuevo = !m, n = nuevo ? j.mixers.length + 1 : j.mixers.indexOf(m) + 1;
  const ant = j.mixers.length ? j.mixers[j.mixers.length - 1] : null;
  const v = m || { codigo: '', llegada: T.ahora(), inicio: '', fin: '', cant: '', asPlanta: '', asObra: '', temp: '', loc: ant ? ant.loc : '', obs: '', extras: ant ? ant.extras || {} : {} };
  const [cod0, rem0] = Codigos.separar(v.codigo);
  const locG = (v.loc || '').trim();
  let locSel = !hayLista || !locG ? '' : locs.includes(locG) ? locG : OTRO;
  const ext = { ...(v.extras || {}) }, extOtro = {};
  campos.filter(c => c.tipo === 'LISTA').forEach(c => { const x = ext[c.id] || ''; if (x && !c.opciones.includes(x)) extOtro[c.id] = true; });

  const htmlExtras = campos.length ? '<div class="seccion">Datos adicionales</div>' + campos.map(c => {
    const val = ext[c.id] || '';
    if (c.tipo === 'NUMERO') return `<div class="f"><label for="x_${c.id}">${esc(tituloCampo(c))}</label><input id="x_${c.id}" data-x="${esc(c.id)}" inputmode="decimal" value="${esc(val)}"></div>`;
    if (c.tipo === 'TEXTO') return `<div class="f"><label for="x_${c.id}">${esc(tituloCampo(c))}</label><input id="x_${c.id}" data-x="${esc(c.id)}" value="${esc(val)}"></div>`;
    return `<div class="f"><label>${esc(tituloCampo(c))}</label>${chipsOpciones('xl_' + c.id, c.opciones, extOtro[c.id] ? OTRO : val)}
      <input id="xo_${c.id}" style="margin-top:8px;${extOtro[c.id] ? '' : 'display:none'}" placeholder="Otro: ${esc(c.nombre.toLowerCase())}" value="${esc(extOtro[c.id] ? val : '')}"></div>`;
  }).join('') : '';

  abrirSheet({
    titulo: nuevo ? `Mixer ${n}` : `Editar mixer ${n}`, alta: true,
    accion: { texto: 'Guardar', fn: () => guardar() },
    cuerpo: `<div class="fila2"><div class="f" id="fCod"><label for="mCod">Código mixer</label><input id="mCod" autocapitalize="characters" placeholder="MX-123" value="${esc(cod0)}"></div>
      <div class="f" id="fRem"><label for="mRem">N.° remisión</label><input id="mRem" inputmode="numeric" pattern="[0-9]*" value="${esc(rem0)}"></div></div>
      <div class="hint" id="mCodMsg" style="margin:-6px 0 10px;font-size:.84rem;color:var(--azul-medio)"></div>
      <div class="seccion">Horas</div>${campoHora('mLleg', 'Hora de llegada', v.llegada)}${campoHora('mIni', 'Hora inicio descargue', v.inicio)}${campoHora('mFin', 'Hora fin descargue', v.fin)}
      <div id="mAviso"></div>
      <div class="seccion">Concreto</div>
      <div class="fila2"><div class="f"><label for="mCant">Cantidad (m³)</label><input id="mCant" inputmode="decimal" value="${esc(v.cant)}"></div>
      <div class="f"><label for="mTemp">Temperatura (°C)</label><input id="mTemp" inputmode="decimal" value="${esc(v.temp)}"></div></div>
      ${campoAsent('mAsP', 'Asentamiento en planta (")', v.asPlanta)}${campoAsent('mAsO', 'Asentamiento en obra (")', v.asObra)}
      ${htmlExtras}
      <div class="msg" id="mNumMsg" style="color:var(--peligro);margin:-6px 0 10px"></div>
      <div class="seccion">Ubicación</div>
      ${hayLista ? `<div class="f"><label>${esc(cfg.etLoc)}</label>${chipsOpciones('mLocChips', locs, locSel)}
        <input id="mLocOtro" style="margin-top:8px;${locSel === OTRO ? '' : 'display:none'}" placeholder="Otra ${esc(cfg.etLoc.toLowerCase())} o actividad" value="${esc(locSel === OTRO ? locG : '')}">
        <div class="hint">Lista del catálogo cargado. Toca de nuevo para quitarla.</div></div>`
      : `<div class="f"><label for="mLoc">${esc(cfg.etLoc)}</label><input id="mLoc" value="${esc(locG)}"><div class="chips" id="mLocSug"></div></div>`}
      <div class="msg" id="mUbicMsg" style="color:var(--peligro);margin:-6px 0 10px"></div>
      <div class="f"><label for="mObs">Observación</label><textarea id="mObs" placeholder='Si la dejas vacía, el informe dirá "Sin observación"'>${esc(v.obs)}</textarea></div>
      <button class="btn prim ancho" id="mGuardar">${nuevo ? 'Guardar mixer' : 'Guardar cambios'}</button>
      ${nuevo ? '' : '<div style="height:10px"></div><button class="btn peligro ancho" id="mBorrar">Eliminar este mixer</button>'}<div style="height:20px"></div>`
  });
  const cuerpo = $('#sheetCuerpo');
  // código y remisión
  const vista = () => {
    const t = Codigos.juntar($('#mCod').value, $('#mRem').value);
    $('#mCodMsg').style.color = 'var(--azul-medio)';
    $('#mCodMsg').textContent = t ? `En el informe: ${t}` : 'El código va en mayúsculas; la remisión solo lleva números.';
  };
  $('#mCod').addEventListener('input', e => { const p = e.target.selectionStart; e.target.value = e.target.value.toUpperCase(); e.target.setSelectionRange(p, p); $('#fCod').classList.remove('err'); vista(); });
  $('#mRem').addEventListener('input', e => { e.target.value = Codigos.soloNumeros(e.target.value); $('#fRem').classList.remove('err'); vista(); });
  vista();
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
  // campos adicionales tipo lista
  campos.filter(c => c.tipo === 'LISTA').forEach(c => {
    const box = $('#xl_' + c.id), otro = $('#xo_' + c.id);
    box.onclick = e => {
      const b = e.target.closest('[data-op]'); if (!b) return;
      const ya = b.classList.contains('on');
      box.querySelectorAll('.chip').forEach(x => x.classList.remove('on'));
      if (ya) { ext[c.id] = ''; extOtro[c.id] = false; otro.style.display = 'none'; return; }
      b.classList.add('on');
      if (b.dataset.op === OTRO) { extOtro[c.id] = true; ext[c.id] = ''; otro.value = ''; otro.style.display = ''; otro.focus(); }
      else { extOtro[c.id] = false; ext[c.id] = b.dataset.op; otro.style.display = 'none'; }
    };
    otro.oninput = () => { ext[c.id] = otro.value; };
  });
  // localización
  if (hayLista) {
    const box = $('#mLocChips'), otro = $('#mLocOtro');
    box.onclick = e => {
      const b = e.target.closest('[data-op]'); if (!b) return;
      const ya = b.classList.contains('on');
      box.querySelectorAll('.chip').forEach(x => x.classList.remove('on'));
      $('#mUbicMsg').textContent = '';
      if (ya) { locSel = ''; otro.style.display = 'none'; return; }
      b.classList.add('on'); locSel = b.dataset.op;
      otro.style.display = locSel === OTRO ? '' : 'none';
      if (locSel === OTRO) otro.focus();
    };
  } else {
    const sug = sugerenciasLoc();
    const pintarSug = () => {
      const t = $('#mLoc').value.trim().toLowerCase();
      $('#mLocSug').innerHTML = sug.filter(s => s.toLowerCase() !== t && (!t || s.toLowerCase().includes(t))).slice(0, 10)
        .map(s => `<button type="button" class="chip" data-loc="${esc(s)}">${esc(s)}</button>`).join('');
    };
    $('#mLoc').addEventListener('input', pintarSug); pintarSug();
    $('#mLocSug').onclick = e => { const c = e.target.closest('[data-loc]'); if (c) { $('#mLoc').value = c.dataset.loc; pintarSug(); } };
  }
  $('#mGuardar').onclick = () => guardar();
  if (!nuevo) $('#mBorrar').onclick = () => confirmar('Eliminar mixer', `Se borrará el mixer ${m.codigo || n} y la foto de su remisión. Los demás conservan su orden.`, 'Eliminar', async () => {
    await borrarFoto(m.id);
    const nj = { ...j, mixers: j.mixers.filter(x => x.id !== m.id) };
    if (await guardarJ(nj)) { cerrarSheet(); render(); toast('Mixer eliminado'); }
  });

  async function guardar() {
    const cod = $('#mCod').value.trim(), rem = $('#mRem').value.trim();
    const errCod = t => { $('#fCod').classList.add('err'); $('#mCodMsg').style.color = 'var(--peligro)'; $('#mCodMsg').textContent = t; $('#mCod').focus(); };
    if (!cod && !rem) return errCod('Escribe el código del mixer o el número de remisión.');
    if (cod && !/^\p{L}/u.test(cod)) return errCod('El código del mixer debe comenzar con letras (ej. MX-123).');
    cuerpo.querySelectorAll('[data-x]').forEach(i => { ext[i.dataset.x] = i.value; });
    const vals = { cant: $('#mCant').value, temp: $('#mTemp').value, asP: $('#mAsP').value, asO: $('#mAsO').value };
    const malo = [['Cantidad', vals.cant], ['Temperatura', vals.temp]].find(([, x]) => x.trim() && T.num(x) == null);
    if (malo) { $('#mNumMsg').textContent = `${malo[0]} debe ser un número`; return; }
    const maloA = [['Asentamiento en planta', vals.asP], ['Asentamiento en obra', vals.asO]].find(([, x]) => x.trim() && T.pulgadas(x) == null);
    if (maloA) { $('#mNumMsg').textContent = `${maloA[0]}: escríbelo como 7, 7 1/4 o 7.25`; return; }
    const maloX = campos.find(c => c.tipo === 'NUMERO' && (ext[c.id] || '').trim() && T.num(ext[c.id]) == null);
    if (maloX) { $('#mNumMsg').textContent = `${maloX.nombre} debe ser un número`; return; }
    let loc;
    if (hayLista) {
      if (locSel === OTRO && !$('#mLocOtro').value.trim()) { $('#mUbicMsg').textContent = `Escribe la ${cfg.etLoc.toLowerCase()} (elegiste Otro...)`; return; }
      loc = locSel === OTRO ? $('#mLocOtro').value.trim() : locSel;
    } else loc = $('#mLoc').value.trim();
    const extras = {};
    Object.entries(m ? m.extras || {} : {}).forEach(([k, x]) => { if (!campos.some(c => c.id === k)) extras[k] = x; });
    campos.forEach(c => { const x = String(ext[c.id] || '').trim(); if (x) extras[c.id] = c.tipo === 'NUMERO' ? T.limpiar(x) : x; });
    const nm = {
      id: m ? m.id : T.uid(), codigo: Codigos.juntar(cod, rem), llegada: $('#mLleg').value, inicio: $('#mIni').value, fin: $('#mFin').value,
      cant: T.limpiar(vals.cant), temp: T.limpiar(vals.temp), asPlanta: T.normalizarPulg(vals.asP), asObra: T.normalizarPulg(vals.asO),
      loc, obs: $('#mObs').value.trim(), extras
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

/* ================= Finalizar: resumen, parámetros y estadísticas ================= */
function verResumen(j) {
  const cfg = E.cfg, filas = filasResumen(resumen(j, cfg), cfg);
  abrirSheet({
    titulo: 'Resumen de la jornada', alta: true,
    cuerpo: `<p style="margin-top:0;color:var(--azul);font-weight:600">${esc([T.fechaLarga(j.fecha), 'turno ' + j.turno.toLowerCase(), j.frente, j.tramo].filter(Boolean).join('  ·  '))}</p>
      ${j.mixers.some(m => !m.fin) ? '<div class="avisobox">Hay mixers sin hora de fin de descargue. Complétalos para que las estadísticas queden exactas.</div>' : ''}
      <div class="datos" style="padding:6px 14px">${filas.map(([k, v]) => `<div style="padding:8px 0;border-bottom:1px solid var(--linea)"><div style="font-size:.82rem;color:var(--azul-medio)">${esc(k)}</div><div style="font-weight:600;color:var(--azul)">${esc(v)}</div></div>`).join('')}</div>
      <div class="seccion">Generar informe</div>
      <div class="pila"><button class="btn prim ancho" id="xPdf">PDF (planilla para imprimir y firmar)</button>
      <button class="btn cian ancho" id="xXls">Excel (.xlsx)</button>
      <button class="btn sec ancho" id="xZip">Jornada completa con fotos (para otro teléfono)</button></div><div style="height:20px"></div>`
  });
  $('#xPdf').onclick = () => generar('PDF', () => generarPDF(j));
  $('#xXls').onclick = () => generar('Excel', async () => { const r = Excel.jornada(j, E.cfg); return { blob: new Blob(r.partes, { type: MIME_XLSX }), nombre: r.nombre }; });
  $('#xZip').onclick = () => generar('Archivo de jornada', () => exportarJornada(j));
}

/* ================= Pasar una jornada completa (con fotos) a otro teléfono ================= */
/* Mismo formato que la app de Android: .zip con jornada.json y fotos/<id del mixer>.jpg */
const TIPO_JORNADA = 'jornada-concreto-cec';
function jornadaAJson(j) {
  return {
    id: j.id, fecha: j.fecha, turno: j.turno, nombre: j.nombre, frente: j.frente, tramo: j.tramo, creada: j.creada,
    usaCatalogo: !!j.usaCatalogo,
    mixers: j.mixers.map(m => ({ id: m.id, codigo: m.codigo, llegada: m.llegada, inicio: m.inicio, fin: m.fin, cant: m.cant,
      asPlanta: m.asPlanta, asObra: m.asObra, temp: m.temp, loc: m.loc, obs: m.obs, extras: m.extras || {} }))
  };
}
function jornadaDesdeJson(o) {
  const txt = x => (x == null ? '' : String(x));
  if (!o || !o.id || !o.fecha) throw new Error('Datos incompletos');
  return {
    id: txt(o.id), fecha: txt(o.fecha), turno: o.turno === 'Noche' ? 'Noche' : 'Día', nombre: txt(o.nombre), frente: txt(o.frente), tramo: txt(o.tramo),
    creada: txt(o.creada) || new Date().toISOString(), usaCatalogo: !!o.usaCatalogo,
    mixers: (Array.isArray(o.mixers) ? o.mixers : []).map(m => {
      const ex = {}; if (m.extras && typeof m.extras === 'object') Object.entries(m.extras).forEach(([k, v]) => { if (v != null && String(v) !== '') ex[k] = String(v); });
      return { id: txt(m.id) || T.uid(), codigo: txt(m.codigo), llegada: txt(m.llegada), inicio: txt(m.inicio), fin: txt(m.fin), cant: txt(m.cant),
        asPlanta: txt(m.asPlanta), asObra: txt(m.asObra), temp: txt(m.temp), loc: txt(m.loc), obs: txt(m.obs), extras: ex };
    })
  };
}
async function exportarJornada(j) {
  const archivos = [{ nombre: 'jornada.json', datos: JSON.stringify({ tipo: TIPO_JORNADA, version: 1, exportada: new Date().toISOString(), jornada: jornadaAJson(j) }, null, 1) }];
  for (const m of j.mixers) {
    const reg = await DB.get('fotos', m.id);
    if (reg) archivos.push({ nombre: `fotos/${m.id}.jpg`, datos: new Uint8Array(await reg.blob.arrayBuffer()) });
  }
  const base = `Jornada ${j.fecha} ${j.turno} ${j.frente} ${j.tramo}`.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9+._-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80);
  return { blob: new Blob(zipStore(archivos), { type: 'application/zip' }), nombre: base + '.zip' };
}
async function guardarMiniDe(id, blob) {
  const c = await cargarImagen(blob, 240), mini = await aBlob(c, 'image/jpeg', 0.85);
  await DB.put('fotos', { id, blob }); await DB.put('minis', { id, blob: mini });
  const viejo = E.minis.get(id); if (viejo) URL.revokeObjectURL(viejo);
  E.minis.set(id, URL.createObjectURL(mini));
}
async function instalarJornada(j, fotos, reemplazar, ambas) {
  if (ambas) {
    const nid = T.uid(), mapa = {};
    j = { ...j, id: nid, creada: new Date().toISOString(), mixers: j.mixers.map(m => { const x = T.uid(); mapa[m.id] = x; return { ...m, id: x }; }) };
    const f2 = new Map(); fotos.forEach((v, k) => f2.set(mapa[k] || k, v)); fotos = f2;
  }
  if (reemplazar && !ambas) {
    for (const m of reemplazar.mixers) await borrarFoto(m.id);
    await DB.del('jornadas', reemplazar.id); E.jornadas = E.jornadas.filter(x => x.id !== reemplazar.id);
  }
  if (!ambas) for (const m of j.mixers) await borrarFoto(m.id);
  if (!(await guardarJ(j))) return;
  let n = 0;
  for (const [id, bytes] of fotos) { try { await guardarMiniDe(id, new Blob([bytes], { type: 'image/jpeg' })); n++; } catch (e) { console.error(e); } }
  irA({ n: 'jornada', id: j.id }); toast(`Jornada importada: ${j.mixers.length} mixers y ${n} fotos`);
}
$('#inJornada').onchange = async e => {
  const f = e.target.files && e.target.files[0]; if (!f) return;
  try {
    const z = leerZip(new Uint8Array(await f.arrayBuffer())), js = z.get('jornada.json');
    if (!js) throw new Error();
    const o = JSON.parse(new TextDecoder().decode(js));
    if (o.tipo !== TIPO_JORNADA) throw new Error();
    const j = jornadaDesdeJson(o.jornada), ids = new Set(j.mixers.map(m => m.id)), fotos = new Map();
    z.forEach((v, k) => { const mm = k.replace(/^\//, '').match(/^fotos\/(.+)\.jpg$/); if (mm && ids.has(mm[1])) fotos.set(mm[1], v); });
    const choque = E.jornadas.find(x => x.id === j.id) || E.jornadas.find(x => x.fecha === j.fecha && x.turno === j.turno && x.frente === j.frente && x.tramo === j.tramo);
    if (!choque) return instalarJornada(j, fotos, null, false);
    abrirSheet({
      titulo: 'Esta jornada ya existe',
      cuerpo: `<p style="margin-top:0">Ya tienes la jornada del ${T.fechaCorta(choque.fecha)}, turno ${choque.turno.toLowerCase()}${choque.frente ? ', ' + esc(choque.frente) : ''} (${choque.mixers.length} mixers).
        La que llega trae ${j.mixers.length} mixers y ${fotos.size} fotos. ¿Qué quieres hacer?</p>
        <div class="pila"><button class="btn prim ancho" id="iRee">Reemplazar la que ya tengo</button><button class="btn sec ancho" id="iAmb">Conservar las dos</button></div><div style="height:16px"></div>`
    });
    $('#iRee').onclick = () => { cerrarSheet(); instalarJornada(j, fotos, choque, false); };
    $('#iAmb').onclick = () => { cerrarSheet(); instalarJornada(j, fotos, null, true); };
  } catch (err) { console.error(err); toast('Ese archivo no es una jornada exportada desde esta app'); }
};

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
  const PW = 792, PH = 612, M = 28, K = 2.5, cfg = E.cfg, r = resumen(j, cfg);
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
  celda(M, y, 120, 46, E.logo ? '' : cfg.empresa.toUpperCase(), { size: 8, bold: true, color: AZUL, align: 'center' });
  if (E.logo) {
    const lg = await imagenDe(E.logo.blob), s = Math.min(108 / lg.naturalWidth, 36 / lg.naturalHeight);
    ctx.drawImage(lg, M + (120 - lg.naturalWidth * s) / 2, y + (46 - lg.naturalHeight * s) / 2, lg.naturalWidth * s, lg.naturalHeight * s);
  }
  celda(M + 120, y, ancho - 240, 46, cfg.titulo + (cfg.proyecto ? '\n' + cfg.proyecto : ''), { size: cfg.proyecto ? 11.5 : 13, bold: true, color: AZUL, align: 'center' });
  celda(M + ancho - 120, y, 120, 46, cfg.codigoFormato, { size: 10, bold: true, color: AZUL, align: 'center' });
  y += 46;
  const wI = [56, 220, 50, 180, 50, 180];
  const filaInfo = tx => { let x = M; tx.forEach((t, i) => { celda(x, y, wI[i], 18, t, i % 2 === 0 ? { size: 8, bold: true, color: AZUL, fondo: CLARO } : { size: 8.5 }); x += wI[i]; }); y += 18; };
  filaInfo(['Nombre:', j.nombre, cfg.etFrente + ':', j.frente, cfg.etTramo + ':', j.tramo]);
  filaInfo(['Fecha:', `${T.fechaCorta(j.fecha)}  (${T.fechaLarga(j.fecha)})`, 'Turno:', j.turno === 'Noche' ? 'Día [   ]      Noche [ X ]' : 'Día [ X ]      Noche [   ]', '', '']);
  y += 8;
  // Tabla
  const cols = [38, 78, 50, 56, 52, 40, 58, 58, 54, 120, 132];
  const tit = ['Orden\nllegada', 'Código mixer /\nremisión', 'Hora\nllegada', 'Hora inicio\ndescargue', 'Hora fin\ndescargue', 'Cant.\n(m³)', 'Asentamiento\nen planta (")', 'Asentamiento\nen obra (")', 'Temperatura\n(°C)', cfg.etLoc, 'Observación'];
  const centradas = new Set([0, 2, 3, 4, 5, 6, 7, 8]);
  const encabezado = () => { let x = M; tit.forEach((t, i) => { celda(x, y, cols[i], 30, t, { size: 7, bold: true, color: '#fff', align: 'center', fondo: AZUL }); x += cols[i]; }); y += 30; };
  encabezado();
  const filas = j.mixers.map((m, i) => [String(i + 1), m.codigo, m.llegada, m.inicio, m.fin, m.cant ? T.fmt(T.num(m.cant), 2) : '', m.asPlanta, m.asObra, m.temp, m.loc, m.obs || 'Sin observación']);
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
  // Datos adicionales configurables (tabla aparte, 8 campos por tabla)
  const pTit = { size: 7, bold: true, color: '#fff', align: 'center', fondo: AZUL };
  for (let g = 0; g < cfg.campos.length && j.mixers.length; g += 8) {
    const grupo = cfg.campos.slice(g, g + 8), wc = (ancho - 138) / grupo.length, an = [38, 100, ...grupo.map(() => wc)];
    const tits = ['Orden', 'Código mixer /\nremisión', ...grupo.map(tituloCampo)];
    const hTit = Math.max(26, ...tits.map((t, i) => alto(t, 7, an[i])));
    const encX = () => {
      if (y + 16 + hTit + 18 > limite) { nueva(); y = M; }
      celda(M, y, ancho, 16, 'Datos adicionales por mixer', { size: 8.5, bold: true, color: '#fff', fondo: AZUL }); y += 16;
      let x = M; tits.forEach((t, i) => { celda(x, y, an[i], hTit, t, pTit); x += an[i]; }); y += hTit;
    };
    encX();
    j.mixers.forEach((m, i) => {
      const f = [String(i + 1), m.codigo, ...grupo.map(c => (m.extras || {})[c.id] || '')];
      const h = Math.max(16, ...f.map((t, k) => alto(t, 8, an[k])));
      if (y + h > limite) { nueva(); y = M; encX(); }
      let x = M; f.forEach((t, k) => { celda(x, y, an[k], h, t, { size: 8, align: k === 1 ? 'left' : 'center' }); x += an[k]; }); y += h;
    });
    y += 14;
  }
  // Resumen, parámetros y estadísticas + firmas
  const datos = filasResumen(r, cfg), wK = 230, wV = 330;
  const altos = datos.map(([k, v]) => Math.max(14, alto(k, 7.6, wK), alto(v, 7.8, wV)));
  if (y + 16 + altos.slice(0, 6).reduce((a, b) => a + b, 0) > limite) { nueva(); y = M; }
  celda(M, y, wK + wV, 16, 'Resumen, parámetros y estadísticas de la jornada', { size: 8.5, bold: true, color: '#fff', fondo: AZUL });
  let yy = y + 16, yIni = y;
  datos.forEach(([k, v], i) => {
    const h = altos[i];
    if (yy + h > limite) { nueva(); yy = M; yIni = M; }
    celda(M, yy, wK, h, k, { size: 7.6, bold: true, color: AZUL, fondo: CLARO }); celda(M + wK, yy, wV, h, v, { size: 7.8 }); yy += h;
  });
  if (yy - yIni < 90) { if (yIni + 100 > limite) { nueva(); yIni = M; } yy = yIni + 100; }
  const sx = M + wK + wV + 20, sw = ancho - wK - wV - 20, sy = yy - 10, sy1 = Math.max(sy - 60, yIni + 30);
  ctx.strokeStyle = LINEA; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(sx, sy1); ctx.lineTo(sx + sw, sy1); ctx.moveTo(sx, sy); ctx.lineTo(sx + sw, sy); ctx.stroke();
  ctx.fillStyle = TINTA; ctx.font = fuente(8); ctx.textAlign = 'left';
  ctx.fillText('Elaboró' + (j.nombre ? `: ${j.nombre}` : ''), sx, sy1 + 12); ctx.fillText('Revisó / Vo. Bo.', sx, sy + 12);
  // Anexo de remisiones (2 por página)
  const conFoto = j.mixers.map((m, i) => ({ m, n: i + 1 })).filter(x => E.minis.has(x.m.id));
  for (let k = 0; k < conFoto.length; k += 2) {
    nueva();
    ctx.fillStyle = AZUL; ctx.font = fuente(12, true); ctx.textAlign = 'left'; ctx.fillText('ANEXO – REMISIONES DE PLANTA', M, M + 12);
    ctx.fillStyle = LINEA; ctx.font = fuente(8.5); ctx.fillText(`Jornada ${T.fechaCorta(j.fecha)}, turno ${j.turno.toLowerCase()}${j.tramo ? ', ' + cfg.etTramo.toLowerCase() + ' ' + j.tramo : ''}`, M, M + 26);
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
  const base = `Concreto_${j.fecha}_${j.turno}` + (j.tramo ? `_${cfg.etTramo}-${j.tramo}` : '');
  return { blob: new Blob(pdfDeJpegs(salida, PW, PH), { type: MIME_PDF }), nombre: T.nombreArchivo(base, '.pdf') };
}

/* ================= Menú, logo y copias de seguridad ================= */
function menu() {
  const nM = E.jornadas.reduce((s, j) => s + j.mixers.length, 0), cfg = E.cfg;
  abrirSheet({
    titulo: 'Opciones',
    cuerpo: `<div class="lista">
      <button id="oLogo">${E.logo ? 'Cambiar logo' : 'Agregar logo de la empresa'}</button>
      ${E.logo ? '<button id="oQuitar">Quitar logo</button>' : ''}
      <button id="oConfig">Configuración de la app y del informe</button>
      <button id="oCat">Catálogo (${esc(cfg.etFrente.toLowerCase())}s, ${esc(cfg.etTramo.toLowerCase())}s y ${esc(cfg.etLoc.toLowerCase())})</button>
      <button id="oImpJ">Importar jornada de otro teléfono</button>
      <button id="oHist">Exportar historial a Excel</button>
      <button id="oResp">Guardar copia de seguridad</button>
      <button id="oRest">Restaurar copia de seguridad</button>
      <p>Los registros se guardan en este iPhone (${E.jornadas.length} jornadas, ${nM} mixers). La copia de seguridad guarda los datos, no las fotos, y es compatible con la app de Android. Para pasar una jornada con sus fotos usa “Finalizar y resumen” → “Jornada completa con fotos”.</p></div>`
  });
  $('#oLogo').onclick = () => { cerrarSheet(); $('#inLogo').click(); };
  if (E.logo) $('#oQuitar').onclick = async () => { await DB.del('ajustes', 'logo'); ponerLogo(null); cerrarSheet(); render(); toast('Logo quitado'); };
  $('#oConfig').onclick = () => { cerrarSheet(); conAdmin('cambiar la configuración', pantallaConfig); };
  $('#oCat').onclick = () => pantallaCatalogo();
  $('#oImpJ').onclick = () => { cerrarSheet(); conAdmin('importar una jornada', () => { const i = $('#inJornada'); i.value = ''; i.click(); }); };
  $('#oHist').onclick = () => {
    if (!E.jornadas.some(j => j.mixers.length)) { cerrarSheet(); toast('Todavía no hay mixers registrados'); return; }
    generar('Excel', async () => { const r = Excel.historial(E.jornadas, E.cfg); return { blob: new Blob(r.partes, { type: MIME_XLSX }), nombre: r.nombre }; });
  };
  $('#oResp').onclick = () => {
    const datos = { app: 'control-concreto', version: 1, jornadas: E.jornadas.map(jornadaAJson) };
    compartirArchivo(new Blob([JSON.stringify(datos, null, 1)], { type: 'application/json' }), `respaldo_concreto_${T.hoy()}.json`);
  };
  $('#oRest').onclick = () => { cerrarSheet(); conAdmin('restaurar una copia de seguridad', () => { const i = $('#inRespaldo'); i.value = ''; i.click(); }); };
}

/* ================= Catálogo: frentes, tramos y localizaciones ================= */
let msgCatalogo = '';
function pantallaCatalogo() {
  const cfg = E.cfg, cat = E.cat, fr = cfg.etFrente.toLowerCase(), tr = cfg.etTramo.toLowerCase(), lo = cfg.etLoc.toLowerCase();
  const porFrente = {}; cat.items.forEach(i => (porFrente[i.frente] = porFrente[i.frente] || []).push(i.tramo));
  const nF = Object.keys(porFrente).length;
  abrirSheet({
    titulo: 'Catálogo', alta: true, onCerrar: () => { msgCatalogo = ''; },
    cuerpo: `<p style="margin-top:0;color:var(--suave);font-size:.92rem">Lista fija de ${esc(fr)}s con sus ${esc(tr)}s, y la lista de ${esc(lo)} (HD, HI, BV… o lo que necesites).
        Al crear una jornada podrás elegir de la lista o escribir otro ${esc(fr)} o actividad. Sin catálogo, la app funciona igual que siempre.</p>
      ${msgCatalogo ? `<div class="avisobox">${esc(msgCatalogo)}</div>` : ''}
      <div class="seccion">1. Escribirlo en la app (recomendado)</div>
      <p style="margin:0 0 10px;color:var(--suave);font-size:.9rem">No necesita archivos. Sirve también con teléfonos o cuentas de empresa donde Microsoft protege (cifra) los archivos de Excel.</p>
      <button class="btn prim ancho" id="cEsc">${hayCatalogo() ? 'Editar catálogo' : 'Escribir catálogo'}</button>
      <div class="seccion">2. O cargarlo desde un archivo</div>
      <p style="margin:0 0 10px;color:var(--suave);font-size:.9rem">Columnas: ${esc(cfg.etFrente)} | ${esc(cfg.etTramo)} | ${esc(cfg.etLoc)}. Repite el ${esc(fr)} en cada ${esc(tr)} que le pertenece. La columna ${esc(cfg.etLoc)} es una lista aparte (una por fila).</p>
      <div class="fila2"><button class="btn sec" id="cPlX">Plantilla Excel</button><button class="btn sec" id="cPlC">Plantilla CSV</button></div>
      <div style="height:10px"></div><button class="btn sec ancho" id="cCargar">Cargar archivo (reemplaza el catálogo actual)</button>
      ${hayCatalogo() ? `<div class="seccion">Catálogo actual</div>
        <p style="margin:0 0 8px;font-weight:600;color:var(--azul)">${nF} ${esc(fr)}${nF === 1 ? '' : 's'}  ·  ${cat.elementos.length} opciones de ${esc(lo)}</p>
        ${Object.entries(porFrente).map(([f, ts]) => { const t2 = [...new Set(ts.filter(Boolean))]; return `<div class="datos" style="margin-bottom:8px"><b style="color:var(--azul)">${esc(f)}</b><div style="color:var(--suave);font-size:.9rem;margin-top:3px">${t2.length ? `${t2.length} ${esc(tr)}${t2.length === 1 ? '' : 's'}: ${esc(t2.join(', '))}` : `Sin ${esc(tr)}s`}</div></div>`; }).join('')}
        <div class="datos" style="margin-bottom:8px"><b style="color:var(--azul)">${esc(cfg.etLoc)}</b><div style="color:var(--suave);font-size:.9rem;margin-top:3px">${cat.elementos.length ? esc(cat.elementos.join(' · ') + ' · ' + OTRO) : 'Sin lista: se escribe libre en cada mixer.'}</div></div>
        <button class="btn peligro ancho" id="cBorrar">Eliminar catálogo</button>` : ''}<div style="height:20px"></div>`
  });
  $('#cEsc').onclick = () => editorCatalogo();
  $('#cPlX').onclick = () => compartirArchivo(plantillaXlsx(), 'plantilla_frentes_tramos.xlsx');
  $('#cPlC').onclick = () => compartirArchivo(plantillaCsv(), 'plantilla_frentes_tramos.csv');
  $('#cCargar').onclick = () => conAdmin('cargar el catálogo', () => { const i = $('#inCatalogo'); i.value = ''; i.click(); });
  if (hayCatalogo()) $('#cBorrar').onclick = () => conAdmin('eliminar el catálogo', () => confirmar('Eliminar catálogo',
    'Se borrará el catálogo. Las jornadas ya registradas no se modifican. Después podrás cargar uno nuevo.', 'Eliminar', async () => {
      await guardarCat({ items: [], elementos: [] }); msgCatalogo = 'Catálogo eliminado. Ya puedes cargar uno nuevo.'; pantallaCatalogo();
    }));
}
function mensajeCat(res, verbo) {
  const nF = new Set(res.items.map(i => i.frente)).size, nT = res.items.filter(i => i.tramo).length, c = E.cfg;
  return `Catálogo ${verbo}: ${nF} ${c.etFrente.toLowerCase()}s, ${nT} ${c.etTramo.toLowerCase()}s y ${res.elementos.length} opciones de ${c.etLoc.toLowerCase()}.` +
    (res.omitidas ? ` Se omitieron ${res.omitidas} filas sin ${c.etFrente.toLowerCase()}.` : '');
}
function editorCatalogo() {
  const cfg = E.cfg;
  abrirSheet({
    titulo: 'Escribir catálogo', alta: true, accion: { texto: 'Guardar', fn: () => guardar() },
    cuerpo: `<div class="f"><label for="ecF">${esc(cfg.etFrente)}s y ${esc(cfg.etTramo.toLowerCase())}s</label>
        <div class="hint" style="margin:0 0 6px">Un renglón por ${esc(cfg.etTramo.toLowerCase())}: ${esc(cfg.etFrente)} ; ${esc(cfg.etTramo)}<br>Ejemplo: TUNEL 0 ; Tramo 1</div>
        <textarea id="ecF" rows="9" autocapitalize="characters" placeholder="TUNEL 0 ; Tramo 1&#10;TUNEL 0 ; Tramo 2&#10;TUNEL 1 ; Tramo 1">${esc(Catalogo.textoFrentes(E.cat))}</textarea></div>
      <div class="f"><label for="ecL">${esc(cfg.etLoc)}</label>
        <div class="hint" style="margin:0 0 6px">Una por renglón. Ejemplo: HD, HI, BV, BV-HD, BV-HI, Ambos hastiales, Revestimiento completo. "Otro..." se agrega solo.</div>
        <textarea id="ecL" rows="8" placeholder="HD&#10;HI&#10;BV">${esc(E.cat.elementos.join('\n'))}</textarea></div>
      <div class="msg" id="ecMsg" style="color:var(--peligro);margin-bottom:10px"></div>
      <button class="btn prim ancho" id="ecOk">Guardar catálogo</button><div style="height:20px"></div>`
  });
  $('#ecOk').onclick = () => guardar();
  function guardar() {
    let res;
    try { res = Catalogo.desdeTexto($('#ecF').value, $('#ecL').value); } catch (e) { $('#ecMsg').textContent = e.message; return; }
    conAdmin('guardar el catálogo', async () => {
      await guardarCat({ items: res.items, elementos: res.elementos }); msgCatalogo = mensajeCat(res, 'guardado'); pantallaCatalogo();
    });
  }
}
$('#inCatalogo').onchange = async e => {
  const f = e.target.files && e.target.files[0]; if (!f) return;
  try {
    const res = Catalogo.leer(await f.arrayBuffer());
    await guardarCat({ items: res.items, elementos: res.elementos }); msgCatalogo = mensajeCat(res, 'cargado');
  } catch (err) { msgCatalogo = err && err.message ? err.message : 'No se pudo leer ese archivo. Usa la plantilla (Excel .xlsx o CSV).'; }
  pantallaCatalogo();
};
const EJEMPLO_CAT = [['TUNEL 0', 'Tramo 1', 'HD'], ['TUNEL 0', 'Tramo 2', 'HI'], ['TUNEL 0', 'Tramo 3', 'BV'], ['TUNEL 1', 'Tramo 1', 'BV-HD'],
  ['TUNEL 1', 'Tramo 2', 'BV-HI'], ['PUENTE 2', 'Pila 1', 'Ambos hastiales'], ['PUENTE 2', 'Pila 2', 'Revestimiento completo']];
function plantillaCsv() {
  const c = E.cfg, filas = [[c.etFrente, c.etTramo, c.etLoc], ...EJEMPLO_CAT];
  return new Blob(['\uFEFF' + filas.map(f => f.join(';')).join('\r\n') + '\r\n'], { type: 'text/csv' });
}
function plantillaXlsx() {
  const c = E.cfg, h = Excel.hoja('Catalogo', [20, 20, 28]);
  h.congelar = 1;
  h.fila([c.etFrente, c.etTramo, c.etLoc].map(t => Excel.c(t, X.ENC)), 22);
  EJEMPLO_CAT.forEach(f => h.fila(f.map(t => Excel.c(t, X.TEXTO))));
  const ins = Excel.hoja('Instrucciones', [120]);
  ['CÓMO LLENAR EL CATÁLOGO', '', '1. Llena SOLO la hoja Catalogo. No cambies los títulos de la fila 1.',
    `2. Columnas A y B: un renglón por cada ${c.etTramo.toLowerCase()}, con su ${c.etFrente.toLowerCase()} en la columna A. Si dejas el ${c.etFrente.toLowerCase()} vacío, se usa el de arriba.`,
    `3. Columna C (${c.etLoc}): es una LISTA APARTE, una opción por fila. "Otro..." lo agrega la app sola.`,
    '4. Guarda como Excel (.xlsx) o CSV y cárgalo en: menú → Catálogo → Cargar archivo.', '',
    'Teléfonos o cuentas de empresa: Microsoft cifra los archivos que salen de Outlook, Teams u OneDrive del trabajo.',
    'En ese caso usa "Escribir catálogo" dentro de la app.'].forEach(t => ins.fila([Excel.c(t, X.NORMAL)]));
  return new Blob(Excel.libro([h, ins]), { type: MIME_XLSX });
}

/* ================= Configuración de la app y del informe ================= */
function pantallaConfig() {
  let c = JSON.parse(JSON.stringify(E.cfg));
  const campoTxt = (id, label, val, ayuda, num) => `<div class="f"><label for="${id}">${label}</label><input id="${id}" value="${esc(val)}" ${num ? 'inputmode="decimal"' : ''}>${ayuda ? `<div class="hint">${ayuda}</div>` : ''}</div>`;
  const listaCampos = () => c.campos.length ? c.campos.map((f, i) => `<div class="datos" style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:10px 12px">
      <div style="flex:1"><b style="color:var(--azul)">${esc(tituloCampo(f))}</b><div style="color:var(--suave);font-size:.82rem">${TIPOS_CAMPO[f.tipo]}${f.tipo === 'LISTA' ? ': ' + esc(f.opciones.join(', ')) : ''}${f.estadistica ? '  ·  en estadísticas' : ''}</div></div>
      <button class="ico" style="color:var(--azul)" data-ed="${i}" aria-label="Editar campo">${I.editar}</button><button class="ico" style="color:var(--peligro)" data-del="${i}" aria-label="Quitar campo">${I.basura}</button></div>`).join('')
    : '<p style="color:var(--suave);margin:4px 0 8px">No hay campos adicionales.</p>';
  const leer = () => {
    const g = id => $('#' + id).value.trim();
    c = { ...c, empresa: g('cEmp'), proyecto: g('cPro'), titulo: g('cTit'), codigoFormato: g('cCod'), area: g('cArea'),
      etFrente: g('cEtF'), etTramo: g('cEtT'), etLoc: g('cEtL'), asentMin: g('cAMin'), asentMax: g('cAMax'), tempMin: g('cTMin'), tempMax: g('cTMax'), esperaMax: g('cEsp') };
  };
  function pintar() {
    abrirSheet({
      titulo: 'Configuración', alta: true, accion: { texto: 'Guardar', fn: () => guardar() },
      cuerpo: `<p style="margin-top:0;color:var(--suave);font-size:.9rem">Adapta la app a cualquier obra: túnel, puente, obras hidráulicas, taludes, edificaciones. Los cambios aplican a los informes que generes desde ahora; lo ya registrado no se modifica.</p>
        <div class="seccion">Encabezado del informe</div>
        ${campoTxt('cEmp', 'Empresa', c.empresa)}${campoTxt('cPro', 'Proyecto u obra', c.proyecto, 'Opcional. Aparece bajo el título')}
        ${campoTxt('cTit', 'Título del formato', c.titulo)}${campoTxt('cCod', 'Código del formato', c.codigoFormato, 'Ej. PS-TUNEL 011, PS-PUENTE 004')}
        ${campoTxt('cArea', 'Área o actividad', c.area, 'Se muestra en la pantalla de inicio')}
        <div class="seccion">Nombres de los campos</div>
        ${campoTxt('cEtF', 'En vez de "Frente"', c.etFrente, 'Ej. Frente, Estructura, Obra')}${campoTxt('cEtT', 'En vez de "Tramo"', c.etTramo, 'Ej. Tramo, Pila, Eje, Módulo')}
        ${campoTxt('cEtL', 'En vez de "Localización"', c.etLoc, 'Ej. Localización, Elemento, Ubicación')}
        <div class="seccion">Especificaciones (para las estadísticas)</div>
        <p style="margin:0 0 8px;color:var(--suave);font-size:.88rem">Déjalas vacías si no aplican. El resumen cuenta los mixers fuera de rango.</p>
        <div class="fila2">${campoTxt('cAMin', 'Asent. mínimo (")', c.asentMin, '', true)}${campoTxt('cAMax', 'Asent. máximo (")', c.asentMax, '', true)}</div>
        <div class="fila2">${campoTxt('cTMin', 'Temp. mínima (°C)', c.tempMin, '', true)}${campoTxt('cTMax', 'Temp. máxima (°C)', c.tempMax, '', true)}</div>
        ${campoTxt('cEsp', 'Espera máxima aceptable (min)', c.esperaMax, 'Los mixers con más espera se cuentan aparte', true)}
        <div class="seccion">Campos adicionales por mixer</div>
        <p style="margin:0 0 8px;color:var(--suave);font-size:.88rem">Aditivos, fibras, dosis, resistencia, agua adicionada, cilindros… Aparecen en el formulario del mixer, en una tabla aparte del PDF, en el Excel y en las estadísticas.</p>
        <div id="cCampos">${listaCampos()}</div>
        <div class="fila2"><button class="btn sec" id="cAdd">Agregar campo</button><button class="btn sec" id="cSug">Agregar sugeridos</button></div>
        <div class="hint" style="margin-top:6px;color:var(--suave);font-size:.8rem">Sugeridos: resistencia f'c, tipo de concreto, aditivo y dosis, fibra y dosis, agua adicionada, cilindros y equipo de colocación. Quita los que no uses.</div>
        <div class="msg" id="cMsg" style="color:var(--peligro);margin:12px 0"></div>
        <button class="btn prim ancho" id="cOk">Guardar configuración</button>
        <button class="btn sec ancho" id="cRes" style="margin-top:10px">Restablecer textos originales (no borra los campos)</button><div style="height:20px"></div>`
    });
    $('#cOk').onclick = () => guardar();
    $('#cRes').onclick = () => { const b = CONFIG_BASE; c = { ...b, campos: c.campos }; pintar(); };
    $('#cAdd').onclick = () => { leer(); editorCampo({ id: T.uid(), nombre: '', tipo: 'NUMERO', unidad: '', opciones: [], estadistica: true }, nuevo => { c.campos.push(nuevo); pintar(); }); };
    $('#cSug').onclick = () => {
      leer();
      const nuevos = CAMPOS_SUGERIDOS.filter(s => !c.campos.some(f => f.id === s.id || f.nombre.toLowerCase() === s.nombre.toLowerCase()));
      c.campos = [...c.campos, ...JSON.parse(JSON.stringify(nuevos))]; pintar();
      if (!nuevos.length) $('#cMsg').textContent = 'Los campos sugeridos ya están agregados';
    };
    $('#cCampos').onclick = e => {
      const b = e.target.closest('button'); if (!b) return; leer();
      if (b.dataset.del != null) { c.campos.splice(+b.dataset.del, 1); pintar(); }
      else if (b.dataset.ed != null) { const i = +b.dataset.ed; editorCampo(c.campos[i], nuevo => { c.campos[i] = nuevo; pintar(); }); }
    };
  }
  async function guardar() {
    leer();
    const m = t => { $('#cMsg').textContent = t; };
    const malA = [['Asentamiento mínimo', c.asentMin], ['Asentamiento máximo', c.asentMax]].find(([, x]) => x && T.pulgadas(x) == null);
    if (malA) return m(`${malA[0]}: escríbelo como 6, 6 1/2 o 6.5`);
    const malT = [['Temperatura mínima', c.tempMin], ['Temperatura máxima', c.tempMax]].find(([, x]) => x && T.num(x) == null);
    if (malT) return m(`${malT[0]} debe ser un número`);
    const esp = parseInt(c.esperaMax, 10);
    if (!(esp >= 1)) return m('La espera máxima debe ser un número entero de minutos');
    const nueva = cfgDesde({ ...c, titulo: c.titulo || CONFIG_BASE.titulo, asentMin: c.asentMin ? T.normalizarPulg(c.asentMin) : '', asentMax: c.asentMax ? T.normalizarPulg(c.asentMax) : '',
      tempMin: T.limpiar(c.tempMin), tempMax: T.limpiar(c.tempMax), esperaMax: esp });
    await guardarCfg(nueva); cerrarSheet(); render(); toast('Configuración guardada');
  }
  pintar();
}
function editorCampo(inicial, listo) {
  let tipo = inicial.tipo;
  const d = document.createElement('div');
  d.className = 'modal';
  d.innerHTML = `<div class="caja" role="dialog" aria-modal="true" style="max-height:85vh;overflow:auto"><h3>${inicial.nombre ? 'Editar campo' : 'Nuevo campo'}</h3>
    <div class="f"><label for="ecNom">Nombre</label><input id="ecNom" value="${esc(inicial.nombre)}" placeholder="Ej. Aditivo, Dosis de fibra"></div>
    <div class="f"><label>Tipo</label><div class="pila" id="ecTipo">${Object.entries(TIPOS_CAMPO).map(([k, v]) => `<button type="button" class="chip" data-t="${k}" style="text-align:center">${v}</button>`).join('')}</div></div>
    <div class="f" id="ecUni"><label for="ecU">Unidad (opcional)</label><input id="ecU" value="${esc(inicial.unidad)}" placeholder="Ej. L/m³, kg/m³, MPa"></div>
    <div class="f" id="ecOps"><label for="ecO">Opciones (una por renglón)</label><textarea id="ecO" rows="4">${esc(inicial.opciones.join('\n'))}</textarea><div class="hint">"Otro..." se agrega solo al final.</div></div>
    <label style="display:flex;gap:8px;align-items:center;margin:0 0 12px"><input type="checkbox" id="ecEst" ${inicial.estadistica ? 'checked' : ''}> Incluir en estadísticas</label>
    <div class="msg" id="ecM" style="color:var(--peligro);min-height:1.2em;margin-bottom:8px"></div>
    <div class="fila"><button class="btn sec" data-no>Cancelar</button><button class="btn prim" data-si>Listo</button></div></div>`;
  document.body.appendChild(d);
  const pintar = () => {
    d.querySelectorAll('[data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === tipo));
    d.querySelector('#ecUni').style.display = tipo === 'NUMERO' ? '' : 'none';
    d.querySelector('#ecOps').style.display = tipo === 'LISTA' ? '' : 'none';
  };
  d.querySelector('#ecTipo').onclick = e => { const b = e.target.closest('[data-t]'); if (b) { tipo = b.dataset.t; pintar(); } };
  pintar();
  d.querySelector('[data-no]').onclick = () => d.remove();
  d.querySelector('[data-si]').onclick = () => {
    const nombre = d.querySelector('#ecNom').value.trim();
    const ops = [...new Set(d.querySelector('#ecO').value.split(/\r?\n/).map(x => x.trim()).filter(x => x && x.toLowerCase() !== OTRO.toLowerCase()))];
    if (!nombre) { d.querySelector('#ecM').textContent = 'Escribe el nombre del campo'; return; }
    if (tipo === 'LISTA' && !ops.length) { d.querySelector('#ecM').textContent = 'Escribe al menos una opción'; return; }
    d.remove();
    listo({ id: inicial.id, nombre, tipo, unidad: tipo === 'NUMERO' ? d.querySelector('#ecU').value.trim() : '', opciones: tipo === 'LISTA' ? ops : [], estadistica: d.querySelector('#ecEst').checked });
  };
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
    let n = 0;
    for (const o of d.jornadas) {
      let j; try { j = jornadaDesdeJson(o); } catch (x) { continue; }
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
  if (!esNativo() && 'serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { });
})();
