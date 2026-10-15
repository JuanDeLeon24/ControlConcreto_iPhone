/* Control Concreto – lógica pura (utilidades, resumen, escáner, Excel, PDF). Sin dependencias. */
'use strict';

/* ================= Utilidades ================= */
const T = {
  nf: {},
  fmt(d, dec = 1) {
    if (d == null || isNaN(d)) return '';
    const k = 'd' + dec;
    if (!T.nf[k]) T.nf[k] = new Intl.NumberFormat('es-CO', { maximumFractionDigits: dec, minimumFractionDigits: 0 });
    return T.nf[k].format(d);
  },
  uid() { return (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)); },
  hoy() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); },
  ahora() { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); },
  turnoActual() { const h = new Date().getHours(); return (h >= 18 || h < 6) ? 'Noche' : 'Día'; },
  toMin(t) { if (!t) return null; const p = String(t).split(':'); const h = parseInt(p[0], 10), m = parseInt(p[1], 10); return isNaN(h) || isNaN(m) ? null : h * 60 + m; },
  diff(a, b) { const x = T.toMin(a), y = T.toMin(b); if (x == null || y == null) return null; let d = y - x; if (d < 0) d += 1440; return d; },
  num(s) { if (s == null) return null; const t = String(s).trim().replace(',', '.'); if (t === '') return null; const n = Number(t); return isFinite(n) ? n : null; },
  limpiar(s) { return String(s == null ? '' : s).trim().replace(',', '.'); },
  dur(m) { if (m == null) return '–'; const t = Math.round(m), h = Math.floor(t / 60), r = t % 60; return h > 0 ? `${h} h ${String(r).padStart(2, '0')} min` : `${r} min`; },
  rango(a, b, u) { if (a == null || b == null) return '–'; return a === b ? T.fmt(a) + u : `${T.fmt(a)} a ${T.fmt(b)}${u}`; },

  /* Asentamiento en pulgadas: 7 | 7.25 | 7,25 | 7 1/4 | 7-1/4 | 7¼ | 1/2 */
  pulgadas(s) {
    let t = String(s == null ? '' : s).trim().replace(',', '.').replace(/["”]/g, '').replace(/''/g, '');
    const u = { '¼': ' 1/4', '½': ' 1/2', '¾': ' 3/4', '⅛': ' 1/8', '⅜': ' 3/8', '⅝': ' 5/8', '⅞': ' 7/8' };
    for (const k in u) t = t.split(k).join(u[k]);
    t = t.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
    if (!t) return null;
    if (/^\d+(\.\d+)?$/.test(t)) return Number(t);
    const m = t.match(/^(?:(\d+) )?(\d+)\/(\d+)$/);
    if (!m) return null;
    const den = Number(m[3]); if (!den) return null;
    return Number(m[1] || 0) + Number(m[2]) / den;
  },
  esOctavo(d) { return Math.abs(d * 8 - Math.round(d * 8)) < 1e-9; },
  fraccion(d) {
    if (d == null) return '';
    const o = Math.round(d * 8), ent = Math.floor(o / 8); let n = o % 8, den = 8;
    while (n !== 0 && n % 2 === 0) { n /= 2; den /= 2; }
    return n === 0 ? `${ent}` : ent === 0 ? `${n}/${den}` : `${ent} ${n}/${den}`;
  },
  normalizarPulg(s) { const d = T.pulgadas(s); if (d == null) return String(s || '').trim(); return T.esOctavo(d) ? T.fraccion(d) : T.limpiar(s); },
  rangoPulg(a, b) { if (a == null || b == null) return '–'; return a === b ? T.fraccion(a) + '"' : `${T.fraccion(a)} a ${T.fraccion(b)}"`; },

  fecha(iso) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; },
  fechaCorta(iso) { const d = T.fecha(iso); return d ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}` : iso; },
  fechaLarga(iso) {
    const d = T.fecha(iso); if (!d) return iso;
    const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
  },
  diaResto(iso) {
    const d = T.fecha(iso); if (!d) return iso;
    const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${DIAS[d.getDay()]}, ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
  },
  serialExcel(iso) { const d = T.fecha(iso); return d ? Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(1899, 11, 30)) / 86400000) : null; },
  volumen(j) { return j.mixers.reduce((s, m) => s + (T.num(m.cant) || 0), 0); },
  nombreArchivo(base, ext) { return base.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9_\-]+/g, '_') + ext; }
};

function promedio(a) { return a.length ? a.reduce((x, y) => x + y, 0) / a.length : null; }


/* ================= Escáner: perspectiva + filtro ================= */
const Escaner = {
  /* Homografía que lleva puntos destino (u,v) a origen (x,y). */
  homografia(dst, src) {
    const A = [], b = [];
    for (let i = 0; i < 4; i++) {
      const [u, v] = dst[i], [x, y] = src[i];
      A.push([u, v, 1, 0, 0, 0, -u * x, -v * x]); b.push(x);
      A.push([0, 0, 0, u, v, 1, -u * y, -v * y]); b.push(y);
    }
    for (let c = 0; c < 8; c++) {
      let p = c; for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]];
      for (let r = 0; r < 8; r++) {
        if (r === c) continue;
        const f = A[r][c] / A[c][c];
        for (let k = c; k < 8; k++) A[r][k] -= f * A[c][k];
        b[r] -= f * b[c];
      }
    }
    return b.map((v, i) => v / A[i][i]);
  },

  /* gris: Uint8Array w*h. esquinas: [[x,y] tl,tr,br,bl]. Devuelve {g, w, h}. */
  enderezar(gris, w, h, e, maxLado = 2000) {
    const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    let W = Math.max(d(e[0], e[1]), d(e[3], e[2])), H = Math.max(d(e[0], e[3]), d(e[1], e[2]));
    const s = Math.min(1, maxLado / Math.max(W, H)); W = Math.max(1, Math.round(W * s)); H = Math.max(1, Math.round(H * s));
    const m = Escaner.homografia([[0, 0], [W, 0], [W, H], [0, H]], e);
    const out = new Uint8Array(W * H);
    for (let v = 0; v < H; v++) {
      const vv = v + 0.5;
      for (let u = 0; u < W; u++) {
        const uu = u + 0.5;
        const z = m[6] * uu + m[7] * vv + 1;
        const x = (m[0] * uu + m[1] * vv + m[2]) / z - 0.5;
        const y = (m[3] * uu + m[4] * vv + m[5]) / z - 0.5;
        const x0 = Math.floor(x), y0 = Math.floor(y);
        if (x0 < 0 || y0 < 0 || x0 >= w - 1 || y0 >= h - 1) { out[v * W + u] = 255; continue; }
        const tx = x - x0, ty = y - y0, i = y0 * w + x0;
        const a = gris[i] * (1 - tx) + gris[i + 1] * tx;
        const b = gris[i + w] * (1 - tx) + gris[i + w + 1] * tx;
        out[v * W + u] = a * (1 - ty) + b * ty;
      }
    }
    return { g: out, w: W, h: H };
  },

  /* Filtro tipo escáner: quita sombras y color del papel, papel a blanco, texto reforzado. */
  filtro(g, w, h) {
    const n = w * h;
    const f = Math.max(8, Math.floor(Math.max(w, h) / 64));
    const gw = Math.ceil(w / f), gh = Math.ceil(h / f);
    let fondo = new Float32Array(gw * gh);
    for (let by = 0; by < gh; by++) for (let bx = 0; bx < gw; bx++) {
      let m = 0; const yF = Math.min(h, (by + 1) * f), xF = Math.min(w, (bx + 1) * f);
      for (let y = by * f; y < yF; y += 2) { const fila = y * w; for (let x = bx * f; x < xF; x += 2) { const v = g[fila + x]; if (v > m) m = v; } }
      fondo[by * gw + bx] = m;
    }
    for (let p = 0; p < 2; p++) {
      const t = new Float32Array(gw * gh);
      for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
        let s = 0, k = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const yy = y + dy, xx = x + dx;
          if (yy >= 0 && yy < gh && xx >= 0 && xx < gw) { s += fondo[yy * gw + xx]; k++; }
        }
        t[y * gw + x] = s / k;
      }
      fondo = t;
    }
    const norm = new Uint8Array(n), hist = new Uint32Array(256);
    for (let y = 0; y < h; y++) {
      const fy = Math.min(gh - 1, Math.max(0, (y + 0.5) / f - 0.5)), y0 = Math.floor(fy), y1 = Math.min(gh - 1, y0 + 1), ty = fy - y0;
      for (let x = 0; x < w; x++) {
        const fx = Math.min(gw - 1, Math.max(0, (x + 0.5) / f - 0.5)), x0 = Math.floor(fx), x1 = Math.min(gw - 1, x0 + 1), tx = fx - x0;
        const a = fondo[y0 * gw + x0] * (1 - tx) + fondo[y0 * gw + x1] * tx;
        const b = fondo[y1 * gw + x0] * (1 - tx) + fondo[y1 * gw + x1] * tx;
        const bg = Math.max(40, a * (1 - ty) + b * ty);
        const v = Math.min(255, (g[y * w + x] * 255 / bg) | 0);
        norm[y * w + x] = v; hist[v]++;
      }
    }
    let acc = 0, negro = 0; const obj = n * 0.01;
    for (let i = 0; i < 256; i++) { acc += hist[i]; if (acc >= obj) { negro = i; break; } }
    negro = Math.min(negro, 150);
    const blanco = 205, lut = new Uint8Array(256);
    for (let v = 0; v < 256; v++) { const t = Math.min(1, Math.max(0, (v - negro) / (blanco - negro))); lut[v] = Math.round(255 * Math.pow(t, 1.5)); }
    const out = new Uint8Array(n);
    for (let i = 0; i < n; i++) out[i] = lut[norm[i]];
    return out;
  }
};

/* ================= ZIP (sin compresión) ================= */
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(b) { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC_T[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }

function zipStore(archivos) {
  const enc = new TextEncoder(), partes = [], central = []; let off = 0;
  for (const f of archivos) {
    const nom = enc.encode(f.nombre), datos = typeof f.datos === 'string' ? enc.encode(f.datos) : f.datos;
    const crc = crc32(datos), sz = datos.length;
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
    h.setUint16(10, 0, true); h.setUint16(12, 0x21, true); h.setUint32(14, crc, true); h.setUint32(18, sz, true);
    h.setUint32(22, sz, true); h.setUint16(26, nom.length, true); h.setUint16(28, 0, true);
    partes.push(new Uint8Array(h.buffer), nom, datos);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
    c.setUint16(10, 0, true); c.setUint16(12, 0, true); c.setUint16(14, 0x21, true); c.setUint32(16, crc, true);
    c.setUint32(20, sz, true); c.setUint32(24, sz, true); c.setUint16(28, nom.length, true);
    c.setUint32(42, off, true);
    central.push(new Uint8Array(c.buffer), nom);
    off += 30 + nom.length + sz;
  }
  const cd = central.reduce((a, b) => a + b.length, 0);
  const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, archivos.length, true); e.setUint16(10, archivos.length, true);
  e.setUint32(12, cd, true); e.setUint32(16, off, true);
  return [...partes, ...central, new Uint8Array(e.buffer)];
}

/* ================= Excel (.xlsx) ================= */
const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const X = { NORMAL: 0, TITULO: 1, ENC: 2, ETIQ: 3, TEXTO: 4, DEC2: 5, FRAC: 6, NUM: 7, TOT_ETIQ: 8, TOT_NUM: 9, CENTRO: 10, HORA: 11, FECHA: 12, SUB: 13, TOT_ENT: 14 };

const Excel = {
  c(v, s) { return { v, s }; },
  col(i) { let n = i + 1, s = ''; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); } return s; },
  esc(s) { return String(s).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); },
  hora(t) { const m = T.toMin(t); return Excel.c(m == null ? null : m / 1440, X.HORA); },
  pulg(s) { if (!s || !String(s).trim()) return Excel.c(null, X.CENTRO); const d = T.pulgadas(s); if (d == null) return Excel.c(s, X.CENTRO); return Excel.c(d, T.esOctavo(d) ? X.FRAC : X.NUM); },
  numero(s, est) { if (!s || !String(s).trim()) return Excel.c(null, est); const n = T.num(s); return n == null ? Excel.c(s, X.CENTRO) : Excel.c(n, est); },
  hoja(nombre, anchos) { return { nombre, anchos, filas: [], comb: [], filtro: null, congelar: 0, fila(c, alto) { this.filas.push({ c, alto }); }, get sig() { return this.filas.length + 1; } }; },

  extra(m, c) { const v = (m.extras || {})[c.id] || ''; return c.tipo === 'NUMERO' ? Excel.numero(v, X.DEC2) : Excel.c(v || null, X.TEXTO); },

  jornada(j, cfg = CONFIG_BASE) {
    const c = Excel.c, campos = cfg.campos || [], n = 11 + campos.length, u = Excel.col(n - 1);
    const h = Excel.hoja('Jornada', [8, 17, 9, 11, 10, 9, 13, 13, 12, 26, 32, ...campos.map(() => 16)]);
    const rep = (k, f) => Array.from({ length: k }, (_, i) => f(i));
    h.fila([c(cfg.titulo, X.TITULO), ...rep(n - 3, () => c(null, X.TITULO)), c(cfg.codigoFormato, X.TITULO), c(null, X.TITULO)], 30);
    h.comb.push(`A1:${Excel.col(n - 3)}1`, `${Excel.col(n - 2)}1:${u}1`);
    h.fila([c([cfg.empresa, cfg.proyecto].filter(Boolean).join('  ·  '), X.SUB)]); h.comb.push(`A2:${u}2`);
    const info = (a, b, cc, d, e, f) => {
      const r = h.sig;
      h.fila([c(a, X.ETIQ), c(b, X.TEXTO), c(null, X.TEXTO), c(null, X.TEXTO), c(cc, X.ETIQ), c(d, X.TEXTO), c(null, X.TEXTO), c(null, X.TEXTO), c(e, X.ETIQ), c(f, X.TEXTO), c(null, X.TEXTO)], 18);
      h.comb.push(`B${r}:D${r}`, `F${r}:H${r}`, `J${r}:K${r}`);
    };
    info('Nombre:', j.nombre, `${cfg.etFrente}:`, j.frente, `${cfg.etTramo}:`, j.tramo);
    info('Fecha:', `${T.fechaCorta(j.fecha)} (${T.fechaLarga(j.fecha)})`, 'Turno:', j.turno === 'Noche' ? 'Día [   ]    Noche [ X ]' : 'Día [ X ]    Noche [   ]', '', '');
    h.fila([]);
    h.fila(['Orden\nllegada', 'Código mixer /\nremisión', 'Hora\nllegada', 'Hora inicio\ndescargue', 'Hora fin\ndescargue', 'Cant.\n(m³)', 'Asentamiento\nen planta (")', 'Asentamiento\nen obra (")', 'Temperatura\n(°C)', cfg.etLoc, 'Observación', ...campos.map(tituloCampo)].map(t => c(t, X.ENC)), 32);
    const pf = h.sig;
    j.mixers.forEach((m, i) => h.fila([c(i + 1, X.NUM), c(m.codigo, X.TEXTO), Excel.hora(m.llegada), Excel.hora(m.inicio), Excel.hora(m.fin),
      Excel.numero(m.cant, X.DEC2), Excel.pulg(m.asPlanta), Excel.pulg(m.asObra), Excel.numero(m.temp, X.NUM), c(m.loc, X.TEXTO), c(m.obs || 'Sin observación', X.TEXTO),
      ...campos.map(cp => Excel.extra(m, cp))]));
    for (let k = j.mixers.length; k < 10; k++) h.fila([c(k + 1, X.NUM), ...rep(n - 1, i => c(null, i === 0 || i >= 8 ? X.TEXTO : X.CENTRO))]);
    const uf = h.sig - 1, r = resumen(j, cfg), rt = h.sig;
    h.fila([...rep(5, i => c(i === 0 ? 'TOTAL VACIADO' : null, X.TOT_ETIQ)), c({ f: `SUM(F${pf}:F${uf})`, v: r.vol }, X.TOT_NUM),
      ...rep(n - 6, i => c(i === 0 ? `${r.n} ${r.n === 1 ? 'mixer' : 'mixers'}` : null, X.TOT_ENT))], 18);
    h.comb.push(`A${rt}:E${rt}`, `G${rt}:${u}${rt}`);
    h.fila([]);
    const rr = h.sig;
    h.fila(rep(11, i => c(i === 0 ? 'Resumen, parámetros y estadísticas de la jornada' : null, X.ENC)), 18); h.comb.push(`A${rr}:K${rr}`);
    filasResumen(r, cfg).forEach(([k, v]) => {
      const f = h.sig;
      h.fila([c(k, X.ETIQ), c(null, X.ETIQ), c(null, X.ETIQ), c(null, X.ETIQ), c(v, X.TEXTO), ...rep(6, () => c(null, X.TEXTO))], v.length > 95 ? 30 : null);
      h.comb.push(`A${f}:D${f}`, `E${f}:K${f}`);
    });
    h.fila([]); h.fila([]);
    h.fila([c(`Elaboró: ${j.nombre || ''}`, X.NORMAL), ...rep(6, () => c(null, X.NORMAL)), c('Revisó / Vo. Bo.', X.NORMAL)]);
    const base = `Concreto_${j.fecha}_${j.turno}` + (j.tramo ? `_${cfg.etTramo}-${j.tramo}` : '');
    return { nombre: T.nombreArchivo(base, '.xlsx'), partes: Excel.libro([h]) };
  },

  historial(jornadas, cfg = CONFIG_BASE) {
    const c = Excel.c, campos = cfg.campos || [];
    const orden = [...jornadas].sort((a, b) => (a.fecha + a.turno + a.creada).localeCompare(b.fecha + b.turno + b.creada));
    const reg = Excel.hoja('Registros', [11, 8, 16, 9, 7, 17, 9, 11, 10, 9, 12, 12, 11, 26, 32, ...campos.map(() => 16)]);
    reg.congelar = 1;
    reg.fila(['Fecha', 'Turno', cfg.etFrente, cfg.etTramo, 'Orden', 'Código mixer / remisión', 'Hora llegada', 'Hora inicio descargue', 'Hora fin descargue', 'Cant. (m³)', 'Asent. planta (")', 'Asent. obra (")', 'Temp. (°C)', cfg.etLoc, 'Observación', ...campos.map(tituloCampo)].map(t => c(t, X.ENC)), 32);
    orden.forEach(j => j.mixers.forEach((m, i) => reg.fila([c(T.serialExcel(j.fecha), X.FECHA), c(j.turno, X.CENTRO), c(j.frente, X.TEXTO), c(j.tramo, X.CENTRO),
      c(i + 1, X.NUM), c(m.codigo, X.TEXTO), Excel.hora(m.llegada), Excel.hora(m.inicio), Excel.hora(m.fin), Excel.numero(m.cant, X.DEC2),
      Excel.pulg(m.asPlanta), Excel.pulg(m.asObra), Excel.numero(m.temp, X.NUM), c(m.loc, X.TEXTO), c(m.obs || 'Sin observación', X.TEXTO), ...campos.map(cp => Excel.extra(m, cp))])));
    reg.filtro = `A1:${Excel.col(14 + campos.length)}${Math.max(2, reg.filas.length)}`;
    const res = Excel.hoja('Por jornada', [11, 8, 16, 9, 9, 12, 11, 11, 13, 12, 13, 13, 13, 12, 12]);
    res.congelar = 1;
    res.fila(['Fecha', 'Turno', cfg.etFrente, cfg.etTramo, 'Mixers', 'Volumen (m³)', 'Primera llegada', 'Último fin descargue', 'Duración vaciado (min)', 'Rendimiento (m³/h)', 'Espera prom. (min)', 'Descargue prom. (min)', 'Asent. obra prom. (")', 'Pérdida asent. prom. (")', 'Temp. prom. (°C)'].map(t => c(t, X.ENC)), 32);
    let tm = 0, tv = 0;
    const red = (x, k) => x == null ? null : Math.round(x * k) / k;
    orden.forEach(j => {
      const r = resumen(j, cfg); tm += r.n; tv += r.vol;
      res.fila([c(T.serialExcel(j.fecha), X.FECHA), c(j.turno, X.CENTRO), c(j.frente, X.TEXTO), c(j.tramo, X.CENTRO), c(r.n, X.NUM), c(r.vol, X.DEC2),
        Excel.hora(r.primera), Excel.hora(r.ultimo), c(r.duracion, X.NUM), c(red(r.rendimiento, 100), X.DEC2), c(red(r.espera, 1), X.NUM),
        c(red(r.descargue, 1), X.NUM), c(red(r.sProm, 8), X.FRAC), c(red(r.perdida, 8), X.FRAC), c(red(r.tProm, 10), X.NUM)]);
    });
    const ult = res.filas.length;
    res.fila([c('TOTAL', X.TOT_ETIQ), c(null, X.TOT_ETIQ), c(null, X.TOT_ETIQ), c(null, X.TOT_ETIQ), c({ f: `SUM(E2:E${ult})`, v: tm }, X.TOT_NUM), c({ f: `SUM(F2:F${ult})`, v: tv }, X.TOT_NUM)]);
    res.comb.push(`A${res.filas.length}:D${res.filas.length}`);
    res.filtro = `A1:O${Math.max(2, ult)}`;
    return { nombre: T.nombreArchivo(`Historial_concreto_${T.hoy()}`, '.xlsx'), partes: Excel.libro([reg, res]) };
  },

  hojaXml(h) {
    const E = Excel.esc, out = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>'];
    out.push(h.congelar ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="${h.congelar}" topLeftCell="A${h.congelar + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` : '<sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews>');
    out.push('<cols>' + h.anchos.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('') + '</cols><sheetData>');
    h.filas.forEach((f, ri) => {
      const r = ri + 1;
      out.push(`<row r="${r}"${f.alto ? ` ht="${f.alto}" customHeight="1"` : ''}>`);
      f.c.forEach((cel, ci) => {
        const ref = Excel.col(ci) + r, v = cel.v, s = cel.s;
        if (v == null || v === '') out.push(`<c r="${ref}" s="${s}"/>`);
        else if (typeof v === 'object') out.push(`<c r="${ref}" s="${s}"><f>${E(v.f)}</f><v>${v.v}</v></c>`);
        else if (typeof v === 'number') out.push(`<c r="${ref}" s="${s}"><v>${v}</v></c>`);
        else out.push(`<c r="${ref}" s="${s}" t="inlineStr"><is><t xml:space="preserve">${E(v)}</t></is></c>`);
      });
      out.push('</row>');
    });
    out.push('</sheetData>');
    if (h.filtro) out.push(`<autoFilter ref="${h.filtro}"/>`);
    if (h.comb.length) out.push(`<mergeCells count="${h.comb.length}">` + h.comb.map(m => `<mergeCell ref="${m}"/>`).join('') + '</mergeCells>');
    out.push('<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/><pageSetup paperSize="1" orientation="landscape" fitToWidth="1" fitToHeight="0"/></worksheet>');
    return out.join('');
  },

  ESTILOS: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<numFmts count="2"><numFmt numFmtId="164" formatCode="# ?/?"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy"/></numFmts>' +
    '<fonts count="5"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="14"/><color rgb="FF002F5C"/><name val="Calibri"/></font><font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FF002F5C"/><name val="Calibri"/></font><font><sz val="10"/><color rgb="FF38628E"/><name val="Calibri"/></font></fonts>' +
    '<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF002F5C"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFDEE8F6"/><bgColor indexed="64"/></patternFill></fill></fills>' +
    '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FF46505C"/></left><right style="thin"><color rgb="FF46505C"/></right><top style="thin"><color rgb="FF46505C"/></top><bottom style="thin"><color rgb="FF46505C"/></bottom><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="15">' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
    '<xf numFmtId="0" fontId="1" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>' +
    '<xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>' +
    '<xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>' +
    '<xf numFmtId="2" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>' +
    '<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>' +
    '<xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>' +
    '<xf numFmtId="2" fontId="3" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>' +
    '<xf numFmtId="20" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>' +
    '<xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>' +
    '<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
    '<xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>' +
    '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>',

  libro(hojas) {
    const x = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>', E = Excel.esc;
    const definidos = hojas.map((h, i) => {
      if (!h.filtro) return '';
      const abs = h.filtro.split(':').map(p => '$' + p.replace(/\d+/, '') + '$' + p.replace(/[A-Z]+/, '')).join(':');
      return `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${E(h.nombre)}'!${abs}</definedName>`;
    }).join('');
    const archivos = [
      { nombre: '[Content_Types].xml', datos: x + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' + hojas.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') + '</Types>' },
      { nombre: '_rels/.rels', datos: x + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
      { nombre: 'xl/workbook.xml', datos: x + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + hojas.map((h, i) => `<sheet name="${E(h.nombre)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') + '</sheets>' + (definidos ? `<definedNames>${definidos}</definedNames>` : '') + '<calcPr calcId="0" fullCalcOnLoad="1"/></workbook>' },
      { nombre: 'xl/_rels/workbook.xml.rels', datos: x + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + hojas.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('') + `<Relationship Id="rId${hojas.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
      { nombre: 'xl/styles.xml', datos: Excel.ESTILOS },
      ...hojas.map((h, i) => ({ nombre: `xl/worksheets/sheet${i + 1}.xml`, datos: Excel.hojaXml(h) }))
    ];
    return zipStore(archivos);
  }
};

/* ================= PDF a partir de páginas JPEG ================= */
function pdfDeJpegs(paginas, anchoPt, altoPt) {
  const enc = new TextEncoder(), partes = [], offs = []; let pos = 0;
  const add = x => { const b = typeof x === 'string' ? enc.encode(x) : x; partes.push(b); pos += b.length; };
  const obj = (i, cuerpo) => { offs[i] = pos; add(`${i} 0 obj\n`); cuerpo(); add('\nendobj\n'); };
  const n = paginas.length, total = 2 + n * 3;
  add('%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n');
  obj(1, () => add('<< /Type /Catalog /Pages 2 0 R >>'));
  obj(2, () => add(`<< /Type /Pages /Kids [${paginas.map((_, k) => `${3 + k * 3} 0 R`).join(' ')}] /Count ${n} >>`));
  paginas.forEach((p, k) => {
    const pi = 3 + k * 3, ci = pi + 1, ii = pi + 2;
    obj(pi, () => add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${anchoPt} ${altoPt}] /Resources << /XObject << /Im${k} ${ii} 0 R >> >> /Contents ${ci} 0 R >>`));
    const cs = `q ${anchoPt} 0 0 ${altoPt} 0 0 cm /Im${k} Do Q`;
    obj(ci, () => add(`<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`));
    obj(ii, () => { add(`<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.bytes.length} >>\nstream\n`); add(p.bytes); add('\nendstream'); });
  });
  const xref = pos;
  add(`xref\n0 ${total + 1}\n0000000000 65535 f \n`);
  for (let i = 1; i <= total; i++) add(String(offs[i]).padStart(10, '0') + ' 00000 n \n');
  add(`trailer\n<< /Size ${total + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return partes;
}

if (typeof module !== 'undefined') module.exports = { T, resumen, filasResumen, Escaner, Excel, zipStore, pdfDeJpegs };
/* ================= Descompresión ZIP (inflate, sin librerías) ================= */
const Inflate = (() => {
  function construir(longs, n) {
    const cuenta = new Uint16Array(16), offs = new Uint16Array(16), sim = new Uint16Array(n);
    for (let i = 0; i < n; i++) cuenta[longs[i]]++;
    cuenta[0] = 0;
    for (let i = 1; i < 16; i++) offs[i] = offs[i - 1] + cuenta[i - 1];
    for (let i = 0; i < n; i++) if (longs[i]) sim[offs[longs[i]]++] = i;
    return { cuenta, sim };
  }
  const BASE_L = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
  const EXTRA_L = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
  const BASE_D = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577];
  const EXTRA_D = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
  const ORDEN = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
  let FIJA_L = null, FIJA_D = null;
  function fijas() {
    if (FIJA_L) return;
    const l = new Uint8Array(288);
    for (let i = 0; i < 144; i++) l[i] = 8; for (let i = 144; i < 256; i++) l[i] = 9;
    for (let i = 256; i < 280; i++) l[i] = 7; for (let i = 280; i < 288; i++) l[i] = 8;
    FIJA_L = construir(l, 288);
    FIJA_D = construir(new Uint8Array(30).fill(5), 30);
  }
  return function inflar(datos, tamano) {
    let pos = 0, bitbuf = 0, bitcnt = 0;
    let out = new Uint8Array(tamano > 0 ? tamano : Math.max(1024, datos.length * 4)), op = 0;
    const asegurar = n => {
      if (op + n <= out.length) return;
      let t = out.length * 2; while (t < op + n) t *= 2;
      const nu = new Uint8Array(t); nu.set(out); out = nu;
    };
    const bits = n => {
      while (bitcnt < n) { if (pos >= datos.length) throw new Error('ZIP dañado'); bitbuf |= datos[pos++] << bitcnt; bitcnt += 8; }
      const v = bitbuf & ((1 << n) - 1); bitbuf >>>= n; bitcnt -= n; return v;
    };
    const decodificar = h => {
      let code = 0, first = 0, index = 0;
      for (let len = 1; len < 16; len++) {
        code |= bits(1);
        const c = h.cuenta[len];
        if (code - c < first) return h.sim[index + (code - first)];
        index += c; first += c; first <<= 1; code <<= 1;
      }
      throw new Error('ZIP dañado');
    };
    let final = 0;
    do {
      final = bits(1);
      const tipo = bits(2);
      if (tipo === 0) {
        bitbuf = 0; bitcnt = 0;
        const len = datos[pos] | (datos[pos + 1] << 8); pos += 4;
        asegurar(len); out.set(datos.subarray(pos, pos + len), op); op += len; pos += len;
      } else if (tipo === 1 || tipo === 2) {
        let hl, hd;
        if (tipo === 1) { fijas(); hl = FIJA_L; hd = FIJA_D; }
        else {
          const nl = bits(5) + 257, nd = bits(5) + 1, nc = bits(4) + 4;
          const lc = new Uint8Array(19);
          for (let i = 0; i < nc; i++) lc[ORDEN[i]] = bits(3);
          const hc = construir(lc, 19), longs = new Uint8Array(nl + nd);
          for (let i = 0; i < nl + nd;) {
            const s = decodificar(hc);
            if (s < 16) longs[i++] = s;
            else {
              let rep = 0, val = 0;
              if (s === 16) { if (!i) throw new Error('ZIP dañado'); val = longs[i - 1]; rep = 3 + bits(2); }
              else if (s === 17) rep = 3 + bits(3); else rep = 11 + bits(7);
              while (rep--) longs[i++] = val;
            }
          }
          hl = construir(longs.subarray(0, nl), nl); hd = construir(longs.subarray(nl), nd);
        }
        for (;;) {
          const s = decodificar(hl);
          if (s < 256) { asegurar(1); out[op++] = s; }
          else if (s === 256) break;
          else {
            const k = s - 257, len = BASE_L[k] + bits(EXTRA_L[k]);
            const dsim = decodificar(hd), dist = BASE_D[dsim] + bits(EXTRA_D[dsim]);
            asegurar(len);
            for (let i = 0; i < len; i++, op++) out[op] = out[op - dist];
          }
        }
      } else throw new Error('ZIP dañado');
    } while (!final);
    return out.subarray(0, op);
  };
})();

/** Lee un .zip (o .xlsx) y devuelve un Map nombre → bytes. */
function leerZip(buf) {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf), dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let e = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { e = i; break; }
  if (e < 0) throw new Error('No es un ZIP');
  const n = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true);
  const dec = new TextDecoder(), out = new Map();
  for (let k = 0; k < n; k++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const metodo = dv.getUint16(p + 10, true), comp = dv.getUint32(p + 20, true), tam = dv.getUint32(p + 24, true);
    const ln = dv.getUint16(p + 28, true), lx = dv.getUint16(p + 30, true), lc = dv.getUint16(p + 32, true), loc = dv.getUint32(p + 42, true);
    const nombre = dec.decode(b.subarray(p + 46, p + 46 + ln));
    p += 46 + ln + lx + lc;
    const ini = loc + 30 + dv.getUint16(loc + 26, true) + dv.getUint16(loc + 28, true);
    const datos = b.subarray(ini, ini + comp);
    if (nombre.endsWith('/')) continue;
    if (metodo === 0) out.set(nombre, datos.slice());
    else if (metodo === 8) out.set(nombre, Inflate(datos, tam));
  }
  return out;
}

/* ================= SHA-256 (para el acceso de administrador) ================= */
function sha256Hex(texto) {
  const K = new Uint32Array([0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);
  const msg = new TextEncoder().encode(texto), l = msg.length, nb = ((l + 9 + 63) >> 6) << 6;
  const m = new Uint8Array(nb); m.set(msg); m[l] = 0x80;
  const dv = new DataView(m.buffer); dv.setUint32(nb - 4, (l * 8) >>> 0); dv.setUint32(nb - 8, Math.floor(l / 0x20000000));
  const H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const W = new Uint32Array(64), r = (x, n) => (x >>> n) | (x << (32 - n));
  for (let o = 0; o < nb; o += 64) {
    for (let i = 0; i < 16; i++) W[i] = dv.getUint32(o + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = r(W[i - 15], 7) ^ r(W[i - 15], 18) ^ (W[i - 15] >>> 3), s1 = r(W[i - 2], 17) ^ r(W[i - 2], 19) ^ (W[i - 2] >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + W[i]) >>> 0;
      const t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    H[0] += a; H[1] += b; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
  }
  return Array.from(H, x => x.toString(16).padStart(8, '0')).join('');
}

/* ================= Configuración de la app y del informe ================= */
const TIPOS_CAMPO = { NUMERO: 'Número', TEXTO: 'Texto', LISTA: 'Lista de opciones' };
const CONFIG_BASE = {
  empresa: 'Construcciones El Cóndor S.A.', proyecto: '', titulo: 'CONTROL LLEGADAS DE CONCRETO A OBRA',
  codigoFormato: 'PS-TUNEL 011', area: 'Revestimiento del túnel',
  etFrente: 'Frente', etTramo: 'Tramo', etLoc: 'Localización',
  asentMin: '', asentMax: '', tempMin: '', tempMax: '', esperaMax: 30, campos: []
};
/* Mismos identificadores que en Android, para que las jornadas pasen entre teléfonos con sus datos adicionales. */
const CAMPOS_SUGERIDOS = [
  { id: 'sug_fc', nombre: "Resistencia de diseño f'c", tipo: 'NUMERO', unidad: 'MPa', opciones: [], estadistica: true },
  { id: 'sug_tipo', nombre: 'Tipo de concreto', tipo: 'LISTA', unidad: '', opciones: ['Convencional', 'Lanzado', 'Autocompactante', 'Fluido', 'Masivo'], estadistica: true },
  { id: 'sug_aditivo', nombre: 'Aditivo', tipo: 'TEXTO', unidad: '', opciones: [], estadistica: true },
  { id: 'sug_dosis_ad', nombre: 'Dosis de aditivo', tipo: 'NUMERO', unidad: 'L/m³', opciones: [], estadistica: true },
  { id: 'sug_fibra', nombre: 'Fibra', tipo: 'LISTA', unidad: '', opciones: ['Metálica', 'Sintética', 'Sin fibra'], estadistica: true },
  { id: 'sug_dosis_fib', nombre: 'Dosis de fibra', tipo: 'NUMERO', unidad: 'kg/m³', opciones: [], estadistica: true },
  { id: 'sug_agua', nombre: 'Agua adicionada en obra', tipo: 'NUMERO', unidad: 'L', opciones: [], estadistica: true },
  { id: 'sug_cilindros', nombre: 'Cilindros tomados', tipo: 'NUMERO', unidad: 'und', opciones: [], estadistica: true },
  { id: 'sug_bomba', nombre: 'Equipo de colocación', tipo: 'LISTA', unidad: '', opciones: ['Bomba estacionaria', 'Autobomba', 'Canal', 'Balde / grúa'], estadistica: true }
];
function tituloCampo(c) { return c.unidad ? `${c.nombre} (${c.unidad})` : c.nombre; }
function cfgDesde(o) {
  const d = CONFIG_BASE, s = (k, def) => (o && o[k] != null ? String(o[k]) : def);
  const campos = (o && Array.isArray(o.campos) ? o.campos : []).map(f => ({
    id: String(f.id || T.uid()), nombre: String(f.nombre || '').trim(),
    tipo: TIPOS_CAMPO[f.tipo] ? f.tipo : 'TEXTO', unidad: String(f.unidad || ''),
    opciones: (Array.isArray(f.opciones) ? f.opciones : []).map(String).filter(x => x.trim()),
    estadistica: f.estadistica !== false
  })).filter(f => f.nombre);
  const esp = parseInt(o && o.esperaMax, 10);
  return {
    empresa: s('empresa', d.empresa), proyecto: s('proyecto', ''), titulo: s('titulo', d.titulo) || d.titulo,
    codigoFormato: s('codigoFormato', d.codigoFormato), area: s('area', d.area),
    etFrente: s('etFrente', d.etFrente) || d.etFrente, etTramo: s('etTramo', d.etTramo) || d.etTramo, etLoc: s('etLoc', d.etLoc) || d.etLoc,
    asentMin: s('asentMin', ''), asentMax: s('asentMax', ''), tempMin: s('tempMin', ''), tempMax: s('tempMax', ''),
    esperaMax: isFinite(esp) && esp >= 1 ? Math.min(600, esp) : 30, campos
  };
}

/* ================= Código del mixer y remisión: "mx123" + "456" -> "MX-123 / 456" ================= */
const Codigos = {
  SEP: ' / ',
  mixer(s) {
    const t = String(s || '').trim().toUpperCase().replace(/\s+/g, ' ');
    if (!t) return '';
    const m = t.match(/^(\p{L}+)[^\p{L}\d]*(\d+)$/u);
    return m ? `${m[1]}-${m[2]}` : t;
  },
  soloNumeros(s) { return String(s || '').replace(/\D/g, ''); },
  juntar(mixer, remision) {
    const a = Codigos.mixer(mixer), b = Codigos.soloNumeros(remision);
    return !b ? a : !a ? `–${Codigos.SEP}${b}` : `${a}${Codigos.SEP}${b}`;
  },
  separar(s) {
    s = String(s || ''); const i = s.lastIndexOf(Codigos.SEP);
    if (i >= 0) {
      const rem = s.slice(i + Codigos.SEP.length).trim();
      if (rem && /^\d+$/.test(rem)) { const cod = s.slice(0, i).trim(); return [cod === '–' ? '' : cod, rem]; }
    }
    return [s.trim(), ''];
  }
};
const OTRO = 'Otro...';

/* ================= Resumen, parámetros y estadísticas ================= */
function resumen(j, cfg = CONFIG_BASE) {
  const M = j.mixers, nn = a => a.filter(x => x != null);
  const mn = a => a.length ? Math.min(...a) : null, mx = a => a.length ? Math.max(...a) : null;
  const cants = nn(M.map(m => T.num(m.cant)));
  const esp = nn(M.map(m => T.diff(m.llegada, m.inicio)));
  const des = nn(M.map(m => T.diff(m.inicio, m.fin)));
  const ciclos = nn(M.map(m => T.diff(m.llegada, m.fin)));
  const lleg = M.map(m => m.llegada).filter(Boolean);
  const inter = []; for (let i = 1; i < lleg.length; i++) { const d = T.diff(lleg[i - 1], lleg[i]); if (d != null) inter.push(d); }
  const temps = nn(M.map(m => T.num(m.temp)));
  const slump = nn(M.map(m => T.pulgadas(m.asObra)));
  const planta = nn(M.map(m => T.pulgadas(m.asPlanta)));
  const perd = nn(M.map(m => { const p = T.pulgadas(m.asPlanta), o = T.pulgadas(m.asObra); return p != null && o != null ? p - o : null; }));
  const caud = nn(M.map(m => { const c = T.num(m.cant), d = T.diff(m.inicio, m.fin); return c != null && d != null && d > 0 ? [c, d] : null; }));
  const primera = M.find(m => m.llegada), ultima = [...M].reverse().find(m => m.fin);
  const duracion = primera && ultima ? T.diff(primera.llegada, ultima.fin) : null;
  const vol = T.volumen(j);
  const aMin = T.pulgadas(cfg.asentMin), aMax = T.pulgadas(cfg.asentMax), tMn = T.num(cfg.tempMin), tMx = T.num(cfg.tempMax);
  const porLoc = {};
  M.forEach(m => { const k = (m.loc || '').trim() || `Sin ${cfg.etLoc.toLowerCase()}`; porLoc[k] = (porLoc[k] || 0) + (T.num(m.cant) || 0); });
  const extras = [];
  (cfg.campos || []).filter(c => c.estadistica).forEach(c => {
    const vals = M.map(m => ((m.extras || {})[c.id] || '').trim()).filter(Boolean);
    if (!vals.length) return;
    const u = c.unidad ? ' ' + c.unidad : '';
    if (c.tipo === 'NUMERO') {
      const ns = nn(vals.map(T.num)); if (!ns.length) return;
      extras.push([c.nombre, `${T.fmt(promedio(ns), 2)}${u} prom.  (${T.rango(mn(ns), mx(ns), u)})  ·  ${ns.length} de ${M.length} mixers`]);
    } else {
      const cnt = {}; vals.forEach(v => { cnt[v] = (cnt[v] || 0) + 1; });
      extras.push([c.nombre, Object.entries(cnt).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}: ${v}`).join('  ·  ')]);
    }
  });
  return {
    n: M.length, vol, volProm: promedio(cants), volMin: mn(cants), volMax: mx(cants),
    espera: promedio(esp), esperaMax: mx(esp), esperasLargas: esp.filter(x => x > cfg.esperaMax).length,
    descargue: promedio(des), descargueMax: mx(des), ciclo: promedio(ciclos), intervalo: promedio(inter),
    rendimiento: duracion > 0 && vol > 0 ? vol / (duracion / 60) : null,
    caudal: caud.length ? caud.reduce((s, x) => s + x[0], 0) / (caud.reduce((s, x) => s + x[1], 0) / 60) : null,
    tProm: promedio(temps), tMin: mn(temps), tMax: mx(temps),
    sProm: promedio(slump), sMin: mn(slump), sMax: mx(slump),
    pProm: promedio(planta), pMin: mn(planta), pMax: mx(planta), perdida: promedio(perd),
    fueraAsent: aMin == null && aMax == null ? null : slump.filter(x => (aMin != null && x < aMin - 1e-9) || (aMax != null && x > aMax + 1e-9)).length,
    fueraTemp: tMn == null && tMx == null ? null : temps.filter(x => (tMn != null && x < tMn) || (tMx != null && x > tMx)).length,
    sinFin: M.filter(m => !m.fin).length,
    primera: primera ? primera.llegada : '', ultimo: ultima ? ultima.fin : '', duracion,
    porLoc: Object.entries(porLoc).sort((a, b) => b[1] - a[1]), extras
  };
}

function filasResumen(r, cfg = CONFIG_BASE) {
  const pulg = d => d == null ? '–' : T.fraccion(d) + '"';
  const f = [];
  f.push(['Volumen total vaciado', `${T.fmt(r.vol, 2)} m³`]);
  f.push(['Mixers recibidos', String(r.n) + (r.sinFin ? `  (${r.sinFin} sin hora de fin)` : '')]);
  f.push(['Volumen por mixer (prom. / rango)', r.volProm != null ? `${T.fmt(r.volProm, 2)} m³  (${T.rango(r.volMin, r.volMax, ' m³')})` : '–']);
  f.push(['Primera llegada / último fin de descargue', `${r.primera || '–'} / ${r.ultimo || '–'}`]);
  f.push(['Duración total del vaciado', T.dur(r.duracion)]);
  f.push(['Rendimiento del vaciado', r.rendimiento != null ? `${T.fmt(r.rendimiento, 2)} m³/h` : '–']);
  f.push(['Intervalo promedio entre llegadas', T.dur(r.intervalo)]);
  f.push(['Espera en obra (prom. / máxima)', `${T.dur(r.espera)} / ${T.dur(r.esperaMax)}`]);
  f.push([`Mixers con espera mayor a ${cfg.esperaMax} min`, String(r.esperasLargas)]);
  f.push(['Descargue por mixer (prom. / máximo)', `${T.dur(r.descargue)} / ${T.dur(r.descargueMax)}`]);
  f.push(['Caudal promedio de descargue', r.caudal != null ? `${T.fmt(r.caudal, 2)} m³/h` : '–']);
  f.push(['Permanencia en obra (llegada a fin)', T.dur(r.ciclo)]);
  if (r.pProm != null) f.push(['Asentamiento en planta (prom. / rango)', `${pulg(r.pProm)}  (${T.rangoPulg(r.pMin, r.pMax)})`]);
  f.push(['Asentamiento en obra (prom. / rango)', `${pulg(r.sProm)}  (${T.rangoPulg(r.sMin, r.sMax)})`]);
  if (r.perdida != null) f.push(['Pérdida de asentamiento promedio (planta − obra)', r.perdida < 0 ? `−${T.fraccion(-r.perdida)}" (ganó asentamiento)` : pulg(r.perdida)]);
  if (r.fueraAsent != null) f.push([`Mixers fuera del asentamiento especificado (${[cfg.asentMin, cfg.asentMax].filter(Boolean).join(' a ')}")`, String(r.fueraAsent)]);
  f.push(['Temperatura (prom. / rango)', `${r.tProm != null ? T.fmt(r.tProm) + ' °C' : '–'}  (${T.rango(r.tMin, r.tMax, ' °C')})`]);
  if (r.fueraTemp != null) f.push([`Mixers fuera de la temperatura especificada (${[cfg.tempMin && 'mín. ' + cfg.tempMin, cfg.tempMax && 'máx. ' + cfg.tempMax].filter(Boolean).join(', ')} °C)`, String(r.fueraTemp)]);
  if (r.porLoc.length) f.push([`Volumen por ${cfg.etLoc.toLowerCase()}`, r.porLoc.map(([k, v]) => `${k}: ${T.fmt(v, 2)} m³`).join('  ·  ')]);
  r.extras.forEach(x => f.push(x));
  return f;
}

/* ================= Catálogo (frentes, tramos y localizaciones) ================= */
const Catalogo = {
  norm(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); },
  frentes(c) { return [...new Set(c.items.map(i => i.frente).filter(Boolean))]; },
  tramos(c, f) { return [...new Set(c.items.filter(i => i.frente === f).map(i => i.tramo).filter(Boolean))]; },

  leer(buf) {
    const b = new Uint8Array(buf);
    if (b.length < 4) throw new Error('El archivo está vacío');
    const ini = Array.from(b.subarray(0, 256), x => String.fromCharCode(x)).join('');
    if (ini.includes('MSMAMARPCRYPT') || ini.includes('AES/CBC'))
      throw new Error('El archivo está cifrado por la protección de Microsoft (Intune) del teléfono de la empresa, por eso no se puede leer. ' +
        'Usa "Escribir catálogo" o pasa el archivo sin abrirlo en Outlook, Teams u OneDrive del trabajo.');
    if (b[0] === 0x50 && b[1] === 0x4B) return Catalogo.aItems(Catalogo.xlsx(b));
    if (b[0] === 0xD0 && b[1] === 0xCF) throw new Error('Es un Excel antiguo (.xls). Guárdalo como .xlsx o como CSV e inténtalo de nuevo');
    const m = b.subarray(0, 2048); let raros = 0;
    for (const c of m) if (c < 9 || (c >= 14 && c < 32)) raros++;
    if (raros > m.length / 50) throw new Error('El archivo no es un Excel (.xlsx) ni un CSV válido, o está dañado o cifrado');
    return Catalogo.aItems(Catalogo.csv(b));
  },

  csv(b) {
    let t = new TextDecoder('utf-8').decode(b);
    if (t.includes('\uFFFD')) { try { t = new TextDecoder('windows-1252').decode(b); } catch (e) { } }
    t = t.replace(/^\uFEFF/, '');
    const primera = t.split(/\r?\n/).find(l => l.trim()) || '';
    const sep = [';', ',', '\t'].sort((a, c) => primera.split(c).length - primera.split(a).length)[0];
    const filas = []; let fila = [], campo = '', q = false;
    for (let i = 0; i < t.length; i++) {
      const ch = t[i];
      if (q) { if (ch === '"') { if (t[i + 1] === '"') { campo += '"'; i++; } else q = false; } else campo += ch; }
      else if (ch === '"') q = true;
      else if (ch === sep) { fila.push(campo); campo = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; fila.push(campo); filas.push(fila); fila = []; campo = ''; }
      else campo += ch;
    }
    if (campo || fila.length) { fila.push(campo); filas.push(fila); }
    return filas;
  },

  xml(s) { return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, '&'); },
  textos(s) { let r = ''; s.replace(/<t\b[^>]*>([\s\S]*?)<\/t>/g, (_, x) => { r += x; return ''; }); return Catalogo.xml(r); },

  xlsx(b) {
    const z = leerZip(b), dec = new TextDecoder(), leer = n => z.has(n) ? dec.decode(z.get(n)) : null;
    const comp = [];
    const ss = leer('xl/sharedStrings.xml');
    if (ss) ss.replace(/<si\b[^>]*>([\s\S]*?)<\/si>/g, (_, x) => { comp.push(Catalogo.textos(x)); return ''; });
    let hoja = 'xl/worksheets/sheet1.xml';
    const wb = leer('xl/workbook.xml'), rels = leer('xl/_rels/workbook.xml.rels');
    const mId = wb && wb.match(/<sheet\b[^>]*r:id="([^"]+)"/);
    if (mId && rels) {
      const re = new RegExp(`<Relationship\\b[^>]*Id="${mId[1]}"[^>]*>`), rel = rels.match(re);
      const tg = rel && rel[0].match(/Target="([^"]+)"/);
      if (tg) hoja = tg[1].startsWith('/') ? tg[1].slice(1) : 'xl/' + tg[1].replace(/^\.\//, '');
    }
    const xml = leer(hoja);
    if (!xml) throw new Error('No encontré la hoja del Excel');
    const filas = new Map();
    xml.replace(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g, (_, at, cont) => {
      const ref = (at.match(/\br="([A-Z]+)(\d+)"/) || []); if (!ref[1]) return '';
      let col = 0; for (const ch of ref[1]) col = col * 26 + (ch.charCodeAt(0) - 64); col--;
      const tipo = (at.match(/\bt="([^"]+)"/) || [])[1] || '';
      let v = '';
      if (cont) {
        if (tipo === 'inlineStr') v = Catalogo.textos(cont);
        else { const mv = cont.match(/<v>([\s\S]*?)<\/v>/); v = mv ? Catalogo.xml(mv[1]) : ''; }
      }
      if (tipo === 's') v = comp[+v] || '';
      else if (!tipo || tipo === 'n') { const n = Number(v); if (v !== '' && isFinite(n) && Number.isInteger(n)) v = String(n); }
      const r = +ref[2]; if (!filas.has(r)) filas.set(r, []);
      filas.get(r)[col] = v;
      return '';
    });
    return [...filas.keys()].sort((a, c) => a - c).map(k => Array.from(filas.get(k), x => x == null ? '' : x));
  },

  aItems(filasCrudas) {
    const filas = filasCrudas.map(f => f.map(x => String(x == null ? '' : x).trim())).filter(f => f.some(Boolean));
    if (!filas.length) throw new Error('El archivo está vacío');
    const iEnc = filas.slice(0, 10).findIndex(f => f.some(x => ['frente', 'frentes'].includes(Catalogo.norm(x))));
    let cF = 0, cT = 1, cE = 2, inicio = 0;
    if (iEnc >= 0) {
      const enc = filas[iEnc].map(Catalogo.norm), buscar = (...k) => enc.findIndex(h => k.some(x => h.startsWith(x)));
      cF = buscar('frente'); cT = buscar('tramo'); cE = buscar('localizacion', 'elemento', 'actividad', 'tipo de vaciado', 'lugar');
      inicio = iEnc + 1;
    }
    const items = [], elementos = []; let omitidas = 0, anterior = '';
    for (const f of filas.slice(inicio)) {
      const v = i => i >= 0 ? (f[i] || '') : '';
      const el = v(cE);
      if (el && el.toLowerCase() !== OTRO.toLowerCase()) elementos.push(el);
      if (!v(cF) && !v(cT)) { if (!el) omitidas++; continue; }
      const frente = v(cF) || anterior;
      if (!frente) { omitidas++; continue; }
      anterior = frente;
      items.push({ frente, tramo: v(cT) });
    }
    const unicos = [], vistos = new Set();
    items.forEach(i => { const k = i.frente + '\u0001' + i.tramo; if (!vistos.has(k)) { vistos.add(k); unicos.push(i); } });
    const elems = [...new Set(elementos)];
    if (!unicos.length && !elems.length) throw new Error('No encontré filas válidas. Revisa que la columna Frente tenga datos');
    return { items: unicos, elementos: elems, omitidas };
  },

  desdeTexto(frentes, locs) {
    const items = []; let anterior = '';
    String(frentes || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean).forEach(l => {
      const p = l.split(/[;\t|]/), f = (p[0] || '').trim() || anterior, t = p.slice(1).join(' ').trim();
      if (f) { items.push({ frente: f, tramo: t }); anterior = f; }
    });
    const el = [...new Set(String(locs || '').split(/\r?\n/).map(l => l.trim()).filter(l => l && l.toLowerCase() !== OTRO.toLowerCase()))];
    if (!items.length && !el.length) throw new Error('Escribe al menos un frente o una localización');
    return Catalogo.aItems([['Frente', 'Tramo', 'Localización'], ...items.map(i => [i.frente, i.tramo, '']), ...el.map(e => ['', '', e])]);
  },
  textoFrentes(c) { return [...new Set(c.items.map(i => i.tramo ? `${i.frente} ; ${i.tramo}` : i.frente))].join('\n'); }
};
