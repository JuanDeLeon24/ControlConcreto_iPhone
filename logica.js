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

function resumen(j) {
  const M = j.mixers;
  const esp = M.map(m => T.diff(m.llegada, m.inicio)).filter(x => x != null);
  const des = M.map(m => T.diff(m.inicio, m.fin)).filter(x => x != null);
  const temps = M.map(m => T.num(m.temp)).filter(x => x != null);
  const slump = M.map(m => T.pulgadas(m.asObra)).filter(x => x != null);
  const primera = M.find(m => m.llegada), ultima = [...M].reverse().find(m => m.fin);
  return {
    n: M.length, vol: T.volumen(j), espera: promedio(esp), descargue: promedio(des),
    tProm: promedio(temps), tMin: temps.length ? Math.min(...temps) : null, tMax: temps.length ? Math.max(...temps) : null,
    sProm: promedio(slump), sMin: slump.length ? Math.min(...slump) : null, sMax: slump.length ? Math.max(...slump) : null,
    primera: primera ? primera.llegada : '', ultimo: ultima ? ultima.fin : '',
    duracion: primera && ultima ? T.diff(primera.llegada, ultima.fin) : null
  };
}

function filasResumen(r) {
  return [
    ['Volumen total vaciado', `${T.fmt(r.vol, 2)} m³`],
    ['Mixers recibidos', String(r.n)],
    ['Primera llegada / último fin de descargue', `${r.primera || '–'} / ${r.ultimo || '–'}`],
    ['Duración total del vaciado', T.dur(r.duracion)],
    ['Espera promedio (llegada a inicio)', T.dur(r.espera)],
    ['Descargue promedio por mixer', T.dur(r.descargue)],
    ['Asentamiento en obra (prom. / rango)', `${r.sProm != null ? T.fraccion(r.sProm) + '"' : '–'}  (${T.rangoPulg(r.sMin, r.sMax)})`],
    ['Temperatura (prom. / rango)', `${r.tProm != null ? T.fmt(r.tProm) + ' °C' : '–'}  (${T.rango(r.tMin, r.tMax, ' °C')})`]
  ];
}

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

  jornada(j) {
    const c = Excel.c, h = Excel.hoja('Jornada', [8, 17, 9, 11, 10, 9, 13, 13, 12, 26, 32]);
    const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i));
    h.fila([c('CONTROL LLEGADAS DE CONCRETO A OBRA', X.TITULO), ...rep(8, () => c(null, X.TITULO)), c('PS-TUNEL 011', X.TITULO), c(null, X.TITULO)], 30);
    h.comb.push('A1:I1', 'J1:K1');
    h.fila([c('Construcciones El Cóndor S.A.', X.SUB)]); h.comb.push('A2:K2');
    const info = (a, b, cc, d, e, f) => {
      const r = h.sig;
      h.fila([c(a, X.ETIQ), c(b, X.TEXTO), c(null, X.TEXTO), c(null, X.TEXTO), c(cc, X.ETIQ), c(d, X.TEXTO), c(null, X.TEXTO), c(null, X.TEXTO), c(e, X.ETIQ), c(f, X.TEXTO), c(null, X.TEXTO)], 18);
      h.comb.push(`B${r}:D${r}`, `F${r}:H${r}`, `J${r}:K${r}`);
    };
    info('Nombre:', j.nombre, 'Frente:', j.frente, 'Tramo:', j.tramo);
    info('Fecha:', `${T.fechaCorta(j.fecha)} (${T.fechaLarga(j.fecha)})`, 'Turno:', j.turno === 'Noche' ? 'Día [   ]    Noche [ X ]' : 'Día [ X ]    Noche [   ]', '', '');
    h.fila([]);
    h.fila(['Orden\nllegada', 'Código mixer /\nremisión', 'Hora\nllegada', 'Hora inicio\ndescargue', 'Hora fin\ndescargue', 'Cant.\n(m³)', 'Asentamiento\nen planta (")', 'Asentamiento\nen obra (")', 'Temperatura\n(°C)', 'Localización', 'Observación'].map(t => c(t, X.ENC)), 32);
    const pf = h.sig;
    j.mixers.forEach((m, i) => h.fila([c(i + 1, X.NUM), c(m.codigo, X.TEXTO), Excel.hora(m.llegada), Excel.hora(m.inicio), Excel.hora(m.fin),
      Excel.numero(m.cant, X.DEC2), Excel.pulg(m.asPlanta), Excel.pulg(m.asObra), Excel.numero(m.temp, X.NUM), c(m.loc, X.TEXTO), c(m.obs, X.TEXTO)]));
    for (let k = j.mixers.length; k < 10; k++) h.fila([c(k + 1, X.NUM), ...rep(10, i => c(null, i === 0 || i >= 8 ? X.TEXTO : X.CENTRO))]);
    const uf = h.sig - 1, r = resumen(j), rt = h.sig;
    h.fila([...rep(5, i => c(i === 0 ? 'TOTAL VACIADO' : null, X.TOT_ETIQ)), c({ f: `SUM(F${pf}:F${uf})`, v: r.vol }, X.TOT_NUM),
      ...rep(5, i => c(i === 0 ? `${r.n} ${r.n === 1 ? 'mixer' : 'mixers'}` : null, X.TOT_ENT))], 18);
    h.comb.push(`A${rt}:E${rt}`, `G${rt}:K${rt}`);
    h.fila([]);
    const rr = h.sig;
    h.fila(rep(6, i => c(i === 0 ? 'Resumen de la jornada' : null, X.ENC)), 18); h.comb.push(`A${rr}:F${rr}`);
    filasResumen(r).forEach(([k, v]) => { const f = h.sig; h.fila([c(k, X.ETIQ), c(null, X.ETIQ), c(null, X.ETIQ), c(null, X.ETIQ), c(v, X.TEXTO), c(null, X.TEXTO)]); h.comb.push(`A${f}:D${f}`, `E${f}:F${f}`); });
    h.fila([]); h.fila([]);
    h.fila([c(`Elaboró: ${j.nombre || ''}`, X.NORMAL), ...rep(6, () => c(null, X.NORMAL)), c('Revisó / Vo. Bo.', X.NORMAL)]);
    const base = `Concreto_${j.fecha}_${j.turno}` + (j.tramo ? `_Tramo-${j.tramo}` : '');
    return { nombre: T.nombreArchivo(base, '.xlsx'), partes: Excel.libro([h]) };
  },

  historial(jornadas) {
    const c = Excel.c;
    const orden = [...jornadas].sort((a, b) => (a.fecha + a.turno + a.creada).localeCompare(b.fecha + b.turno + b.creada));
    const reg = Excel.hoja('Registros', [11, 8, 16, 9, 7, 17, 9, 11, 10, 9, 12, 12, 11, 26, 32]);
    reg.congelar = 1;
    reg.fila(['Fecha', 'Turno', 'Frente', 'Tramo', 'Orden', 'Código mixer / remisión', 'Hora llegada', 'Hora inicio descargue', 'Hora fin descargue', 'Cant. (m³)', 'Asent. planta (")', 'Asent. obra (")', 'Temp. (°C)', 'Localización', 'Observación'].map(t => c(t, X.ENC)), 32);
    orden.forEach(j => j.mixers.forEach((m, i) => reg.fila([c(T.serialExcel(j.fecha), X.FECHA), c(j.turno, X.CENTRO), c(j.frente, X.TEXTO), c(j.tramo, X.CENTRO),
      c(i + 1, X.NUM), c(m.codigo, X.TEXTO), Excel.hora(m.llegada), Excel.hora(m.inicio), Excel.hora(m.fin), Excel.numero(m.cant, X.DEC2),
      Excel.pulg(m.asPlanta), Excel.pulg(m.asObra), Excel.numero(m.temp, X.NUM), c(m.loc, X.TEXTO), c(m.obs, X.TEXTO)])));
    reg.filtro = `A1:O${Math.max(2, reg.filas.length)}`;
    const res = Excel.hoja('Por jornada', [11, 8, 16, 9, 9, 12, 11, 11, 13, 13, 13, 12]);
    res.congelar = 1;
    res.fila(['Fecha', 'Turno', 'Frente', 'Tramo', 'Mixers', 'Volumen (m³)', 'Primera llegada', 'Último fin descargue', 'Duración vaciado (min)', 'Descargue prom. (min)', 'Asent. obra prom. (")', 'Temp. prom. (°C)'].map(t => c(t, X.ENC)), 32);
    let tm = 0, tv = 0;
    orden.forEach(j => {
      const r = resumen(j); tm += r.n; tv += r.vol;
      res.fila([c(T.serialExcel(j.fecha), X.FECHA), c(j.turno, X.CENTRO), c(j.frente, X.TEXTO), c(j.tramo, X.CENTRO), c(r.n, X.NUM), c(r.vol, X.DEC2),
        Excel.hora(r.primera), Excel.hora(r.ultimo), c(r.duracion, X.NUM), c(r.descargue == null ? null : Math.round(r.descargue), X.NUM),
        c(r.sProm == null ? null : Math.round(r.sProm * 8) / 8, X.FRAC), c(r.tProm == null ? null : Math.round(r.tProm * 10) / 10, X.NUM)]);
    });
    const ult = res.filas.length;
    res.fila([c('TOTAL', X.TOT_ETIQ), c(null, X.TOT_ETIQ), c(null, X.TOT_ETIQ), c(null, X.TOT_ETIQ), c({ f: `SUM(E2:E${ult})`, v: tm }, X.TOT_NUM), c({ f: `SUM(F2:F${ult})`, v: tv }, X.TOT_NUM)]);
    res.comb.push(`A${res.filas.length}:D${res.filas.length}`);
    res.filtro = `A1:L${Math.max(2, ult)}`;
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
