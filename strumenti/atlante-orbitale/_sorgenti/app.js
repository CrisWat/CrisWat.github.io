import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ---------- costanti ----------
const MU = 398600.4418, RE = 6378.137, J2 = 1.08262668e-3, TWO_PI = Math.PI * 2, D2R = Math.PI / 180, R2D = 180 / Math.PI;
const fmt = (x, d = 0) => (x == null || isNaN(x)) ? '—' : x.toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d });
const $ = (s, r = document) => r.querySelector(s);
const el = (tag, attrs = {}, html = '') => { const e = document.createElementNS(tag === 'svg' || attrs._svg ? 'http://www.w3.org/2000/svg' : 'http://www.w3.org/1999/xhtml', tag); for (const [k, v] of Object.entries(attrs)) if (k !== '_svg') e.setAttribute(k, v); if (html) e.innerHTML = html; return e; };
const S = (tag, attrs = {}, txt) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); if (txt != null) e.textContent = txt; return e; };
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const tt = $('#tt');
function showTT(ev, html) { tt.innerHTML = html; tt.style.display = 'block'; const x = Math.min(ev.clientX + 14, innerWidth - 290); tt.style.left = x + 'px'; tt.style.top = (ev.clientY + 14) + 'px'; }
function hideTT() { tt.style.display = 'none'; }

const TYPE_LBL = ['Payload attivo', 'Payload inattivo', 'Rocket body', 'Detrito', 'Sconosciuto'];
const TYPE_COL = ['#4cc9f0', '#8391ad', '#f4a261', '#ff5d7a', '#b9a7ff'];
const REG_LBL = { LEO: 'LEO', MEO: 'MEO', GEO: 'GEO', HEO: 'HEO', SUP: 'Oltre GEO' };
const REG_COL = { LEO: '#4cc9f0', MEO: '#7be495', GEO: '#ffd166', HEO: '#f78c6b', SUP: '#b9a7ff' };
const REG_ORDER = ['LEO', 'MEO', 'GEO', 'HEO', 'SUP'];
const DOM_LBL = { '': 'Non classificato', TELECOMMUNICATIONS: 'Telecomunicazioni', EARTH_OBSERVATION: 'Osservazione della Terra', PNT: 'Navigazione (PNT)', METEOROLOGY: 'Meteorologia', SCIENCE: 'Scienza', TECHNOLOGY: 'Tecnologia', SIGNALS_INTELLIGENCE: 'Intelligence dei segnali', EARLY_WARNING: 'Allerta precoce', OTHER: 'Altro', HUMAN_SPACEFLIGHT: 'Volo umano' };
const DOM_COL = { '': '#566178', TELECOMMUNICATIONS: '#4cc9f0', EARTH_OBSERVATION: '#7be495', PNT: '#ffd166', METEOROLOGY: '#90e0ef', SCIENCE: '#c77dff', TECHNOLOGY: '#f4a261', SIGNALS_INTELLIGENCE: '#ff5d7a', EARLY_WARNING: '#ff9ebb', OTHER: '#8d99ae', HUMAN_SPACEFLIGHT: '#ffffff' };
const CTRY_LBL = { US: 'Stati Uniti', CIS: 'Russia/ex URSS', PRC: 'Cina', UK: 'Regno Unito', FR: 'Francia', JPN: 'Giappone', IND: 'India', ESA: 'ESA', ITSO: 'Intelsat', GER: 'Germania', IT: 'Italia', GLOB: 'Globalstar', CA: 'Canada', SES: 'SES', SKOR: 'Corea del Sud', ORB: 'Orbcomm', EUTE: 'Eutelsat', SPN: 'Spagna', AUS: 'Australia', TURK: 'Turchia', ARGN: 'Argentina', BRAZ: 'Brasile', TBD: 'Da attribuire', '': 'N/D', UAE: 'Emirati Arabi', FIN: 'Finlandia', NOR: 'Norvegia', TWN: 'Taiwan', IM: 'Inmarsat', SEAL: 'Sea Launch' };
const CTRY_COL = { US: '#5ad1ff', PRC: '#ff5d7a', CIS: '#ffd166', UK: '#7be495', FR: '#c77dff', JPN: '#f4a261', IND: '#ff9ebb', ESA: '#90e0ef' };
const GROUP_INFO = {
  station: 'Moduli della ISS e della stazione cinese Tiangong, con i veicoli attraccati (catalogati separatamente).',
  starlink: 'Costellazione SpaceX per l\'accesso a Internet a bassa latenza. Shell principali tra 340 e 560 km, inclinazioni 43°, 53°, 70° e 97,6°.',
  oneweb: 'Costellazione Eutelsat OneWeb: ≈ 650 satelliti a 1 200 km su orbite quasi polari (87,9°), 12 piani.',
  kuiper: 'Progetto Amazon (dal 2025 «Amazon Leo»): dispiegamento iniziato nel 2025 tra 590 e 630 km.',
  qianfan: 'Costellazione cinese «Spacesail»/G60 di Shanghai: piani quasi polari a ≈ 800 km. Il lancio del 2024 ha generato la nube CZ-6A.',
  guowang: 'Costellazione statale cinese China SatNet (Guowang), catalogata come «Hulianwang Jishu Shiyan»/«Hulianwang».',
  iridium: 'Telefonia satellitare: 66 satelliti attivi a 780 km, 86,4°. Iridium 33 fu distrutto nella collisione del 2009.',
  gnss: 'Sistemi di navigazione: GPS (≈ 20 200 km), GLONASS (≈ 19 100 km), Galileo (≈ 23 200 km), BeiDou (MEO + GEO/IGSO).',
  c_fengyun: 'Frammenti del satellite meteo cinese distrutto da un test antisatellite il 11/1/2007 a ≈ 865 km.',
  c_cosmos2251: 'Frammenti del satellite russo spento che il 10/2/2009 colpì Iridium 33 a 789 km.',
  c_iridium33: 'Frammenti del satellite Iridium attivo distrutto nella collisione del 2009.',
  c_cz6a: 'Frammenti dello stadio superiore del Lunga Marcia 6A esploso nell\'agosto 2024 dopo il lancio dei primi Qianfan.',
  c_noaa16: 'Satellite meteo NOAA dismesso, frammentato nel novembre 2015 (probabile guasto batterie).',
  c_dmsp13: 'Satellite meteo militare USA esploso nel febbraio 2015 per un guasto alla batteria.'
};

// ---------- decodifica dati ----------
async function loadData() {
  const b64 = $('#satdata').textContent.trim();
  const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const ds = new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'));
  const txt = await new Response(ds).text();
  return JSON.parse(txt);
}

const DB = {};
function prepare(raw) {
  const c = raw.cols, N = c.id.length, m = raw.meta;
  DB.meta = m; DB.c = c; DB.N = N;
  DB.ref = Date.parse(m.ref);
  DB.a = new Float64Array(N); DB.alt = new Float64Array(N); DB.per = new Float64Array(N); DB.apo = new Float64Array(N);
  DB.T = new Float64Array(N); DB.cls = new Uint8Array(N); DB.reg = new Array(N);
  DB.n0 = new Float64Array(N); DB.dO = new Float64Array(N); DB.dw = new Float64Array(N); DB.dM = new Float64Array(N);
  for (let k = 0; k < N; k++) {
    const n = c.n[k] * TWO_PI / 86400, a = Math.cbrt(MU / (n * n)), e = c.e[k], inc = c.i[k] * D2R;
    DB.a[k] = a; DB.alt[k] = a - RE; DB.per[k] = a * (1 - e) - RE; DB.apo[k] = a * (1 + e) - RE; DB.T[k] = 1440 / c.n[k];
    const t = c.t[k]; DB.cls[k] = t === 0 ? (c.st[k] === 1 ? 0 : 1) : t === 1 ? 2 : t === 2 ? 3 : 4;
    DB.reg[k] = regime(DB.per[k], DB.apo[k], DB.alt[k], e);
    const p = a * (1 - e * e), f = J2 * (RE / p) ** 2, ci = Math.cos(inc);
    DB.n0[k] = n;
    DB.dO[k] = -1.5 * n * f * ci;
    DB.dw[k] = 0.75 * n * f * (5 * ci * ci - 1);
    DB.dM[k] = n * (1 + 0.75 * f * Math.sqrt(1 - e * e) * (3 * ci * ci - 1));
  }
}
function regime(per, apo, alt, e) {
  if (apo < 2000) return 'LEO';
  if (e >= 0.25) return 'HEO';
  if (Math.abs(alt - 35786) <= 250) return 'GEO';
  if (alt < 35536) return 'MEO';
  return 'SUP';
}

// ---------- propagazione Kepler + J2 secolare ----------
// restituisce ECI [km] e velocita' [km/s]
function propagate(k, tMs, out) {
  const c = DB.c, dt = (tMs - DB.ref) / 1000 - c.ep[k];
  const e = c.e[k], inc = c.i[k] * D2R;
  const dtd = dt / 86400;
  // decadimento al primo ordine: ndot/2 [giri/g^2]
  let M = c.M[k] * D2R + DB.dM[k] * dt + TWO_PI * c.nd[k] * dtd * dtd;
  const nNow = DB.n0[k] + 2 * c.nd[k] * dtd * TWO_PI / 86400;
  const a = nNow > 0 ? Math.cbrt(MU / (nNow * nNow)) : DB.a[k];
  const O = c.O[k] * D2R + DB.dO[k] * dt, w = c.w[k] * D2R + DB.dw[k] * dt;
  M = M % TWO_PI;
  let E = e < 0.8 ? M : Math.PI;
  for (let it = 0; it < 12; it++) { const d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); E -= d; if (Math.abs(d) < 1e-10) break; }
  const cE = Math.cos(E), sE = Math.sin(E), sq = Math.sqrt(1 - e * e);
  const xp = a * (cE - e), yp = a * sq * sE;
  const r = a * (1 - e * cE);
  const vf = Math.sqrt(MU * a) / r; const vxp = -vf * sE, vyp = vf * sq * cE;
  const cO = Math.cos(O), sO = Math.sin(O), cw = Math.cos(w), sw = Math.sin(w), ci = Math.cos(inc), si = Math.sin(inc);
  const r11 = cO * cw - sO * sw * ci, r12 = -cO * sw - sO * cw * ci, r21 = sO * cw + cO * sw * ci, r22 = -sO * sw + cO * cw * ci, r31 = sw * si, r32 = cw * si;
  out[0] = r11 * xp + r12 * yp; out[1] = r21 * xp + r22 * yp; out[2] = r31 * xp + r32 * yp;
  if (out.length > 3) { out[3] = r11 * vxp + r12 * vyp; out[4] = r21 * vxp + r22 * vyp; out[5] = r31 * vxp + r32 * vyp; out[6] = a; }
  return out;
}
function gmst(tMs) { const jd = tMs / 86400000 + 2440587.5; return ((280.46061837 + 360.98564736629 * (jd - 2451545.0)) % 360) * D2R; }

// ---------- GLOBO ----------
const G = { colorMode: 'type', show: [true, true, true, true, true], hl: '', speed: 60, t: 0, sel: -1 };
let renderer, scene, camera, controls, points, geom, earth, orbitLine, posArr, colArr, sizeArr;
const SCALE = 1 / RE;
function initGlobe() {
  const canvas = $('#globe'), wrap = $('#globeWrap');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(40, 1, 0.01, 2000);
  camera.position.set(4.2, 2.6, 6.4);
  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.08; controls.minDistance = 1.3; controls.maxDistance = 220; controls.rotateSpeed = 0.6;
  // Terra
  earth = new THREE.Group(); scene.add(earth);
  earth.add(new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), new THREE.MeshBasicMaterial({ color: 0x0b1c33 })));
  const atm = new THREE.Mesh(new THREE.SphereGeometry(1.06, 64, 48), new THREE.ShaderMaterial({
    transparent: true, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec3 vN;varying vec3 vV;void main(){vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader: 'varying vec3 vN;varying vec3 vV;void main(){float f=pow(1.0-abs(dot(vN,vV)),3.0);gl_FragColor=vec4(0.3,0.65,1.0,1.0)*f*0.9;}'
  }));
  scene.add(atm);
  // reticolo
  const gp = [];
  for (let lat = -60; lat <= 60; lat += 30) for (let lon = 0; lon < 360; lon += 3) { gp.push(...ll(lat, lon, 1.001), ...ll(lat, lon + 3, 1.001)); }
  for (let lon = 0; lon < 360; lon += 30) for (let lat = -90; lat < 90; lat += 3) { gp.push(...ll(lat, lon, 1.001), ...ll(lat + 3, lon, 1.001)); }
  const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3));
  earth.add(new THREE.LineSegments(gg, new THREE.LineBasicMaterial({ color: 0x173252, transparent: true, opacity: 0.6 })));
  loadCoast();
  // anello GEO di riferimento
  const ringPts = []; const rg = (RE + 35786) * SCALE;
  for (let k = 0; k <= 256; k++) { const t = k / 256 * TWO_PI; ringPts.push(new THREE.Vector3(rg * Math.cos(t), 0, -rg * Math.sin(t))); }
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts), new THREE.LineBasicMaterial({ color: 0x3d3a1c, transparent: true, opacity: 0.5 })));
  // punti
  const N = DB.N;
  posArr = new Float32Array(N * 3); colArr = new Float32Array(N * 3); sizeArr = new Float32Array(N);
  geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(posArr, 3).setUsage(THREE.DynamicDrawUsage));
  geom.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
  geom.setAttribute('size', new THREE.BufferAttribute(sizeArr, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: { dpr: { value: renderer.getPixelRatio() } },
    vertexShader: 'attribute vec3 color;attribute float size;uniform float dpr;varying vec3 vC;varying float vS;void main(){vC=color;vS=size;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=size*dpr;gl_Position=projectionMatrix*mv;}',
    fragmentShader: 'varying vec3 vC;varying float vS;void main(){if(vS<0.1)discard;vec2 p=gl_PointCoord-0.5;float d=length(p);if(d>0.5)discard;float a=smoothstep(0.5,0.32,d);gl_FragColor=vec4(vC,a);}'
  });
  points = new THREE.Points(geom, mat); points.frustumCulled = false; scene.add(points);
  orbitLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }));
  orbitLine.frustumCulled = false; scene.add(orbitLine);
  const ro = new ResizeObserver(() => { const w = wrap.clientWidth, h = wrap.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); });
  ro.observe(wrap);
  canvas.addEventListener('pointerdown', e => { G.down = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointerup', e => { if (G.down && Math.hypot(e.clientX - G.down[0], e.clientY - G.down[1]) < 5) pick(e); });
  restyle();
  G.t = DB.ref + 6.5 * 3600e3;
}
function ll(lat, lon, r = 1) { const la = lat * D2R, lo = lon * D2R; const x = r * Math.cos(la) * Math.cos(lo), y = r * Math.cos(la) * Math.sin(lo), z = r * Math.sin(la); return [x, z, -y]; }
async function loadCoast() {
  try {
    const topo = await (await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-110m.json')).json();
    // decodifica topojson (archi quantizzati)
    const [sx, sy] = topo.transform.scale, [tx, ty] = topo.transform.translate; const pts = [];
    for (const arc of topo.arcs) { let x = 0, y = 0, prev = null; for (const [dx, dy] of arc) { x += dx; y += dy; const lon = x * sx + tx, lat = y * sy + ty; const p = ll(lat, lon, 1.002); if (prev) pts.push(...prev, ...p); prev = p; } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    earth.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x3f79b0 })));
  } catch (e) { /* reticolo soltanto */ }
}
const tmpC = new THREE.Color();
function colorOf(k) {
  const m = G.colorMode;
  if (m === 'type') return TYPE_COL[DB.cls[k]];
  if (m === 'regime') return REG_COL[DB.reg[k]];
  if (m === 'mission') { if (DB.c.t[k] !== 0) return '#2a3346'; return DOM_COL[DB.meta.dom[DB.c.md[k]]] || '#566178'; }
  if (m === 'country') return CTRY_COL[DB.meta.cc[DB.c.c[k]]] || '#56607a';
}
function inHL(k) {
  const h = G.hl; if (!h) return true;
  if (h.startsWith('r_')) return DB.reg[k] === h.slice(2);
  return DB.meta.groups[DB.c.g[k]] === h;
}
function restyle() {
  const N = DB.N; let vis = 0, hl = 0;
  for (let k = 0; k < N; k++) {
    tmpC.set(colorOf(k));
    const show = G.show[DB.cls[k]]; const h = inHL(k);
    let s = 0;
    if (show) { s = G.hl ? (h ? 4.5 : 1.3) : (DB.cls[k] === 3 ? 1.8 : 2.2); vis++; if (G.hl && h) hl++; }
    if (G.hl && !h) tmpC.multiplyScalar(0.28);
    if (DB.c.g[k] === 1 && show) s = Math.max(s, 6);
    if (k === G.sel) { s = 9; tmpC.set('#ffffff'); }
    colArr[k * 3] = tmpC.r; colArr[k * 3 + 1] = tmpC.g; colArr[k * 3 + 2] = tmpC.b; sizeArr[k] = s;
  }
  geom.attributes.color.needsUpdate = true; geom.attributes.size.needsUpdate = true;
  $('#hlInfo').innerHTML = G.hl ? `<b class="mono">${fmt(hl)}</b> oggetti evidenziati. ${GROUP_INFO[G.hl] || ''}` : '';
  legend();
}
function legend() {
  const L = $('#legend'); let items = [];
  if (G.colorMode === 'type') items = TYPE_LBL.map((l, i) => [TYPE_COL[i], l]);
  if (G.colorMode === 'regime') items = REG_ORDER.map(r => [REG_COL[r], { LEO: 'LEO < 2 000 km', MEO: 'MEO 2 000–35 500 km', GEO: 'GEO ≈ 35 786 km', HEO: 'HEO ellittiche (e ≥ 0,25)', SUP: 'Oltre GEO / cimitero' }[r]]);
  if (G.colorMode === 'mission') items = Object.keys(DOM_LBL).filter(k => k !== '').map(k => [DOM_COL[k], DOM_LBL[k]]).concat([['#2a3346', 'Non payload']]);
  if (G.colorMode === 'country') items = Object.keys(CTRY_COL).map(k => [CTRY_COL[k], CTRY_LBL[k]]).concat([['#56607a', 'Altri']]);
  L.innerHTML = items.map(([c, l]) => `<div><i style="background:${c}"></i>${l}</div>`).join('');
}
const tmp7 = new Float64Array(7);
function updatePositions() {
  const N = DB.N, t = G.t;
  for (let k = 0; k < N; k++) {
    if (sizeArr[k] === 0) continue;
    propagate(k, t, tmp7);
    posArr[k * 3] = tmp7[0] * SCALE; posArr[k * 3 + 1] = tmp7[2] * SCALE; posArr[k * 3 + 2] = -tmp7[1] * SCALE;
  }
  geom.attributes.position.needsUpdate = true;
  earth.rotation.y = gmst(t);
}
function pick(e) {
  const rect = renderer.domElement.getBoundingClientRect(); const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  const v = new THREE.Vector3(); let best = -1, bd = 12 * 12; const camD = camera.position.length();
  for (let k = 0; k < DB.N; k++) {
    if (sizeArr[k] < 1.5) continue;
    v.set(posArr[k * 3], posArr[k * 3 + 1], posArr[k * 3 + 2]);
    // nascosto dietro la Terra?
    if (occluded(v)) continue;
    v.project(camera); if (v.z > 1) continue;
    const sx = (v.x + 1) / 2 * rect.width, sy = (1 - v.y) / 2 * rect.height; const dd = (sx - mx) ** 2 + (sy - my) ** 2;
    if (dd < bd) { bd = dd; best = k; }
  }
  select(best);
}
function occluded(v) { // il segmento camera→punto attraversa la Terra?
  const o = camera.position, dx = v.x - o.x, dy = v.y - o.y, dz = v.z - o.z, L = Math.hypot(dx, dy, dz);
  const ux = dx / L, uy = dy / L, uz = dz / L, tca = -(o.x * ux + o.y * uy + o.z * uz); if (tca < 0 || tca > L) return false;
  const cx = o.x + ux * tca, cy = o.y + uy * tca, cz = o.z + uz * tca; return cx * cx + cy * cy + cz * cz < 1;
}
function select(k) {
  G.sel = k; restyle();
  if (k < 0) { $('#info').classList.remove('on'); orbitLine.visible = false; return; }
  // traccia orbita
  const T = DB.T[k] * 60e3, pts = [], o = new Float64Array(3);
  for (let j = 0; j <= 240; j++) { propagate(k, G.t + T * j / 240, o); pts.push(new THREE.Vector3(o[0] * SCALE, o[2] * SCALE, -o[1] * SCALE)); }
  orbitLine.geometry.dispose(); orbitLine.geometry = new THREE.BufferGeometry().setFromPoints(pts); orbitLine.visible = true;
  orbitLine.material.color.set(colorOf(k));
  $('#info').classList.add('on'); infoCard();
}
const STATUS = { 1: 'Attivo', 0: 'Non operativo', '-1': 'N/D' };
function explain(k) {
  const c = DB.c, r = DB.reg[k], cls = DB.cls[k], g = DB.meta.groups[c.g[k]];
  const parts = [];
  if (GROUP_INFO[g]) parts.push(GROUP_INFO[g]);
  if (cls === 2) parts.push('Stadio superiore di lanciatore rimasto in orbita: oggetto massiccio e non controllato.');
  if (cls === 3) parts.push('Frammento catalogato: nessuna capacità di manovra, sezione d\'urto piccola ma velocità relativa di km/s.');
  const inc = c.i[k];
  if (r === 'LEO' && inc > 96 && inc < 100.5 && DB.c.e[k] < 0.01) parts.push('Orbita quasi eliosincrona: passa sempre alla stessa ora solare locale.');
  if (r === 'GEO') parts.push('Ruota con la Terra: visto dal suolo resta quasi fermo nel cielo.');
  if (r === 'HEO' && Math.abs(inc - 63.4) < 2) parts.push('Inclinazione critica 63,4°: l\'apogeo resta fermo sopra lo stesso emisfero.');
  if (r === 'HEO' && inc < 30 && DB.per[k] < 1000) parts.push('Probabile orbita di trasferimento geostazionario (GTO).');
  if (r === 'LEO') { const l = KS.life(DB.per[k] + (DB.apo[k] - DB.per[k]) * 0.25); parts.push(`Vita orbitale indicativa senza propulsione: ${l < 1 ? 'meno di un anno' : l < 3 ? 'pochi anni' : '≈ ' + fmt(l < 100 ? Math.round(l / 5) * 5 : Math.round(l / 50) * 50) + ' anni'}.`); }
  return parts.join(' ');
}
function infoCard() {
  const k = G.sel; if (k < 0) return; const c = DB.c;
  propagate(k, G.t, tmp7);
  const r = Math.hypot(tmp7[0], tmp7[1], tmp7[2]), v = Math.hypot(tmp7[3], tmp7[4], tmp7[5]);
  const lat = Math.asin(tmp7[2] / r) * R2D; let lon = (Math.atan2(tmp7[1], tmp7[0]) - gmst(G.t)) * R2D; lon = ((lon + 540) % 360) - 180;
  const dom = DB.meta.dom[c.md[k]], cc = DB.meta.cc[c.c[k]];
  const rows = [
    ['NORAD / COSPAR', `${c.id[k]} · ${c.cos[k]}`],
    ['Tipo', TYPE_LBL[DB.cls[k]]],
    c.t[k] === 0 ? ['Missione', DOM_LBL[dom] || '—'] : null,
    ['Paese / operatore', `${CTRY_LBL[cc] || cc || '—'}${DB.meta.groups[c.g[k]] === 'station' && /^ISS/.test(c.nm[k]) ? ' (stato di registrazione del modulo)' : ''}`],
    ['Lancio', c.ld[k] || '—'],
    c.ms[k] ? ['Massa (secco)', fmt(c.ms[k]) + ' kg'] : null,
    ['Regime', REG_LBL[DB.reg[k]]],
    ['Perigeo / apogeo', `${fmt(DB.per[k])} / ${fmt(DB.apo[k])} km`],
    ['Inclinazione', fmt(c.i[k], 2) + '°'],
    ['Periodo', DB.T[k] < 300 ? fmt(DB.T[k], 1) + ' min' : fmt(DB.T[k] / 60, 2) + ' h'],
    ['Quota ora', fmt(r - RE) + ' km'],
    ['Velocità ora', fmt(v, 2) + ' km/s · ' + fmt(v * 3600) + ' km/h'],
    ['Sotto il satellite', `${fmt(lat, 1)}°, ${fmt(lon, 1)}°`],
    ['Sezione radar', ['N/D', 'piccola (< 0,1 m²)', 'media (0,1–1 m²)', 'grande (> 1 m²)'][c.rcs[k]]],
  ].filter(Boolean);
  $('#info').innerHTML = `<button class="x" id="infoX">×</button><h3>${c.nm[k]}</h3><div class="note">${c.t[k] === 0 ? (STATUS[c.st[k]] || '') : ''}</div>
    <table>${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table><div class="expl">${explain(k)}</div>`;
  $('#infoX').onclick = () => select(-1);
}
function tags() {
  const box = $('#tags'); const rect = renderer.domElement.getBoundingClientRect(); const out = [];
  const list = [[STN.iss, 'ISS'], [STN.css, 'Tiangong']]; if (G.sel >= 0 && G.sel !== STN.iss && G.sel !== STN.css) list.push([G.sel, DB.c.nm[G.sel]]);
  const v = new THREE.Vector3();
  for (const [k, name] of list) {
    if (k < 0 || sizeArr[k] === 0) continue;
    v.set(posArr[k * 3], posArr[k * 3 + 1], posArr[k * 3 + 2]);
    if (occluded(v)) continue;
    v.project(camera); if (v.z > 1) continue;
    out.push(`<div class="tag" style="left:${(v.x + 1) / 2 * rect.width}px;top:${(1 - v.y) / 2 * rect.height}px">${name}</div>`);
  }
  box.innerHTML = out.join('');
}
let last = performance.now(), infoTick = 0;
function loop(now) {
  const dt = Math.min(now - last, 100); last = now;
  G.t += dt * G.speed;
  updatePositions(); controls.update(); renderer.render(scene, camera); tags();
  if (now - infoTick > 250) { infoTick = now; clock(); if (G.sel >= 0) infoCard(); stationLive(); }
  requestAnimationFrame(loop);
}
function clock() {
  const d = new Date(G.t); const days = (G.t - DB.ref) / 86400e3;
  $('#clock').innerHTML = `${d.toISOString().replace('T', ' ').slice(0, 19)} UTC<br><span class="${Math.abs(days) > 7 ? 'warn' : 'note'}">${days >= 0 ? '+' : ''}${fmt(days, 1)} giorni dallo snapshot${Math.abs(days) > 7 ? ' · precisione degradata' : ''}</span>`;
}
function setView(v) {
  const dir = camera.position.clone().normalize();
  const dist = { leo: 3.2, mid: 8, all: 17, far: 30 }[v];
  camera.position.copy(dir.multiplyScalar(dist));
  document.querySelectorAll('.views .btn').forEach(b => b.classList.toggle('on', b.dataset.v === v));
}
function globeUI() {
  const tf = $('#typeFilters'); const cnt = [0, 0, 0, 0, 0]; for (let k = 0; k < DB.N; k++) cnt[DB.cls[k]]++;
  tf.innerHTML = TYPE_LBL.map((l, i) => `<label class="chk"><input type="checkbox" data-i="${i}" checked><span class="sw" style="background:${TYPE_COL[i]}"></span>${l}<span class="n">${fmt(cnt[i])}</span></label>`).join('');
  tf.addEventListener('change', e => { G.show[+e.target.dataset.i] = e.target.checked; restyle(); });
  $('#colorMode').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; G.colorMode = b.dataset.m; $('#colorMode').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); restyle(); });
  $('#hlSel').addEventListener('change', e => { G.hl = e.target.value; restyle(); });
  $('#speeds').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; G.speed = +b.dataset.s; $('#speeds').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); });
  $('#tSnap').onclick = () => { G.t = DB.ref + 6.5 * 3600e3; };
  $('#tNow').onclick = () => { G.t = Date.now(); };
  document.querySelectorAll('.views .btn').forEach(b => b.onclick = () => setView(b.dataset.v));
  if (innerWidth < 760) $('#gpanel').classList.add('min');
  $('#mobToggle').onclick = () => $('#gpanel').classList.toggle('min');
  const s = $('#search'), res = $('#results');
  s.addEventListener('input', () => {
    const q = s.value.trim().toUpperCase(); if (q.length < 2) { res.innerHTML = ''; return; }
    const out = []; for (let k = 0; k < DB.N && out.length < 30; k++) if (DB.c.nm[k].includes(q) || String(DB.c.id[k]) === q) out.push(k);
    res.innerHTML = out.map(k => `<div data-k="${k}">${DB.c.nm[k]} <span class="note">${DB.c.id[k]}</span></div>`).join('') || '<div class="note">nessun risultato</div>';
  });
  res.addEventListener('click', e => { const d = e.target.closest('[data-k]'); if (!d) return; const k = +d.dataset.k; if (!G.show[DB.cls[k]]) { G.show[DB.cls[k]] = true; tf.querySelector(`[data-i="${DB.cls[k]}"]`).checked = true; } select(k); focusOn(k); });
}
function focusOn(k) {
  propagate(k, G.t, tmp7); const r = Math.hypot(tmp7[0], tmp7[1], tmp7[2]) * SCALE;
  const rv = new THREE.Vector3(tmp7[0], tmp7[2], -tmp7[1]).normalize(), vv = new THREE.Vector3(tmp7[3], tmp7[5], -tmp7[4]);
  const hv = rv.clone().cross(vv).normalize(); // normale al piano orbitale: vista obliqua, non di taglio
  const p = rv.multiplyScalar(1).add(hv.multiplyScalar(0.8)).normalize().multiplyScalar(Math.max(r * 2.4, 3.2));
  camera.position.copy(p);
}
window.__focus = (group, k) => { document.getElementById('globeSec').scrollIntoView({ behavior: 'smooth' }); if (group != null) { G.hl = group; $('#hlSel').value = group; restyle(); } if (k != null) { select(k); focusOn(k); } };

// ---------- grafici SVG ----------
function hbars(svg, items, o = {}) {
  svg.innerHTML = ''; const W = +svg.viewBox.baseVal.width, lw = o.lw || 170, bh = o.bh || 22, gap = 6;
  const H = items.length * (bh + gap) + 10; svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const max = Math.max(...items.map(i => i.parts ? i.parts.reduce((a, p) => a + p.v, 0) : i.v));
  items.forEach((it, j) => {
    const y = j * (bh + gap) + 4; svg.appendChild(S('text', { x: lw - 8, y: y + bh / 2 + 4, 'text-anchor': 'end', style: 'fill:var(--ink2);font-size:11px;font-family:var(--sans)' }, it.l));
    let x = lw; const parts = it.parts || [{ v: it.v, c: it.c }]; let tot = 0;
    for (const p of parts) { const w = p.v / max * (W - lw - 70); const r = S('rect', { x, y, width: Math.max(w, 0), height: bh, fill: p.c, rx: 2 }); r.addEventListener('mousemove', ev => showTT(ev, `${it.l}${p.l ? ' · ' + p.l : ''}<br><b>${fmt(p.v)}</b>${o.unit || ''}`)); r.addEventListener('mouseleave', hideTT); svg.appendChild(r); x += w; tot += p.v; }
    svg.appendChild(S('text', { x: x + 6, y: y + bh / 2 + 4, style: 'fill:var(--ink);font-size:11px' }, fmt(tot) + (o.unit || '')));
  });
}
function vbarsStack(svg, labels, series, o = {}) { // series: [{l,c,v:[]}]
  svg.innerHTML = ''; const W = +svg.viewBox.baseVal.width, H = +svg.viewBox.baseVal.height, m = { l: 44, r: 10, t: 10, b: 28 };
  const n = labels.length, tot = labels.map((_, i) => series.reduce((a, s) => a + s.v[i], 0)), max = niceMax(Math.max(...tot));
  const bw = (W - m.l - m.r) / n; const yS = v => H - m.b - v / max * (H - m.t - m.b);
  for (let g = 0; g <= 4; g++) { const v = max * g / 4, y = yS(v); svg.appendChild(S('line', { x1: m.l, x2: W - m.r, y1: y, y2: y, class: 'gl' })); svg.appendChild(S('text', { x: m.l - 6, y: y + 3, 'text-anchor': 'end' }, fmt(v))); }
  labels.forEach((lb, i) => {
    let y0 = H - m.b; const x = m.l + i * bw;
    series.forEach(s => { const h = s.v[i] / max * (H - m.t - m.b); if (h <= 0) return; const r = S('rect', { x: x + 0.5, y: y0 - h, width: Math.max(bw - 1, 0.8), height: h, fill: s.c }); r.addEventListener('mousemove', ev => showTT(ev, `${lb} · ${s.l}<br><b>${fmt(s.v[i])}</b>`)); r.addEventListener('mouseleave', hideTT); svg.appendChild(r); y0 -= h; });
    if (o.every && i % o.every === 0) svg.appendChild(S('text', { x: x + bw / 2, y: H - m.b + 14, 'text-anchor': 'middle' }, lb));
  });
  if (o.legend) legendSvg(svg, series, m.l + 8, m.t + 6);
}
function niceMax(v) { const p = 10 ** Math.floor(Math.log10(v)); for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p; return v; }
function legendSvg(svg, series, x, y) { series.forEach((s, i) => { svg.appendChild(S('rect', { x, y: y + i * 15, width: 9, height: 9, fill: s.c, rx: 2 })); svg.appendChild(S('text', { x: x + 14, y: y + i * 15 + 8, style: 'fill:var(--ink2)' }, s.l)); }); }

// ---------- sezione orbite ----------
function circ(h) {
  const r = RE + h, v = Math.sqrt(MU / r), T = TWO_PI * Math.sqrt(r ** 3 / MU);
  const cov = e => { const eps = e * D2R; return (Math.acos(RE * Math.cos(eps) / r) - eps) * RE; };
  return { v, T, vesc: v * Math.SQRT2, rev: 86400 / T, lat: 2 * h / 299792.458 * 1000, cov0: cov(0), cov25: cov(25), g: 9.80665 * (RE / r) ** 2, frac: (1 - Math.cos(Math.acos(RE / r))) / 2 };
}
const CPRE = [['ISS', 420], ['Starlink', 550], ['SSO', 786], ['OneWeb', 1200], ['GPS', 20200], ['Galileo', 23222], ['GEO', 35786]];
function calcUI() {
  const sl = $('#cAlt'); const hmin = 160, hmax = 40000;
  const toH = x => hmin * Math.pow(hmax / hmin, x / 1000), toX = h => Math.log(h / hmin) / Math.log(hmax / hmin) * 1000;
  $('#cPresets').innerHTML = CPRE.map(([l, h]) => `<button data-h="${h}">${l}</button>`).join('');
  $('#cPresets').onclick = e => { const b = e.target.closest('button'); if (!b) return; sl.value = toX(+b.dataset.h); upd(+b.dataset.h); };
  sl.oninput = () => { let h = toH(+sl.value); h = h < 2000 ? Math.round(h / 5) * 5 : Math.round(h / 50) * 50; upd(h); };
  function upd(h) {
    const o = circ(h); $('#cAltV').textContent = fmt(h) + ' km';
    const T = o.T / 60; const life = h < 2000 ? KS.life(h) : Infinity;
    const cards = [
      ['Velocità', fmt(o.v, 2), 'km/s', `${fmt(o.v * 3600)} km/h`],
      ['Periodo', T < 180 ? fmt(T, 1) : fmt(T / 60, 2), T < 180 ? 'min' : 'h', `${fmt(o.rev, 2)} giri al giorno`],
      ['Velocità di fuga', fmt(o.vesc, 2), 'km/s', 'da questa quota'],
      ['Latenza minima', fmt(o.lat, 1), 'ms', 'andata-ritorno al nadir'],
      ['Raggio di copertura', fmt(o.cov25), 'km', `elevazione ≥ 25° · orizzonte ${fmt(o.cov0)} km`],
      ['Vita orbitale', life === Infinity ? '∞' : life < 1 ? '< 1' : fmt(life < 100 ? life : Math.round(life / 10) * 10), life === Infinity || life < 1 ? '' : 'anni', h < 2000 ? 'senza propulsione, Sole medio' : 'nessun freno atmosferico'],
    ];
    $('#cOut').innerHTML = cards.map(c => `<div class="card"><div class="lbl">${c[0]}</div><div class="stat">${c[1]} <small>${c[2]}</small></div><div class="note">${c[3]}</div></div>`).join('');
    drawScale(h);
  }
  sl.value = toX(550); upd(550);
}
function drawScale(h) {
  const svg = $('#scaleSvg'); svg.innerHTML = ''; const W = 560, H = 360, cx = 150, cy = 180;
  const rmax = RE + 36500, sc = 165 / rmax; // sinistra la Terra, archi delle orbite
  svg.appendChild(S('circle', { cx, cy, r: RE * sc, fill: '#0b1c33', stroke: '#3f79b0' }));
  const ref = [['LEO 2 000', 2000, '#4cc9f0'], ['GPS', 20200, '#7be495'], ['GEO', 35786, '#ffd166']];
  for (const [l, a, c] of ref) { svg.appendChild(S('circle', { cx, cy, r: (RE + a) * sc, fill: 'none', stroke: c, 'stroke-opacity': 0.35, 'stroke-dasharray': '3 3' })); svg.appendChild(S('text', { x: cx + (RE + a) * sc * 0.72 + 4, y: cy - (RE + a) * sc * 0.70, style: `fill:${c}` }, l)); }
  svg.appendChild(S('circle', { cx, cy, r: (RE + h) * sc, fill: 'none', stroke: '#fff', 'stroke-width': 1.6 }));
  // zoom LEO a destra
  const x0 = 330, w = 130; svg.appendChild(S('text', { x: x0, y: 30, style: 'fill:var(--ink2)' }, 'Zoom: superficie → 2 000 km'));
  const yS = a => 330 - a / 2000 * 270;
  svg.appendChild(S('rect', { x: x0, y: yS(0), width: w, height: 12, fill: '#0b1c33', stroke: '#3f79b0' }));
  for (const [l, a] of [['ISS 420', 420], ['Starlink 550', 550], ['SSO 786', 786], ['Fengyun-1C 865', 865], ['OneWeb 1 200', 1200], ['Karman 100', 100]]) {
    svg.appendChild(S('line', { x1: x0, x2: x0 + w, y1: yS(a), y2: yS(a), stroke: '#2a3c5c' })); svg.appendChild(S('text', { x: x0 + w + 4, y: yS(a) + 3 }, l));
  }
  if (h <= 2000) svg.appendChild(S('line', { x1: x0, x2: x0 + w, y1: yS(h), y2: yS(h), stroke: '#fff', 'stroke-width': 2 }));
  svg.appendChild(S('text', { x: cx, y: 350, 'text-anchor': 'middle', style: 'fill:var(--ink2)' }, `quota scelta: ${fmt(h)} km (${fmt(h / RE * 100, 1)}% del raggio terrestre)`));
}
function regimeCards() {
  const cnt = {}; for (const r of REG_ORDER) cnt[r] = [0, 0, 0, 0, 0];
  for (let k = 0; k < DB.N; k++) cnt[DB.reg[k]][DB.cls[k]]++;
  const info = {
    LEO: ['Orbita bassa · < 2 000 km', '7,8–6,9 km/s · 90–127 min', ['Internet a bassa latenza (Starlink, OneWeb, Kuiper)', 'Osservazione della Terra e meteo polari', 'Stazioni spaziali', 'Regione più affollata e a rischio detriti']],
    MEO: ['Orbita media · 2 000–35 500 km', '≈ 3,9 km/s a 20 000 km · 12 h', ['Navigazione: GPS, Galileo, GLONASS, BeiDou', 'Comunicazioni O3b/mPOWER (8 000 km)', 'Fasce di Van Allen: radiazione elevata']],
    GEO: ['Geostazionaria · 35 786 km', '3,07 km/s · 23 h 56 min', ['TV, comunicazioni, meteo (Meteosat, GOES)', 'Posizioni assegnate in ITU (slot orbitali)', 'Fine vita: «cimitero» 300 km più in alto']],
    HEO: ['Ellittiche · e ≥ 0,25', 'veloci al perigeo, lente all\'apogeo', ['Molniya/Tundra: copertura ad alte latitudini', 'Orbite di trasferimento (GTO) e stadi relativi', 'Osservatori scientifici']],
  };
  $('#regimeCards').innerHTML = ['LEO', 'MEO', 'GEO', 'HEO'].map(r => {
    const c = cnt[r], tot = c.reduce((a, b) => a + b, 0);
    return `<div class="card regime" style="border-top-color:${REG_COL[r]}"><div class="lbl">${info[r][0]}</div><div class="stat">${fmt(tot)} <small>oggetti</small></div>
    <div class="note mono">${info[r][1]}</div><div style="margin:6px 0">${c.map((v, i) => v ? `<span class="pill" style="border-color:${TYPE_COL[i]}">${TYPE_LBL[i]}: ${fmt(v)}</span>` : '').join('')}</div><ul>${info[r][2].map(x => `<li>${x}</li>`).join('')}</ul></div>`;
  }).join('');
}
function altHist() {
  const svg = $('#altHist'); svg.innerHTML = ''; const W = 1100, H = 340, m = { l: 50, r: 16, t: 14, b: 34 };
  const h0 = 150, h1 = 45000, nb = 140, lg = Math.log(h1 / h0);
  const xS = h => m.l + Math.log(h / h0) / lg * (W - m.l - m.r);
  const bins = Array.from({ length: 5 }, () => new Float64Array(nb));
  for (let k = 0; k < DB.N; k++) { const h = DB.alt[k]; if (h < h0 || h >= h1) continue; const b = Math.floor(Math.log(h / h0) / lg * nb); bins[DB.cls[k]][b]++; }
  let max = 0; for (let b = 0; b < nb; b++) { let s = 0; for (let t = 0; t < 5; t++) s += bins[t][b]; max = Math.max(max, s); }
  // scala sqrt per non schiacciare i picchi minori
  const yS = v => H - m.b - Math.sqrt(v / max) * (H - m.t - m.b);
  for (const g of [10, 100, 500, 1000, 2000, 5000, 10000].filter(g => g < max)) { const y = yS(g); svg.appendChild(S('line', { x1: m.l, x2: W - m.r, y1: y, y2: y, class: 'gl' })); svg.appendChild(S('text', { x: m.l - 6, y: y + 3, 'text-anchor': 'end' }, fmt(g))); }
  for (const t of [200, 500, 1000, 2000, 5000, 10000, 20000, 35786]) { const x = xS(t); svg.appendChild(S('line', { x1: x, x2: x, y1: H - m.b, y2: H - m.b + 4, class: 'ax' })); svg.appendChild(S('text', { x, y: H - m.b + 16, 'text-anchor': 'middle' }, fmt(t))); }
  svg.appendChild(S('text', { x: W - m.r, y: H - 4, 'text-anchor': 'end' }, 'quota media [km] · asse verticale in radice quadrata'));
  for (let b = 0; b < nb; b++) {
    const ha = h0 * Math.exp(b / nb * lg), hb = h0 * Math.exp((b + 1) / nb * lg), x = xS(ha), w = xS(hb) - x; let y0 = H - m.b, acc = 0;
    for (const t of [0, 1, 2, 4, 3]) { const v = bins[t][b]; if (!v) continue; acc += v; const y = yS(acc); const r = S('rect', { x, y, width: Math.max(w - 0.6, 0.6), height: y0 - y, fill: TYPE_COL[t] }); r.addEventListener('mousemove', ev => showTT(ev, `${fmt(ha)}–${fmt(hb)} km<br>${TYPE_LBL[t]}: <b>${fmt(v)}</b>`)); r.addEventListener('mouseleave', hideTT); svg.appendChild(r); y0 = y; }
  }
  const ann = [[420, 'ISS / Tiangong'], [550, 'Starlink'], [850, 'Fengyun-1C, SL-16'], [1200, 'OneWeb'], [1450, 'Globalstar'], [19100, 'GLONASS'], [20200, 'GPS'], [23222, 'Galileo'], [35786, 'GEO']];
  ann.forEach(([h, l], i) => { const x = xS(h); const y = m.t + 8 + (i % 3) * 13; svg.appendChild(S('line', { x1: x, x2: x, y1: y + 3, y2: H - m.b, class: 'annl' })); svg.appendChild(S('text', { x: x + 3, y, class: 'ann' }, l)); });
  legendSvg(svg, [0, 1, 2, 3, 4].map(i => ({ l: TYPE_LBL[i], c: TYPE_COL[i] })), W - 170, m.t + 50);
}
function aiPlot() {
  const cv = $('#aiPlot'); const dpr = Math.min(devicePixelRatio, 2); const W = cv.clientWidth, H = 420; cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px';
  const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr); const m = { l: 52, r: 12, t: 12, b: 32 };
  const h0 = 150, h1 = 45000, lg = Math.log(h1 / h0);
  const xS = i => m.l + i / 120 * (W - m.l - m.r), yS = h => H - m.b - Math.log(h / h0) / lg * (H - m.t - m.b);
  ctx.font = '10px IBM Plex Mono, monospace'; ctx.fillStyle = '#6f7f99'; ctx.strokeStyle = '#1f2d45';
  for (const t of [200, 500, 1000, 2000, 5000, 10000, 20000, 35786]) { const y = yS(t); ctx.beginPath(); ctx.moveTo(m.l, y); ctx.lineTo(W - m.r, y); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText(fmt(t), m.l - 6, y + 3); }
  for (let i = 0; i <= 120; i += 15) { const x = xS(i); ctx.beginPath(); ctx.moveTo(x, m.t); ctx.lineTo(x, H - m.b); ctx.stroke(); ctx.textAlign = 'center'; ctx.fillText(i + '°', x, H - m.b + 14); }
  ctx.textAlign = 'right'; ctx.fillText('inclinazione', W - m.r, H - 4);
  ctx.save(); ctx.translate(12, m.t + 4); ctx.rotate(Math.PI / 2); ctx.textAlign = 'left'; ctx.fillText('quota media [km, log]', 0, 0); ctx.restore();
  ctx.globalAlpha = 0.55;
  for (const t of [3, 2, 4, 1, 0]) { ctx.fillStyle = TYPE_COL[t]; for (let k = 0; k < DB.N; k++) { if (DB.cls[k] !== t) continue; const h = DB.alt[k], i = DB.c.i[k]; if (h < h0 || h > h1 || i > 120) continue; ctx.fillRect(xS(i) - 0.8, yS(h) - 0.8, 1.6, 1.6); } }
  ctx.globalAlpha = 1; ctx.fillStyle = '#e6edf7'; ctx.textAlign = 'left'; ctx.font = '11px IBM Plex Sans, sans-serif';
  const ann = [[53, 560, 'Starlink 53°'], [97.6, 600, 'eliosincrone'], [51.6, 380, 'ISS 51,6°'], [41.5, 330, 'Tiangong'], [87.9, 1350, 'OneWeb'], [55, 20200, 'GPS 55°'], [63.4, 25000, 'Molniya 63,4°'], [2, 35786, 'GEO'], [86.4, 700, 'Iridium']];
  for (const [i, h, l] of ann) { ctx.fillText(l, xS(i) + 4, yS(h) - 4); }
}

// ---------- popolazione ----------
function population() {
  const cnt = [0, 0, 0, 0, 0]; for (let k = 0; k < DB.N; k++) cnt[DB.cls[k]]++;
  const so = DB.meta.satcat_onorbit, soT = Object.values(so).reduce((a, b) => a + b, 0);
  hbars($('#compSvg'), TYPE_LBL.map((l, i) => ({ l, v: cnt[i], c: TYPE_COL[i] })), { lw: 130 });
  const star = countGroup('starlink', true);
  $('#compNote').innerHTML = `Il SATCAT conta <b>${fmt(soT)}</b> oggetti in orbita terrestre; ${fmt(soT - DB.N)} non hanno elementi orbitali pubblici (militari, non identificati, analisti). Starlink da sola: <b>${fmt(star)}</b> payload attivi, il <b>${fmt(star / cnt[0] * 100)}%</b> dei satelliti funzionanti nel catalogo.`;
  const lede = $('#chi .lede'); lede.innerHTML = `Su ${fmt(DB.N)} oggetti con elementi pubblici solo ${fmt(cnt[0])} (il ${fmt(cnt[0] / DB.N * 100)}%) sono satelliti funzionanti. Il resto è materiale inerte: satelliti spenti, stadi di razzo abbandonati, frammenti di esplosioni e collisioni. E un solo operatore, SpaceX, gestisce circa ${fmt(star / cnt[0] * 100)} satelliti attivi su 100.`;
  // missioni
  const md = {}; for (let k = 0; k < DB.N; k++) { if (DB.c.t[k] !== 0) continue; const d = DB.meta.dom[DB.c.md[k]]; md[d] = md[d] || [0, 0]; md[d][DB.cls[k] === 0 ? 0 : 1]++; }
  const mitems = Object.entries(md).filter(([d]) => d !== '').sort((a, b) => (b[1][0] + b[1][1]) - (a[1][0] + a[1][1])).map(([d, v]) => ({ l: DOM_LBL[d], parts: [{ v: v[0], c: DOM_COL[d], l: 'attivi' }, { v: v[1], c: '#3a4560', l: 'inattivi/N.D.' }] }));
  hbars($('#misSvg'), mitems, { lw: 170 });
  // paesi
  const cc = {}; for (let k = 0; k < DB.N; k++) { const c = DB.meta.cc[DB.c.c[k]]; cc[c] = cc[c] || [0, 0, 0, 0, 0]; cc[c][DB.cls[k]]++; }
  const top = Object.entries(cc).sort((a, b) => b[1].reduce((x, y) => x + y) - a[1].reduce((x, y) => x + y)).slice(0, 10);
  hbars($('#ctrySvg'), top.map(([c, v]) => ({ l: CTRY_LBL[c] || c, parts: v.map((x, i) => ({ v: x, c: TYPE_COL[i], l: TYPE_LBL[i] })) })), { lw: 120 });
  // anni
  const y0 = 1957, y1 = 2026, years = []; for (let y = y0; y <= y1; y++) years.push(String(y));
  const ser = [0, 1, 2, 3].map(t => ({ l: TYPE_LBL[t], c: TYPE_COL[t], v: new Array(years.length).fill(0) }));
  for (let k = 0; k < DB.N; k++) { const y = parseInt(DB.c.ld[k]); if (!y || DB.cls[k] > 3) continue; ser[DB.cls[k]].v[y - y0]++; }
  vbarsStack($('#yearSvg'), years, ser, { every: 10, legend: true });
  // schede missioni
  const MC = [
    ['TELECOMMUNICATIONS', 'Collegano utenti e reti: broadcasting TV da GEO, telefonia e dati, oggi soprattutto banda larga da LEO. Le megacostellazioni hanno moltiplicato i numeri.'],
    ['EARTH_OBSERVATION', 'Immagini ottiche, multispettrali e radar (SAR) del suolo, per ambiente, agricoltura, difesa, emergenze. Prevalentemente in orbite eliosincrone 500–800 km.'],
    ['PNT', 'Posizionamento, navigazione e tempo: segnali da orologi atomici in MEO (e GEO/IGSO per BeiDou e i sistemi regionali). Base di reti elettriche, finanza, telecomunicazioni.'],
    ['METEOROLOGY', 'Satelliti meteo: geostazionari per l\'immagine continua di un emisfero, polari per sondaggi atmosferici globali.'],
    ['SIGNALS_INTELLIGENCE', 'Raccolta di emissioni radio e radar (ELINT/COMINT) per sicurezza e difesa; spesso in formazioni di 2–3 satelliti per la geolocalizzazione.'],
    ['EARLY_WARNING', 'Sensori infrarossi che rilevano il lancio di missili: in GEO e in orbite Molniya per vedere le alte latitudini.'],
  ];
  $('#misCards').innerHTML = MC.map(([d, t]) => `<div><div class="lbl" style="color:${DOM_COL[d]}">${DOM_LBL[d]}</div><p class="note" style="margin-top:4px">${t} <span class="mono">(${fmt((md[d] || [0])[0])} attivi)</span></p></div>`).join('');
}
function countGroup(g, activeOnly) { const gi = DB.meta.groups.indexOf(g); let n = 0; for (let k = 0; k < DB.N; k++) if (DB.c.g[k] === gi && (!activeOnly || DB.cls[k] === 0)) n++; return n; }

// ---------- stazioni ----------
const STN = { iss: -1, css: -1 };
function stations() {
  STN.iss = DB.c.id.indexOf(25544); STN.css = DB.c.id.indexOf(48274);
  const gi = DB.meta.groups.indexOf('station');
  const vis = { iss: [], css: [] }; let mIss = 0, mCss = 0;
  for (let k = 0; k < DB.N; k++) if (DB.c.g[k] === gi) { const isIss = Math.abs(DB.c.i[k] - 51.6) < 0.3; (isIss ? vis.iss : vis.css).push(DB.c.nm[k]); }
  const card = (key, k, name, facts, list) => `<div class="card"><div class="lbl">${name[1]}</div><h3 style="font-size:1.3rem">${name[0]}</h3>
    <div class="grid g3" id="live_${key}"></div>
    <ul style="color:var(--ink2);font-size:.9rem;padding-left:1.1rem">${facts.map(f => `<li>${f}</li>`).join('')}</ul>
    <div class="note"><b>Oggetti catalogati nel complesso (snapshot):</b> ${list.join(', ')}</div>
    <button class="btn" style="margin-top:8px" onclick="__focus('station', ${k})">Mostra sul globo</button></div>`;
  $('#stationCards').innerHTML =
    card('iss', STN.iss, ['Stazione Spaziale Internazionale', 'ISS · NASA, Roscosmos, ESA, JAXA, CSA'], [
      'Primo modulo (Zarya) lanciato nel 1998; abitata ininterrottamente dal 2 novembre 2000.',
      'Massa ≈ 420 t, lunghezza ≈ 109 m (traliccio), volume pressurizzato ≈ 900 m³; equipaggio tipico 7 persone.',
      'Inclinazione 51,6°: raggiungibile da Baikonur e dalla Florida; sorvola il 90% della popolazione mondiale.',
      'Fine operazioni prevista nel 2030, con rientro controllato nel Pacifico tramite lo US Deorbit Vehicle di SpaceX.'], vis.iss) +
    card('css', STN.css, ['Tiangong («Palazzo celeste»)', 'CSS · Agenzia cinese per il volo umano (CMSA)'], [
      'Modulo centrale Tianhe lanciato nel 2021; configurazione a T completata nel 2022 con i laboratori Wentian e Mengtian.',
      'Massa dei tre moduli ≈ 70 t (≈ 100 t con Shenzhou e Tianzhou attraccati); equipaggio 3 persone, 6 durante i cambi.',
      'Inclinazione 41,5°, dettata dal sito di lancio di Jiuquan; quota ≈ 380–400 km.',
      'Programma nazionale: l\'esclusione della Cina dalla ISS (legge USA del 2011) ha reso necessaria una stazione propria.'], vis.css);
  $('#stTimeline').innerHTML = [
    ['1971', 'Salyut 1 (URSS), prima stazione spaziale.'], ['1973', 'Skylab (USA), rientrata nel 1979.'], ['1986–2001', 'Mir (URSS/Russia), la prima stazione modulare; deorbitata nel 2001.'],
    ['1998', 'Inizio dell\'assemblaggio della ISS.'], ['2011–2019', 'Tiangong-1 e Tiangong-2, laboratori cinesi sperimentali.'], ['2021–2022', 'Assemblaggio di Tiangong.'],
    ['2027 (pianif.)', 'Haven-1 di Vast, prima stazione commerciale privata: lancio rinviato al primo trimestre 2027.', 1], ['2030 (pianif.)', 'Fine della ISS; transizione verso stazioni commerciali (Axiom, Vast, Starlab, Orbital Reef) sostenute da NASA come clienti.', 1]
  ].map(([y, t, f]) => `<div class="${f ? 'fut' : ''}"><b>${y}</b>${t}</div>`).join('');
  const nd = DB.c.nd[STN.iss], n = DB.c.n[STN.iss];
  // da/dt = -2/3 a/n dn/dt; dn/dt = 2*ndot [giri/g^2]
  const dadt = -2 / 3 * DB.a[STN.iss] / n * (2 * nd) * 1000; // m/giorno
  $('#issNdot').textContent = nd.toExponential(2); $('#issDecay').textContent = fmt(Math.abs(dadt)) + ' m';
}
function stationLive() {
  for (const [key, k] of [['iss', STN.iss], ['css', STN.css]]) {
    const box = document.getElementById('live_' + key); if (!box || k < 0) continue;
    propagate(k, G.t, tmp7); const r = Math.hypot(tmp7[0], tmp7[1], tmp7[2]), v = Math.hypot(tmp7[3], tmp7[4], tmp7[5]);
    box.innerHTML = `<div><div class="lbl">Quota</div><div class="stat" style="font-size:1.15rem">${fmt(r - RE)} <small>km</small></div></div>
      <div><div class="lbl">Velocità</div><div class="stat" style="font-size:1.15rem">${fmt(v * 3600)} <small>km/h</small></div></div>
      <div><div class="lbl">Un giro</div><div class="stat" style="font-size:1.15rem">${fmt(DB.T[k], 1)} <small>min</small></div></div>`;
  }
}

// ---------- rocket body ----------
function rocketBodies() {
  const fam = {}; let nRB = 0, mRB = 0, mAll = 0, nLEO = 0, mLEO = 0, mLEOall = 0;
  const mass = {}; for (const r of REG_ORDER) mass[r] = [0, 0, 0, 0, 0];
  for (let k = 0; k < DB.N; k++) {
    const m = DB.c.ms[k]; mAll += m; mass[DB.reg[k]][DB.cls[k]] += m / 1000; if (DB.reg[k] === 'LEO') mLEOall += m;
    if (DB.cls[k] !== 2) continue; nRB++; mRB += m; if (DB.reg[k] === 'LEO') { nLEO++; mLEO += m; }
    let f = DB.c.nm[k].replace(/\s*(R\/B|\(|DEB).*$/, '').replace(/\s+\d+$/, '').trim();
    const o = fam[f] = fam[f] || { n: 0, m: 0, alt: [], reg: {} }; o.n++; o.m += m; o.alt.push(DB.alt[k]); o.reg[DB.reg[k]] = (o.reg[DB.reg[k]] || 0) + 1;
  }
  $('#rbStats').innerHTML = [
    ['Rocket body catalogati', fmt(nRB), `${fmt(nRB / DB.N * 100, 1)}% degli oggetti`],
    ['Massa totale', fmt(mRB / 1000), `t · ${fmt(mRB / mAll * 100)}% della massa catalogata`],
    ['In LEO', fmt(nLEO), `${fmt(mLEO / 1000)} t · ${fmt(mLEO / mLEOall * 100)}% della massa LEO`],
    ['Massa totale in orbita', fmt(mAll / 1000), 't dal catalogo pubblico · ESA stima oltre 17 400 t'],
  ].map(s => `<div class="card"><div class="lbl">${s[0]}</div><div class="stat">${s[1]}</div><div class="note">${s[2]}</div></div>`).join('');
  const NAMES = { 'SL-12': 'Proton, stadio Blok DM', 'SL-8': 'Kosmos-3M', 'SL-16': 'Zenit, 2° stadio', 'SL-14': 'Tsyklon-3', 'SL-6': 'Molniya, stadio Blok L/ML', 'SL-3': 'Vostok', 'ARIANE': 'Ariane (stadi superiori)', 'FALCON': 'Falcon 9, 2° stadio', 'BREEZE-M': 'Proton/Angara, Briz-M', 'DELTA': 'Delta', 'BLOCK DM-SL': 'Zenit-3SL, Blok DM', 'ATLAS 5 CENTAUR': 'Atlas V Centaur', 'FREGAT': 'Soyuz, Fregat', 'TITAN 3C TRANSTAGE': 'Titan IIIC Transtage', 'H-2A': 'H-IIA, 2° stadio' };
  const rows = Object.entries(fam).sort((a, b) => b[1].m - a[1].m).slice(0, 12);
  $('#rbTable').innerHTML = `<tr><th>Famiglia</th><th class="n">N.</th><th class="n">Massa [t]</th><th class="n">Quota mediana</th><th>Regime</th></tr>` + rows.map(([f, o]) => {
    const a = o.alt.sort((x, y) => x - y)[o.alt.length >> 1]; const rg = Object.entries(o.reg).sort((x, y) => y[1] - x[1])[0][0];
    return `<tr><td>${f}<div class="note">${NAMES[f] || ''}</div></td><td class="n">${o.n}</td><td class="n">${fmt(o.m / 1000)}</td><td class="n">${fmt(a)} km</td><td>${REG_LBL[rg]}</td></tr>`;
  }).join('');
  hbars($('#massSvg'), ['LEO', 'MEO', 'GEO', 'HEO', 'SUP'].map(r => ({ l: REG_LBL[r], parts: mass[r].map((v, i) => ({ v, c: TYPE_COL[i], l: TYPE_LBL[i] })) })), { lw: 80, unit: ' t' });
  $('#sl16frag').textContent = fmt(Math.round(0.1 * Math.pow(18000, 0.75) * Math.pow(0.1, -1.71) / 100) * 100);
}

// ---------- nubi ----------
const CLOUDS = [
  ['c_fengyun', 'Fengyun-1C', '11 gen 2007 · test ASAT cinese', 865, 'Il satellite meteo fu colpito da un missile a ascesa diretta SC-19. Il singolo evento più grave della storia: oltre 3 500 frammenti catalogati, molti destinati a restare in orbita per decenni.'],
  ['c_cosmos2251', 'Cosmos 2251', '10 feb 2009 · collisione accidentale', 789, 'Prima collisione accidentale tra due satelliti integri: Cosmos 2251 (spento, 950 kg) contro Iridium 33 (attivo, 560 kg), a ≈ 11,7 km/s di velocità relativa.'],
  ['c_iridium33', 'Iridium 33', '10 feb 2009 · collisione accidentale', 789, 'L\'altro protagonista della collisione del 2009: un satellite attivo e manovrabile, che non ricevette alcun avviso di congiunzione utile. Da allora lo screening delle congiunzioni è diventato prassi.'],
  ['c_cz6a', 'CZ-6A', '6 ago 2024 · esplosione stadio', 800, 'Lo stadio superiore del Lunga Marcia 6A si è frammentato dopo aver rilasciato i primi 18 satelliti Qianfan, lasciando una nube a ≈ 800 km, quota dove il decadimento è lento.'],
  ['c_noaa16', 'NOAA 16', '25 nov 2015 · frammentazione', 850, 'Satellite meteo dismesso nel 2014, frammentato un anno dopo (probabile batteria). Esempio di rischio da satelliti non passivati.'],
  ['c_dmsp13', 'DMSP F13', '3 feb 2015 · esplosione batteria', 850, 'Satellite meteo militare statunitense: un guasto all\'alimentazione ne ha causato l\'esplosione dopo 20 anni di servizio.'],
];
let cloudSel = 'c_fengyun';
function clouds() {
  const gi = g => DB.meta.groups.indexOf(g);
  $('#cloudCards').innerHTML = CLOUDS.map(([g, n, d, h, t]) => { const nn = countGroup(g); return `<div class="card cloudCard"><div class="lbl">${d}</div><h3>${n}</h3><div class="stat">${fmt(nn)} <small>frammenti ancora catalogati</small></div><p class="note">${t}</p><button class="btn" data-g="${g}">Diagrammi</button> <button class="btn" onclick="__focus('${g}')">Sul globo</button></div>`; }).join('') +
    `<div class="card cloudCard"><div class="lbl">15 nov 2021 · test ASAT russo</div><h3>Cosmos 1408</h3><div class="stat">${fmt(DB.c.nm.filter(x => x.startsWith('COSMOS 1408 DEB')).length)} <small>frammenti ancora catalogati</small></div><p class="note">Distrutto a ≈ 480 km da un missile Nudol: oltre 1 500 frammenti tracciabili, che costrinsero l'equipaggio ISS a rifugiarsi nelle capsule. A quella quota l'atmosfera li ha rimossi quasi tutti in tre anni: la quota dell'evento conta più della sua violenza.</p></div>`;
  $('#cloudCards').addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (!b) return; cloudSel = b.dataset.g; gabbard(); });
  gabbard();
}
function gabbard() {
  const gi = DB.meta.groups.indexOf(cloudSel), name = CLOUDS.find(c => c[0] === cloudSel)[1];
  $('#gabTitle').textContent = name; $('#raanTitle').textContent = name;
  const idx = []; for (let k = 0; k < DB.N; k++) if (DB.c.g[k] === gi) idx.push(k);
  // Gabbard
  plot($('#gabPlot'), idx, k => DB.T[k], [k => DB.apo[k], k => DB.per[k]], 'periodo [min]', 'quota [km]', ['#ffd166', '#ff5d7a']);
  plot($('#raanPlot'), idx, k => DB.c.O[k], [k => DB.c.i[k]], 'Ω [°]', 'inclinazione [°]', ['#5ad1ff'], [0, 360]);
}
function plot(cv, idx, fx, fys, xl, yl, cols, xr) {
  const dpr = Math.min(devicePixelRatio, 2), W = cv.clientWidth, H = 340; cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px';
  const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr); const m = { l: 52, r: 12, t: 12, b: 32 };
  const xs = idx.map(fx), ys = idx.flatMap(k => fys.map(f => f(k)));
  const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(p * (s.length - 1))]; };
  let x0 = xr ? xr[0] : q(xs, 0.005), x1 = xr ? xr[1] : q(xs, 0.995), y0 = q(ys, 0.005), y1 = q(ys, 0.995);
  const px = (x1 - x0) * 0.04 || 1, py = (y1 - y0) * 0.06 || 1; if (!xr) { x0 -= px; x1 += px; } y0 -= py; y1 += py;
  const xS = x => m.l + (x - x0) / (x1 - x0) * (W - m.l - m.r), yS = y => H - m.b - (y - y0) / (y1 - y0) * (H - m.t - m.b);
  ctx.font = '10px IBM Plex Mono, monospace'; ctx.fillStyle = '#6f7f99'; ctx.strokeStyle = '#1f2d45';
  for (let g = 0; g <= 5; g++) { const y = y0 + (y1 - y0) * g / 5, x = x0 + (x1 - x0) * g / 5; ctx.beginPath(); ctx.moveTo(m.l, yS(y)); ctx.lineTo(W - m.r, yS(y)); ctx.stroke(); ctx.beginPath(); ctx.moveTo(xS(x), m.t); ctx.lineTo(xS(x), H - m.b); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText(fmt(y, y1 - y0 < 20 ? 1 : 0), m.l - 6, yS(y) + 3); ctx.textAlign = 'center'; ctx.fillText(fmt(x, x1 - x0 < 20 ? 1 : 0), xS(x), H - m.b + 14); }
  ctx.textAlign = 'right'; ctx.fillText(xl, W - m.r, H - 4); ctx.textAlign = 'left'; ctx.fillText(yl, m.l + 4, m.t + 10);
  fys.forEach((f, j) => { ctx.fillStyle = cols[j]; ctx.globalAlpha = 0.8; for (const k of idx) { const x = xS(fx(k)), y = yS(f(k)); ctx.beginPath(); ctx.arc(x, y, 1.8, 0, TWO_PI); ctx.fill(); } });
  ctx.globalAlpha = 1;
}

// ---------- Kessler ----------
let KINIT; const KP = {};
const KCTL = [
  ['years', 'Orizzonte', 50, 300, 10, 200, v => v + ' anni', 'Gli effetti più interessanti emergono dopo 50–100 anni.'],
  ['launch', 'Lanci (rispetto a oggi)', 0, 3, 0.1, 1, v => v === 0 ? 'nessun lancio' : '× ' + fmt(v, 1), 'Moltiplica la dimensione delle flotte attive mantenute in orbita.'],
  ['megaN', 'Megacostellazione aggiuntiva', 0, 60000, 1000, 0, v => v ? fmt(v) + ' satelliti' : 'nessuna', ''],
  ['megaH', 'Quota della costellazione', 300, 1500, 50, 550, v => fmt(v) + ' km', 'Sotto 600 km il freno atmosferico perdona; sopra 800 km no.'],
  ['life', 'Vita operativa media', 3, 15, 1, 7, v => v + ' anni', ''],
  ['pmd', 'Smaltimento a fine vita (PMD)', 0, 1, 0.01, 0.9, v => fmt(v * 100) + '%', 'Quota di satelliti rimossi a fine missione. Obiettivo IADC ≥ 90%.'],
  ['avoid', 'Efficacia delle manovre anticollisione', 0, 0.999, 0.001, 0.99, v => fmt(v * 100, 1) + '%', 'Solo i satelliti attivi possono evitare gli impatti.'],
  ['expl', 'Frammenti da esplosioni', 0, 1000, 50, 100, v => fmt(v) + ' /anno', 'Batterie e propellente residuo in oggetti non passivati.'],
  ['adr', 'Rimozione attiva (ADR)', 0, 30, 1, 0, v => v ? v + ' oggetti/anno' : 'nessuna', 'Rimozione dei derelitti più massicci nei gusci più critici.'],
  ['abandon', 'Soglia di abbandono del guscio', 0.005, 0.1, 0.005, 0.02, v => fmt(v * 100, 1) + '%/anno', 'Probabilità annua di impatto oltre cui gli operatori rinunciano alla quota.'],
];
const KPRE = [
  ['Oggi, invariato', {}],
  ['Stop ai lanci (Liou 2006)', { launch: 0, expl: 0 }],
  ['Stop ai lanci + ADR 5/anno', { launch: 0, expl: 0, adr: 5 }],
  ['PMD scarso (50%)', { pmd: 0.5 }],
  ['Megacostellazione a 550 km', { megaN: 40000, megaH: 550 }],
  ['Megacostellazione a 1 100 km', { megaN: 10000, megaH: 1100, pmd: 0.7 }],
  ['Megacostellazione 1 100 km, PMD 99% + ADR', { megaN: 10000, megaH: 1100, pmd: 0.99, adr: 10 }],
];
function kesslerInit() {
  const alt = [], cls = [], mass = [];
  for (let k = 0; k < DB.N; k++) { if (DB.apo[k] >= 2000) continue; alt.push(DB.alt[k]); const c = DB.cls[k]; cls.push(c === 0 ? 0 : (c === 1 || c === 2) ? 1 : 2); mass.push(DB.c.ms[k]); }
  KINIT = KS.initFrom(alt, cls, mass);
  const box = $('#kCtl');
  box.innerHTML = KCTL.map(([k, l, mn, mx, st, def, f, h]) => `<div class="ctl"><label>${l} <span id="kv_${k}"></span></label><input type="range" id="k_${k}" min="${mn}" max="${mx}" step="${st}" value="${def}">${h ? `<div class="hint">${h}</div>` : ''}</div>`).join('') +
    `<div class="ctl"><label>Test antisatellite</label><div class="seg"><button class="btn" id="kAsat">+ ASAT a <span id="kAsatH">850</span> km all'anno 5</button><button class="btn" id="kAsatClr">rimuovi</button></div><input type="range" id="kAsatSl" min="300" max="1500" step="50" value="850"><div class="hint">Aggiunge ≈ 3 000 frammenti (ordine di grandezza di Fengyun-1C).</div></div>`;
  KCTL.forEach(([k, , , , , def]) => KP[k] = def); KP.asat = [];
  box.addEventListener('input', e => { const id = e.target.id; if (id === 'kAsatSl') { $('#kAsatH').textContent = e.target.value; return; } if (!id.startsWith('k_')) return; KP[id.slice(2)] = +e.target.value; kRun(); });
  $('#kAsat').onclick = () => { KP.asat.push({ y: 5, h: +$('#kAsatSl').value, n: 3000 }); kRun(); };
  $('#kAsatClr').onclick = () => { KP.asat = []; kRun(); };
  $('#kPresets').innerHTML = KPRE.map(([l], i) => `<button data-i="${i}" class="${i ? '' : 'on'}">${l}</button>`).join('');
  $('#kPresets').onclick = e => { const b = e.target.closest('button'); if (!b) return; const p = KPRE[+b.dataset.i][1]; KCTL.forEach(([k, , , , , def]) => { KP[k] = p[k] ?? def; $('#k_' + k).value = KP[k]; }); KP.asat = []; $('#kPresets').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); kRun(); };
  $('#kScale').onclick = e => { const b = e.target.closest('button'); if (!b) return; KP.log = b.dataset.s === 'log'; $('#kScale').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); kRun(); };
  // mini grafico vita orbitale
  const sv = S('svg', { viewBox: '0 0 300 120', class: 'chart' }); const pts = []; for (let h = 250; h <= 1200; h += 10) pts.push([h, KS.life(h)]);
  const xS = h => 34 + (h - 250) / 950 * 256, yS = l => 100 - (Math.log10(Math.max(l, 0.1)) + 1) / 4 * 82;
  for (const l of [0.1, 1, 10, 100, 1000]) { sv.appendChild(S('line', { x1: 34, x2: 290, y1: yS(l), y2: yS(l), class: 'gl' })); sv.appendChild(S('text', { x: 30, y: yS(l) + 3, 'text-anchor': 'end' }, l >= 1 ? fmt(l) : fmt(l, 1))); }
  for (const h of [300, 500, 700, 900, 1100]) sv.appendChild(S('text', { x: xS(h), y: 115, 'text-anchor': 'middle' }, h));
  sv.appendChild(S('path', { d: 'M' + pts.map(([h, l]) => `${xS(h)},${yS(l)}`).join('L'), fill: 'none', stroke: '#ffd166', 'stroke-width': 2 }));
  sv.appendChild(S('text', { x: 40, y: 12, class: 'ann' }, 'vita orbitale [anni] vs quota [km]'));
  $('#lifeMini').appendChild(sv);
  kRun();
}
function kRun() {
  KCTL.forEach(([k, , , , , , f]) => $('#kv_' + k).textContent = f(KP[k]));
  const p = { years: KP.years, dt: 0.25, launch: KP.launch, life: KP.life, pmd: KP.pmd, avoid: KP.avoid, expl: KP.expl, adr: KP.adr, mF: 1, sigII: 10, sigIF: 6, fragLife: 0.5, abandon: KP.abandon, mega: { n: KP.megaN, h: KP.megaH }, asat: KP.asat };
  const o = KS.run(KINIT, p);
  const L = o.t.length - 1, f0 = o.F[0], fe = o.F[L], tot0 = o.A[0] + o.D[0] + o.F[0], tote = o.A[L] + o.D[L] + o.F[L];
  const big = v => v > 1e6 ? '> 1 milione' : fmt(v);
  $('#kStats').innerHTML = [
    ['Frammenti ≥ 10 cm', big(fe), `${fe >= f0 ? '+' : ''}${fmt((fe / f0 - 1) * 100)}% rispetto a oggi`, fe > f0 * 1.05 ? 'var(--bad)' : fe < f0 * 0.95 ? 'var(--ok)' : 'var(--ink)'],
    ['Collisioni catastrofiche', fmt(o.cumColl[L], o.cumColl[L] < 10 ? 1 : 0), `in ${KP.years} anni · ${fmt(o.cumColl[L] / KP.years, 2)}/anno`, 'var(--ink)'],
    ['Intatti derelitti', fmt(o.D[L]), `oggi ${fmt(o.D[0])}`, 'var(--c-rb)'],
    ['Gusci abbandonati', fmt(o.events.length), o.events.length ? `primo a ${fmt(o.events[0].h)} km dopo ${fmt(o.events[0].t)} anni` : 'nessuno', o.events.length ? 'var(--bad)' : 'var(--ok)'],
  ].map(s => `<div class="card tight"><div class="lbl">${s[0]}</div><div class="stat" style="font-size:1.3rem;color:${s[3]}">${s[1]}</div><div class="note">${s[2]}</div></div>`).join('');
  kLine(o); kHeat(o);
  let msg = '';
  if (o.events.length) msg = `<div class="alert"><b>Cascata innescata.</b> In ${o.events.length} gusci il rischio di impatto supera la soglia: gli operatori li abbandonano, ma i detriti già presenti continuano a collidere tra loro e con gli oggetti derelitti. ${fe > 1e6 ? 'Oltre il milione di frammenti il modello non è più quantitativo: significa solo che la quota è persa per generazioni.' : ''}</div>`;
  else if (fe > f0 * 1.3) msg = `<div class="alert">La popolazione di frammenti cresce del ${fmt((fe / f0 - 1) * 100)}%: le collisioni battono la rimozione atmosferica nelle bande alte della LEO. Prova ad aumentare PMD o ADR.</div>`;
  else if (fe < f0 * 0.9) msg = `<div class="alert info2">La popolazione di frammenti scende: l'atmosfera rimuove più detriti di quanti ne producano le collisioni. Nota che le bande sopra 800 km si svuotano molto più lentamente (vedi la mappa).</div>`;
  else msg = `<div class="alert info2">Situazione quasi stazionaria in totale, ma guarda la mappa: la crescita può concentrarsi in alcune bande mentre altre si ripuliscono.</div>`;
  $('#kMsg').innerHTML = msg;
}
function kLine(o) {
  const svg = $('#kLine'); svg.innerHTML = ''; const W = 760, H = 270, m = { l: 56, r: 14, t: 12, b: 28 };
  const ser = [['F', 'Frammenti', '#ff5d7a'], ['D', 'Derelitti', '#f4a261'], ['A', 'Attivi', '#4cc9f0']];
  const all = ser.flatMap(([k]) => o[k]); const mx = KP.log ? Math.max(...all) * 1.5 : niceMax(Math.max(...all) * 1.02), mn = Math.max(1, Math.min(...all.filter(v => v > 0)) * 0.7);
  const xS = t => m.l + t / KP.years * (W - m.l - m.r);
  const yS = KP.log ? v => H - m.b - (Math.log10(Math.max(v, mn)) - Math.log10(mn)) / (Math.log10(mx) - Math.log10(mn)) * (H - m.t - m.b) : v => H - m.b - v / mx * (H - m.t - m.b);
  const ticks = KP.log ? [1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8].filter(v => v >= mn && v <= mx) : [0, 1, 2, 3, 4].map(g => mx * g / 4);
  for (const v of ticks) { const y = yS(v); svg.appendChild(S('line', { x1: m.l, x2: W - m.r, y1: y, y2: y, class: 'gl' })); svg.appendChild(S('text', { x: m.l - 6, y: y + 3, 'text-anchor': 'end' }, v >= 1e6 ? fmt(v / 1e6, 1) + ' M' : fmt(v))); }
  for (let t = 0; t <= KP.years; t += KP.years > 150 ? 50 : 25) svg.appendChild(S('text', { x: xS(t), y: H - m.b + 15, 'text-anchor': 'middle' }, t === 0 ? 'oggi' : '+' + t));
  for (const [k, l, c] of ser) svg.appendChild(S('path', { d: 'M' + o.t.map((t, i) => `${xS(t).toFixed(1)},${yS(o[k][i]).toFixed(1)}`).join('L'), fill: 'none', stroke: c, 'stroke-width': 2 }));
  for (const ev of o.events) svg.appendChild(S('line', { x1: xS(ev.t), x2: xS(ev.t), y1: m.t, y2: H - m.b, stroke: '#ff8a5b', 'stroke-dasharray': '3 3', 'stroke-opacity': .6 }));
  legendSvg(svg, ser.map(([, l, c]) => ({ l, c })), m.l + 10, m.t + 4);
  const hov = S('rect', { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, fill: 'transparent' });
  hov.addEventListener('mousemove', ev => { const r = svg.getBoundingClientRect(); const t = Math.round((ev.clientX - r.left) / r.width * W - m.l) / (W - m.l - m.r) * KP.years; const i = Math.max(0, Math.min(o.t.length - 1, Math.round(t))); showTT(ev, `anno +${i}<br>frammenti ${fmt(o.F[i])}<br>derelitti ${fmt(o.D[i])}<br>attivi ${fmt(o.A[i])}<br>collisioni cumulate ${fmt(o.cumColl[i], 1)}`); });
  hov.addEventListener('mouseleave', hideTT); svg.appendChild(hov);
}
function kHeat(o) {
  const cv = $('#kHeat'), dpr = Math.min(devicePixelRatio, 2), W = cv.clientWidth, H = 260; cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px';
  const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr); const m = { l: 56, r: 64, t: 8, b: 26 };
  const NS = KS.NS, nt = o.t.length; const RE_ = 6378.137;
  const vol = KS.hc.map(h => 4 * Math.PI * (RE_ + h) ** 2 * KS.DH);
  const lo = -10, hi = -6; // log10 densita'
  const cw = (W - m.l - m.r) / nt, ch = (H - m.t - m.b) / NS;
  for (let i = 0; i < nt; i++) for (let s = 0; s < NS; s++) {
    const d = o.shellsF[i][s] / vol[s]; const v = Math.max(0, Math.min(1, (Math.log10(Math.max(d, 1e-12)) - lo) / (hi - lo)));
    ctx.fillStyle = heatCol(v); ctx.fillRect(m.l + i * cw, H - m.b - (s + 1) * ch, cw + 0.6, ch + 0.6);
  }
  ctx.font = '10px IBM Plex Mono, monospace'; ctx.fillStyle = '#6f7f99'; ctx.textAlign = 'right';
  for (const h of [200, 500, 800, 1100, 1400, 1700, 2000]) { const y = H - m.b - (h - KS.H0) / KS.DH * ch; ctx.fillText(h + ' km', m.l - 6, y + 3); }
  ctx.textAlign = 'center'; for (let t = 0; t <= KP.years; t += KP.years > 150 ? 50 : 25) ctx.fillText(t === 0 ? 'oggi' : '+' + t, m.l + t / KP.years * (W - m.l - m.r), H - m.b + 15);
  for (let j = 0; j < 100; j++) { ctx.fillStyle = heatCol(j / 99); ctx.fillRect(W - m.r + 16, H - m.b - (j + 1) * (H - m.t - m.b) / 100, 12, (H - m.t - m.b) / 100 + 0.5); }
  ctx.fillStyle = '#6f7f99'; ctx.textAlign = 'left'; ctx.fillText('10⁻⁶', W - m.r + 31, m.t + 8); ctx.fillText('10⁻¹⁰', W - m.r + 31, H - m.b);
}
function heatCol(v) { // scala percettiva scura → gialla
  const st = [[6, 10, 18], [24, 40, 90], [88, 52, 140], [190, 60, 110], [250, 130, 70], [255, 230, 120]];
  const x = v * (st.length - 1), i = Math.min(Math.floor(x), st.length - 2), f = x - i; const c = st[i].map((a, j) => Math.round(a + (st[i + 1][j] - a) * f)); return `rgb(${c})`;
}

// ---------- nav attiva ----------
function navSpy() { const links = [...document.querySelectorAll('#toc a')]; const obs = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) links.forEach(l => l.classList.toggle('on', l.getAttribute('href') === '#' + e.target.id)); }); }, { rootMargin: '-40% 0px -55% 0px' }); document.querySelectorAll('section,footer').forEach(s => obs.observe(s)); }

// ---------- avvio ----------
(async () => {
  try {
    const raw = await loadData(); prepare(raw);
    $('#nTot').textContent = fmt(DB.N); $('#snapDate').textContent = DB.meta.ref.slice(0, 10);
    $('#srcGp').textContent = DB.meta.gp_created.slice(0, 10); $('#srcN').textContent = fmt(DB.N);
    const so = DB.meta.satcat_onorbit, soT = Object.values(so).reduce((a, b) => a + b, 0); $('#srcGap').textContent = `${fmt(soT - DB.N)} oggetti su ${fmt(soT)} in orbita secondo SATCAT`;
    const cnt = [0, 0, 0, 0, 0]; for (let k = 0; k < DB.N; k++) cnt[DB.cls[k]]++;
    $('#topStats').innerHTML = [['Satelliti attivi', cnt[0], 'payload operativi'], ['Satelliti inattivi', cnt[1], 'spenti o stato ignoto'], ['Rocket body', cnt[2], 'stadi di lanciatore'], ['Detriti', cnt[3] + cnt[4], 'frammenti e oggetti non identificati']]
      .map(s => `<div class="card tight"><div class="lbl">${s[0]}</div><div class="stat">${fmt(s[1])}</div><div class="note">${s[2]}</div></div>`).join('');
    stations();
    initGlobe(); globeUI(); $('#loading').remove(); requestAnimationFrame(loop);
    calcUI(); regimeCards(); altHist(); aiPlot(); population(); rocketBodies(); clouds(); kesslerInit(); navSpy();
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { aiPlot(); gabbard(); kRun(); }, 200); });
  } catch (err) { console.error(err); $('#loading').textContent = 'Errore nel caricamento: ' + err.message; }
})();
