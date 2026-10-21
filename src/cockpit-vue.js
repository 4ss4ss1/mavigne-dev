// ═════════════════════════════════════════════════════════════════════════════════════════════════
// ★★★ REF-1 (§266) — LE COCKPIT D'AUJOURD'HUI : LA MAQUETTE VALIDÉE, TELLE QUELLE
// Nico (07/10) : « la maquette était parfaite, tu t'en es complètement éloigné ». Ce module EST la maquette
// (dessins, mises à jour animées, navigation, graphes, montage), sans ses données de démonstration : elle lit
// un modèle V que pilotage.js construit avec les moteurs du Pilotage (_pilCk2Modele). Retirés : la simulation
// de démonstration, la feuille de validation (toucher une parcelle ouvre SA fiche, chemin de validation de
// toujours), la palette Ctrl K et la barre latérale (lots suivants, pour toute l'appli).
// La feuille de style de la maquette est passée à la charte (convertisseur REF-1) : section REF-1 de styles.css.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
window._ck2Squelette = function () { return '<div class="ck2"><div class="ck-page ck-entree" id="ck-page"> <div class="ck-tete" id="ck-tete"></div> <section class="ck-photos" id="ck-photos" aria-label="Les quatre photos du domaine"></section> <div class="ck-vue ck-gt" id="ck-vue-terrain"> <div class="ck-col" id="ck-t-a"> <section class="ck-verdict" id="ck-verdict" aria-label="Fin prévue des travaux"></section> <section class="ck-decision ck-panneau" id="ck-decision" aria-label="La décision du jour"></section> <aside class="ck-fil ck-panneau" id="ck-fil" aria-label="Fil en direct"></aside> </div> <div class="ck-col" id="ck-t-b"> <section class="ck-plan ck-panneau" id="ck-plan" aria-label="Le domaine en direct"></section> <section class="ck-chant ck-panneau" id="ck-chant" aria-label="Chantiers d’hiver"></section> <section class="ck-courbe ck-panneau" id="ck-courbe" aria-label="Charge restante"></section> </div> <div class="ck-col ck-col-c" id="ck-t-c"> <section class="ck-savoir ck-panneau" id="ck-savoir" aria-label="À savoir"></section> </div> </div> <div class="ck-vue ck-ge" id="ck-vue-eco" hidden> <div class="ck-col" id="ck-e-a"> <section class="ck-ever ck-verdict" id="ck-ever" aria-label="Atterrissage de la campagne"></section> <section class="ck-ekpi" id="ck-ekpi" aria-label="Indicateurs économiques"></section> </div> <div class="ck-col" id="ck-e-b"> <section class="ck-echart ck-panneau" id="ck-echart" aria-label="Dépensé face au fait"></section> <section class="ck-etac ck-panneau" id="ck-etac" aria-label="Écart au barème par tâche"></section> </div> <div class="ck-col ck-col-c" id="ck-e-c"> <section class="ck-epos ck-panneau" id="ck-epos" aria-label="Par poste"></section> <section class="ck-eapp ck-panneau" id="ck-eapp" aria-label="Par appellation"></section> </div> </div> </div> </div><div class="ck-sr" id="ck-annonce" aria-live="polite"></div>'; };
/* Ma Vigne — maquette « Pilotage › Aujourd’hui », le cockpit vivant.
   Données de démonstration. L’architecture est celle de l’appli : des fonctions
   de dessin qui rendent du HTML, une petite couche d’animation commune (Anim),
   et des mises à jour CIBLÉES quand une validation arrive — dans l’appli, ce
   sera l’écoute en temps réel de « parcelles » et « journal » (FB_REALTIME). */
(() => {
'use strict';

/* ═══ 1. OUTILS ═══ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const MQ_REDUIT = matchMedia('(prefers-reduced-motion: reduce)');
let SANS_MVT = false;   // REF-1 : l'entrée orchestrée ne se joue qu'une fois par session
const reduit = () => MQ_REDUIT.matches || SANS_MVT;
const NF0 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const NF2 = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nb = v => NF0.format(Math.round(v));
const haTxt = v => NF2.format(v) + '\u202fha';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const lerp = (a, b, k) => a + (b - a) * k;
const sortie = k => 1 - Math.pow(1 - k, 3);
const attendre = ms => new Promise(r => setTimeout(r, ms));
const maj1 = s => s.charAt(0).toUpperCase() + s.slice(1);

/* La couche d’animation commune. Tout ce qui bouge passe par ici : c’est elle
   qui coupe le mouvement quand le téléphone demande moins d’animations. */
const Anim = {
  tween(dur, fn, ease = sortie) {
    if (reduit() || dur <= 0) { fn(1); return Promise.resolve(); }
    return new Promise(res => {
      const t0 = performance.now();
      const pas = now => {
        const k = Math.min(1, (now - t0) / dur);
        fn(ease(k));
        if (k < 1) requestAnimationFrame(pas); else res();
      };
      requestAnimationFrame(pas);
    });
  },
  // Un chiffre qui défile de sa valeur affichée vers la nouvelle.
  compter(el, vers, fmt = nb, dur = 900) {
    if (!el) return;
    const de = el.dataset.v != null ? parseFloat(el.dataset.v) : vers;
    el.dataset.v = String(vers);
    cancelAnimationFrame(el._raf || 0);
    if (reduit() || Math.abs(de - vers) < 1e-6) { el.textContent = fmt(vers); return; }
    const t0 = performance.now();
    const pas = now => {
      const k = Math.min(1, (now - t0) / dur);
      el.textContent = fmt(lerp(de, vers, sortie(k)));
      if (k < 1) el._raf = requestAnimationFrame(pas);
    };
    el._raf = requestAnimationFrame(pas);
  },
  // Un texte qui change en roulant (la date de fin prévue).
  rouler(el, txt) {
    const cur = el.lastElementChild;
    if (cur && cur.textContent === txt) return;
    if (reduit() || !cur) { el.innerHTML = '<span>' + esc(txt) + '</span>'; return; }
    const n = document.createElement('span');
    n.textContent = txt;
    el.appendChild(n);
    cur.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-75%)', opacity: 0 }],
      { duration: 560, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' }).onfinish = () => cur.remove();
    n.animate([{ transform: 'translateY(75%)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }],
      { duration: 560, easing: 'cubic-bezier(.22,1,.36,1)' });
  },
  // FLIP : on note la place de chacun, on change la liste, chacun glisse vers sa nouvelle place.
  noter(els) { return new Map(els.map(e => [e, e.getBoundingClientRect().top])); },
  glisser(places) {
    if (reduit()) return;
    places.forEach((t0, el) => {
      if (!el.isConnected) return;
      const dy = t0 - el.getBoundingClientRect().top;
      if (Math.abs(dy) > .5) el.animate([{ transform: 'translateY(' + dy + 'px)' }, { transform: 'none' }],
        { duration: 460, easing: 'cubic-bezier(.22,1,.36,1)' });
    });
  },
  reflet(el) { el.classList.remove('reflet'); void el.offsetWidth; el.classList.add('reflet'); },
};

/* ═══ 2. DATES ═══ */
const J = (y, m, d) => new Date(Date.UTC(y, m - 1, d));
const iso = d => d.toISOString().slice(0, 10);
const deIso = s => new Date(s + 'T00:00:00Z');
const ajout = (d, n) => new Date(d.getTime() + n * 864e5);
const MOIS_C = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const MOIS_L = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const JOURS_C = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const jourN = d => d.getUTCDate() === 1 ? '1er' : String(d.getUTCDate());
const dCourt = d => jourN(d) + '\u00a0' + MOIS_C[d.getUTCMonth()];
const dLong = d => jourN(d) + '\u00a0' + MOIS_L[d.getUTCMonth()];
const FERIES = new Set();
const CONGES_DE = J(2026, 12, 24), CONGES_A = J(2027, 1, 3);
// AUJ-5 (§307) : les jours travaillés viennent du planning (V.ouvres, d'aujourd'hui à l'objectif) ; hors de cette plage,
//   du lundi au vendredi.
let OUV = null, OUV_DE = '', OUV_A = '';
const estOuvre = d => {
  const k = iso(d);
  if (OUV && k >= OUV_DE && k <= OUV_A) return OUV.has(k);
  const w = d.getUTCDay();
  if (w === 0 || w === 6 || FERIES.has(k)) return false;
  return true;
};
const joursOuvres = (de, a) => { const r = []; for (let d = de; d <= a; d = ajout(d, 1)) if (estOuvre(d)) r.push(d); return r; };
const heureTxt = ts => { const d = new Date(ts); return d.getHours() + '\u00a0h\u00a0' + String(d.getMinutes()).padStart(2, '0'); };
const ilYa = ts => {
  const m = Math.round((Date.now() - ts) / 60e3);
  if (m < 1) return 'à l’instant';
  if (m < 60) return 'il y a ' + m + '\u00a0min';
  const h = Math.floor(m / 60), r = m % 60;
  return 'il y a ' + h + '\u00a0h' + (r ? '\u00a0' + String(r).padStart(2, '0') : '');
};


/* ═══ 3–6. LE MODÈLE — lu dans les vraies données (REF-1, §266) ═══
   La maquette avait ici ses données de démonstration. Le cockpit les remplace par V, que cockpit.js construit
   à partir des moteurs du Pilotage (fin prévue, photos du jour, journal, parcelles, présences, météo, économie).
   Les dessins ne changent pas : ils lisent les mêmes noms qu'avant. */
let V = null;
let AUJ, DEBUT, VISEE, XMAX, TACHES = [], T = {}, PREREQ = {}, GENS = [], EQ = {}, APPS = [], AIDX = {},
  PLAN_H = 720, PLAN_W = 1000, PLAN_S = 1, PLAN_LARG = 0, HA_VIGNE = 0, PARCS = [], PIDX = {}, HA_TOT = 0, ORDRE = {}, TOTAL = 0, YMAX = 500, TAUX = 0,
  POSTES = [], HIST = [], METEO = [], T0 = Date.now(), MIN = 60e3, NEXT_ID = 1, SPARK_TRAV = [], SPARK_BUD = [], SPARK_ECART = [];
const S = { etats: {}, presta: {}, dates: {}, equipes: [], evts: [], trac: [], vue: null, filtre: null, sel: null, onglet: 'auj', mode: 'terrain', svTout: false, filTout: false };
const H_JOUR = 1;
const effectif = () => (V ? V.presents : 0);
const capacite = () => 0;
const dParc = p => p.d || '';
const pX = p => (p.cx / PLAN_W * 100) + '%';
const pY = p => (p.cy / PLAN_H * 100) + '%';
const coutParc = (pid, t) => PIDX[pid].ha * T[t].hha * (1 + (AIDX[PIDX[pid].app].ecart || 0)) * TAUX;
const resteAu = () => (V ? V.reste : 0);
const coutAu = () => 0;
const etatVue = (t, pid) => {
  if (PIDX[pid].arr) return 'arr';
  const e = (S.etats[t] || {})[pid] || 'afaire';
  return (e === 'afaire' && T[t] && AUJ > T[t].fin) ? 'retard' : e;
};
function finPrevue() { return V && V.fin ? deIso(V.fin) : ajout(AUJ, 1); }

/* ★ FORME-1 (§301) — LE PLAN AUX FORMES RÉELLES, COMPACT. Chaque parcelle a la forme de son contour (utils.js,
   _mvFormeDe : une seule lecture pour le plan, la loupe et les fiches), nord en haut, À LA MÊME ÉCHELLE pour tout le
   domaine ; rangée par appellation (la plus grande d'abord), commune après commune, sans cadre ni ligne de commune.
   Le dessin se fait à la largeur réelle du panneau (1 unité = 1 pixel) : les textes gardent leur taille, rien ne
   défile de côté, le plan se redessine quand la largeur change (dessinerPlan). Mesuré sur 37 parcelles : 394 px de
   haut sur ordinateur (801 avec les bandes de REF-1) ; 615 px au téléphone, replié à environ 370.
   ⚠️ Avant : chaque zone d'une ligne avait la même hauteur — une parcelle de 0,31 ha sortait plus grande qu'une de
   0,88 ha, le rapport des surfaces ne tenait qu'à l'intérieur d'une commune. Et la commune, rangée { nom, lat, lng }
   depuis la météo par secteur, s'écrivait « [object Object] » au-dessus de chaque bloc (toutes fondues en une). */
/* ★ CHARTE-1 (§367) — une toile (canvas) ne lit pas les variables CSS : la police qui mesure les noms est celle du réglage
   --font-ui de styles.css, lue au premier dessin (la feuille est appliquée bien avant le cockpit). Le repli redit la police
   d'avant, pour le cas où la feuille ne serait pas encore là ; il est exempté, avec sa raison, dans mv-harnais-police. */
let POLICE_UI = '';
function policeUi() {
  if (!POLICE_UI) {
    try { POLICE_UI = getComputedStyle(document.documentElement).getPropertyValue('--font-ui').trim(); }
    catch (e) { if (window._mvAvale) window._mvAvale(e, 'cockpit-vue.js/policeUi'); }
  }
  return POLICE_UI || 'Outfit, system-ui, sans-serif';
}
const POL_PL = { get zone() { return '600 13px ' + policeUi(); }, get ha() { return '400 12px ' + policeUi(); }, get pc() { return '500 12px ' + policeUi(); } };
const bornePl = (v, a, b) => Math.max(a, Math.min(b, v));
const nomCommune = c => (c && typeof c === 'object') ? String(c.nom || '') : String(c || '');
let CTX2D = null;
function largeurTx(t, police) {
  try { if (!CTX2D) CTX2D = document.createElement('canvas').getContext('2d'); CTX2D.font = police; return CTX2D.measureText(String(t)).width; }
  catch (e) { if (window._mvAvale) window._mvAvale(e, 'cockpit-vue.js/largeurTx'); return String(t).length * 6.6; }
}
// Les appellations et leurs parcelles, une fois par chargement ; la place de chacune se calcule au dessin (disposer).
function preparerParcs(parcs) {
  const apps = {}, ordre = [], forme = typeof window._mvFormeDe === 'function' ? window._mvFormeDe : () => null;
  PARCS = parcs.map((p, i) => {
    const a = p.appellation || 'Sans appellation', c = nomCommune(p.commune);
    if (!apps[a]) { apps[a] = { nom: a, ha: 0, com: {}, ordreC: [] }; ordre.push(a); }
    const A = apps[a]; if (!p.arr) A.ha += p.ha;
    if (!A.com[c]) { A.com[c] = []; A.ordreC.push(c); }
    const P = { id: 'p' + i, nom: p.nom, ha: p.ha, commune: c, cep: p.cepage || '', arr: !!p.arr, f: forme(p.geo),
      cote: Math.max(3, Math.sqrt(Math.max(p.ha, 0) * 1e4)), cx: 0, cy: 0, d: '', box: [0, 0, 0, 0] };
    A.com[c].push(P); return P;
  });
  ordre.sort((x, y) => apps[y].ha - apps[x].ha || x.localeCompare(y, 'fr'));
  APPS = ordre.map((a, k) => {
    const A = apps[a], id = 'a' + k;
    const groupes = A.ordreC.map(c => ({ nom: c, parcs: A.com[c], ha: A.com[c].reduce((t, p) => t + (p.arr ? 0 : p.ha), 0) }))
      .sort((g, h) => h.ha - g.ha || g.nom.localeCompare(h.nom, 'fr'));
    groupes.forEach((g, r) => { g.rang = r; g.parcs.forEach(p => { p.app = id; }); });
    return { id, nom: a, ha: A.ha, ecart: 0, groupes, f: [0, 0, 0, 0], tw: 0 };
  });
  HA_VIGNE = PARCS.reduce((t, p) => t + (p.arr ? 0 : p.ha), 0);
}
// Les mesures du dessin, en pixels : une seule colonne, resserrée, sous 420 px de large (téléphone) ; deux colonnes au-delà
// — la colonne du plan dans le cockpit fait environ 450 px sur un écran de 1 280.
function mesuresPlan(W) { const p = W < 420; return { p, G: p ? 5 : 6, GZ: p ? 18 : 22, HT: 28, C: W >= 900 ? 3 : (p ? 1 : 2) }; }
const dimsP = (p, s) => p.f ? [p.f.w * s, p.f.h * s] : [p.cote * s, p.cote * s];
// Une appellation à la largeur w : ses parcelles par rangées, commune après commune (la plus grande d'abord), les plus
// hautes d'abord dans chaque commune, centrées dans la hauteur de leur rangée.
function rangerZone(z, w, s, K) {
  const items = []; let y = z.ht || K.HT;
  const it = [].concat(...z.groupes.map(g => g.parcs.map(p => { const d = dimsP(p, s); return { p, w: d[0], h: d[1], g: g.rang }; })))
    .sort((a, b) => (a.g - b.g) || (b.h - a.h) || String(a.p.nom).localeCompare(String(b.p.nom), 'fr'));
  let x = 0, rh = 0, row = [];
  const vider = () => { row.forEach(o => { o.y = y + (rh - o.h) / 2; }); items.push(...row); y += rh + K.G; row = []; x = 0; rh = 0; };
  it.forEach(o => { if (row.length && x + o.w > w + .5) vider(); o.x = x; x += o.w + K.G; if (o.h > rh) rh = o.h; row.push(o); });
  if (row.length) vider();
  return { h: y - K.G, items };
}
// Les appellations en colonnes de même largeur, chacune dans la colonne la moins haute : aucune ne garde de vide sous ses
// parcelles. La plus grande prend toute la largeur quand elle porte plus du tiers des vignes.
function plierPlan(W, s, K) {
  const C = K.C, Wc = (W - (C - 1) * K.GZ) / C, places = [];
  let y0 = 0, reste = APPS;
  if (C > 1 && APPS.length > 1 && APPS[0].ha >= .36 * HA_VIGNE) {
    APPS[0].ht = APPS[0].tw <= W ? K.HT : K.HT + 14;
    const r = rangerZone(APPS[0], W, s, K); places.push({ z: APPS[0], x: 0, y: 0, w: W, h: r.h, r }); y0 = r.h + K.GZ; reste = APPS.slice(1);
  }
  const hc = new Array(C).fill(y0);
  reste.forEach(z => {
    z.ht = z.tw <= Wc ? K.HT : K.HT + 14;   // un titre trop long pour sa colonne passe sur deux lignes
    const r = rangerZone(z, Wc, s, K); let k = 0;
    for (let i = 1; i < C; i++) if (hc[i] < hc[k] - .5) k = i;
    places.push({ z, x: k * (Wc + K.GZ), y: hc[k], w: Wc, h: r.h, r }); hc[k] += r.h + K.GZ;
  });
  return { H: Math.ceil(Math.max(0, ...places.map(o => o.y + o.h))), places };
}
// L'échelle (pixels par mètre) : les vignes couvrent une part fixe de l'écran (le double sur une seule colonne), quelle
// que soit la taille du domaine ; aucune parcelle ne déborde de sa colonne ; deux écrans de haut au plus.
function echellePlan(W, K) {
  const A = Math.max(1, PARCS.reduce((t, p) => t + (p.f ? p.f.aire : p.cote * p.cote), 0));
  const Wc = (W - (K.C - 1) * K.GZ) / K.C, maxW = Math.max(1, ...PARCS.map(p => p.f ? p.f.w : p.cote));
  let s = Math.min(Math.sqrt((K.p ? .14 : W < 600 ? .10 : .07) * W * W / A), 1.6, Wc / maxW);
  const Hmax = (K.p ? 3.4 : 2.2) * W;
  if (plierPlan(W, s, K).H > Hmax) { let lo = s * .25, hi = s; for (let i = 0; i < 16; i++) { const m = (lo + hi) / 2; if (plierPlan(W, m, K).H <= Hmax) lo = m; else hi = m; } s = lo; }
  return s;
}
function placerParc(p, ox, oy, s) {
  if (p.f) {
    const pts = p.f.rings.map(r => r.map(q => [ox + q[0] * s, oy + q[1] * s]));
    p.d = pts.map(r => 'M' + r.map(q => f1(q[0]) + ' ' + f1(q[1])).join('L') + 'Z').join('');
    p.cx = ox + p.f.pole.x * s; p.cy = oy + p.f.pole.y * s; p.box = [ox, oy, p.f.w * s, p.f.h * s];
  } else {   // sans contour : un carré de sa surface, coins adoucis, en pointillé
    const a = p.cote * s, r = Math.min(4, a / 5), x1 = ox + a, y1 = oy + a, A = ' ' + f1(r) + ' ' + f1(r) + ' 0 0 1 ';
    p.d = 'M' + f1(ox + r) + ' ' + f1(oy) + 'H' + f1(x1 - r) + 'A' + A + f1(x1) + ' ' + f1(oy + r) + 'V' + f1(y1 - r) + 'A' + A + f1(x1 - r) + ' ' + f1(y1)
      + 'H' + f1(ox + r) + 'A' + A + f1(ox) + ' ' + f1(y1 - r) + 'V' + f1(oy + r) + 'A' + A + f1(ox + r) + ' ' + f1(oy) + 'Z';
    p.cx = ox + a / 2; p.cy = oy + a / 2; p.box = [ox, oy, a, a];
  }
}
function disposer(W) {
  const K = mesuresPlan(W);
  APPS.forEach(z => { z.tw = largeurTx(z.nom, POL_PL.zone) + 8 + largeurTx(haTxt(z.ha), POL_PL.ha); });
  const s = echellePlan(W, K), L = plierPlan(W, s, K);
  PLAN_S = s; PLAN_W = W; PLAN_H = Math.max(40, L.H); PLAN_LARG = W;
  L.places.forEach(o => { o.z.f = [o.x, o.y, o.w, o.h]; o.r.items.forEach(it => placerParc(it.p, o.x + it.x, o.y + it.y, s)); });
}

function charger(v) {
  V = v;
  AUJ = deIso(v.auj); DEBUT = deIso(v.debut || v.auj); VISEE = v.objectif ? deIso(v.objectif) : ajout(AUJ, 60);
  const fin = v.fin ? deIso(v.fin) : VISEE;
  XMAX = ajout(fin > VISEE ? fin : VISEE, 5);
  TACHES = (v.taches || []).map(t => ({ id: t.id, nom: t.nom, art: t.art || t.nom.toLowerCase(), f: !!t.f, hha: t.hha || 0,
    debut: deIso(t.debut || v.debut || v.auj), fin: deIso(t.fin || v.objectif || v.auj), pct: t.pct || 0, hDone: t.hDone, hTotal: t.hTotal, sel: !!t.sel, cle: t.cle, eqFini: !!t.eqFini }));   // HORS-1 (§322) : sel = tâche à la sélection — la loupe dit pourquoi une parcelle n'est pas concernée
  T = Object.fromEntries(TACHES.map(t => [t.id, t]));
  GENS = (v.gens || []).map(g => ({ p: g.nom, absent: !!g.absent, motif: g.motif || '', tens: g.tens || 100 }));
  preparerParcs(v.parcs || []); if (PLAN_LARG) disposer(PLAN_LARG);
  PIDX = Object.fromEntries(PARCS.map(p => [p.id, p]));
  AIDX = Object.fromEntries(APPS.map(a => [a.id, a]));
  HA_TOT = PARCS.filter(p => !p.arr).reduce((s, p) => s + p.ha, 0);
  const parNom = Object.fromEntries(PARCS.map(p => [p.nom, p.id]));
  TACHES.forEach(t => {
    ORDRE[t.id] = PARCS.filter(p => !p.arr).map(p => p.id);
    S.etats[t.id] = {}; S.dates[t.id] = {};
    PARCS.forEach(p => { if (!p.arr) S.etats[t.id][p.id] = 'afaire'; });
    const et = (v.etats && v.etats[t.id]) || {};
    Object.keys(et).forEach(n => { const pid = parNom[n]; if (pid && !PIDX[pid].arr && et[n] !== 'arr') S.etats[t.id][pid] = et[n] === 'retard' ? 'afaire' : et[n]; });
    // ★ ETAT-1 (§320) : les parcelles d'arrachage finies pour l'équipe — faites sur le plan, la suite au prestataire (la loupe le dit).
    S.presta[t.id] = {}; ((v.presta && v.presta[t.id]) || []).forEach(n => { const pid = parNom[n]; if (pid) S.presta[t.id][pid] = true; });
  });
  if (!S.vue || !T[S.vue]) S.vue = (v.prio && T[v.prio]) ? v.prio : ((TACHES.find(t => t.pct < 100 && !t.eqFini) || TACHES[0] || {}).id || null);
  EQ = {}; S.equipes = []; S.evts = [];
  (v.equipes || []).forEach((e, i) => { const id = 'e' + i; EQ[id] = { noms: e.noms, ini: e.ini }; if (parNom[e.parcelle] && T[e.tache]) S.equipes.push({ id, tache: e.tache, parc: parNom[e.parcelle], depuis: typeof e.depuis === 'string' ? e.depuis : '' }); });   // DIRECT-2 (§328) : jamais « aujourd'hui » par défaut
  // ★ FORME-1 (§301) : une parcelle en cours porte TOUJOURS une pastille (« en cours » et « une équipe dessus » sont une
  //   seule lecture du journal, cockpit.js/_ckPlanDebuts) ; un début sans nom au journal le dit au lieu de disparaître.
  TACHES.forEach(t => Object.keys(S.etats[t.id]).forEach(pid => {
    if (S.etats[t.id][pid] !== 'cours' || S.equipes.some(e => e.tache === t.id && e.parc === pid)) return;
    const id = 'e' + Object.keys(EQ).length; EQ[id] = { noms: 'Personne d’indiqué', ini: ['?'] };
    // ★ DIRECT-2 (§328) : le jour du début vient du modèle (v.depuis — pour un arrachage en étapes, sa première étape validée) ;
    //   inconnu, il reste vide. Avant : la date du jour, et « En direct » écrivait « commencée aujourd'hui » sur des arrachages
    //   commencés des semaines plus tôt, en tête d'« En ce moment ». Nico (14/10).
    const dj = ((v.depuis || {})[t.id] || {})[PIDX[pid].nom];
    S.equipes.push({ id, tache: t.id, parc: pid, depuis: typeof dj === 'string' ? dj : '' });
  }));
  (v.evts || []).forEach((e, i) => {
    const id = 'f' + i; EQ[id] = EQ[id] || { noms: e.noms, ini: e.ini };
    // ★ DIRECT-1 (§318) : le tracteur n'a ni tâche du plan ni parcelle unique — il garde son activité, ses parcelles, ses minutes.
    if (EV_TRAC[e.type]) { S.evts.push({ id: i + 1, type: e.type, eq: id, act: String(e.act || ''), parcs: Array.isArray(e.parcs) ? e.parcs.map(String) : [], m: typeof e.m === 'number' ? e.m : null, trac: String(e.trac || ''), ts: typeof e.ts === 'number' ? e.ts : null }); return; }
    if (parNom[e.parcelle] && T[e.tache]) S.evts.push({ id: i + 1, type: e.type, eq: id, t: e.tache, pid: parNom[e.parcelle], h: e.h || 0, ts: e.ts || Date.now() });
  });
  NEXT_ID = S.evts.length + 1;
  // ★ DIRECT-1 : le tracteur en marche (ou en pause) — « En ce moment », au-dessus du fil, avec les parcelles en cours (S.equipes).
  S.trac = (v.tracCours || []).map((x, i) => { const id = 't' + i; EQ[id] = { noms: String(x.noms || ''), ini: Array.isArray(x.ini) && x.ini.length ? x.ini : ['?'] }; return { id, act: String(x.act || ''), parcs: Array.isArray(x.parcs) ? x.parcs.map(String) : [], ts: typeof x.ts === 'number' ? x.ts : null, pause: !!x.pause }; });
  HIST = (v.photos || []).map(x => ({ d: deIso(x.d), r: x.reste, c: x.cout || 0 }));
  TOTAL = Math.max(v.total || 0, ...HIST.map(h => h.r), v.reste || 0, 1);
  YMAX = Math.ceil(TOTAL / 500) * 500;
  METEO = v.meteo || [];
  OUV = Array.isArray(v.ouvres) ? new Set(v.ouvres) : null; OUV_DE = v.ouvresDe || ''; OUV_A = v.ouvresA || '';
  const e = v.eco || {};
  TAUX = e.taux || 0; POSTES = e.postes || [];
  // ★★ AUJ-7 (§309) : le graphe « dépensé face au fait » lit deux courbes datées par le moteur (pilotage.js/_pilCk2Eco) — plus
  //   les photos du jour, qui mêlaient tous les postes et ne commençaient qu'à la première photo.
  SERIE_E = (e.serie || []).map(x => ({ d: deIso(x.d), dep: Number(x.dep) || 0, fait: Number(x.fait) || 0 })).filter(x => x.d && !isNaN(+x.d));
  APPS.forEach(a => { a.ecart = null; });
  SPARK_TRAV = v.sparkTrav || []; SPARK_BUD = e.sparkBud || []; SPARK_ECART = e.sparkEcart || [];
}

function calc() {
  const v = V, r = { t: {}, a: {}, hF: v.hFait || 0, hT: v.hTotal || 0, hR: 0, moDep: 0, moReste: 0 };
  TACHES.forEach(t => {
    let haF = 0, haT = 0;
    PARCS.forEach(p => { if (p.arr || S.etats[t.id][p.id] === 'hors') return; haT += p.ha; if (S.etats[t.id][p.id] === 'faite') haF += p.ha; });   // HORS-1 : une parcelle pas concernée ne compte pas
    const pct = t.pct != null ? t.pct : (haT ? haF / haT * 100 : 0);
    const etat = (pct >= 99.95 || t.eqFini) ? 'fait' : (AUJ > t.fin ? 'retard' : 'cours');   // CHANT-1 : fini pour l’équipe = vert
    const ecT = ((V.eco || {}).ecTache || {})[t.cle || t.nom], hRt = ((V.eco || {}).hReelTache || {})[t.cle || t.nom];
    r.t[t.id] = { haF, haT, hF: t.hDone != null ? t.hDone : haF * t.hha, hT: t.hTotal != null ? t.hTotal : haT * t.hha, hR: hRt || 0, pct, etat, ecart: ecT != null ? ecT : 0 };
  });
  APPS.forEach(a => {
    const ps = PARCS.filter(p => p.app === a.id && !p.arr), ha = ps.reduce((s, p) => s + p.ha, 0);
    // ★ HORS-1 (§322) : l'avancement d'une appellation ne compte que ses parcelles concernées par la tâche affichée ; aucune : null (un
    //   tiret). ha reste la surface en production (Par appellation, vue Économie).
    const pc = S.vue ? ps.filter(p => S.etats[S.vue][p.id] !== 'hors') : ps, haC = pc.reduce((s, p) => s + p.ha, 0);
    const haF = S.vue ? pc.filter(p => S.etats[S.vue][p.id] === 'faite').reduce((s, p) => s + p.ha, 0) : 0;
    r.a[a.id] = { ha, pct: haC ? haF / haC * 100 : null, coutHa: ((v.eco || {}).coutHaApp || {})[a.nom] || 0 };
  });
  r.pct = v.pct != null ? v.pct : (r.hT ? r.hF / r.hT * 100 : 0);
  r.reste = v.reste || 0;
  r.ecartMoy = (v.eco || {}).ecartMoy || 0;
  r.fin = finPrevue(); r.finPaul = r.fin;
  r.ecart = v.marge != null ? v.marge : Math.round((VISEE - r.fin) / 864e5);
  r.capMoy = v.capMoy || 0; r.besoin = v.besoin || 0;   // AUJ-7 : la cadence de l'ÉQUIPE (l'économie prêtait la journée de référence, 7 h)
  const e = v.eco || {};
  r.hR = e.hReel || 0;
  r.moBudget = e.moBudget || 0; r.moDep = e.moDep || 0; r.moAtt = e.moAtt || 0; r.moH = e.moH || 0; r.cadAppl = !!e.cadAppl;   // AUJ-7
  r.budget = e.budget || 0; r.dep = e.dep || 0; r.att = e.att || 0; r.sous = r.budget - r.att;
  r.budgetPct = r.moBudget ? r.moDep / r.moBudget * 100 : 0;
  r.coutHa = HA_TOT ? r.att / HA_TOT : 0; r.coutHaPrevu = HA_TOT ? r.budget / HA_TOT : 0;
  return r;
}

/* ═══ 7. LES DESSINS — chacun rend du HTML, comme dans l’appli ═══ */
const eur = v => nb(v) + '\u202f€';
const eur100 = v => nb(Math.round(v / 100) * 100) + '\u202f€';
const signe = v => { const n = Math.round(v); return (n > 0 ? '+' : n < 0 ? '−' : '') + nb(Math.abs(n)); };   // AUJ-7 : arrondi AVANT le signe — jamais « −0 »
const NF1 = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const pct1 = v => { const n = Math.round(v * 10) / 10; return (n > 0 ? '+' : n < 0 ? '−' : '') + NF1.format(Math.abs(n)) + '\u202f%'; };   // AUJ-7 : jamais « −0,0 % »
const INFO = {
  fin: 'La fin prévue prend les heures qui restent au barème et les retire, jour après jour, de la capacité inscrite au planning : contrats en cours, absences, formations et congés compris. Elle avance quand une parcelle est validée.',
  travaux: 'Heures du barème des parcelles validées, sur le total des tâches de la campagne. Une parcelle commencée ne compte qu’à sa validation.',
  effectif: 'Personnes prévues au planning aujourd’hui, hors bureau, et celles qui manquent (congé, arrêt, récupération). Un jour sans travail au planning — week-end, jour chômé —, la tuile montre le prochain jour travaillé et le dit.',
  budget: 'Part du budget main-d’œuvre déjà payée — les heures du planning dans les rangs, hors travaux à l’heure (arrachage…) —, face à la part du travail faite au barème. Payer moins vite qu’on n’avance, c’est être en avance.',
  conformite: 'Points du registre phyto et des documents obligatoires qui demandent une action de votre part.',
  savoir: 'Ce qui peut changer la journée ou la semaine. Sous chaque jour : le risque de pluie (le plus haut de la journée), le cumul en millimètres et le vent le plus fort (vent moyen, sans les rafales). Dessous : la pluie ou le vent des deux jours qui viennent, secteur par secteur, et ce qui est en cours dans les communes touchées ; puis les absences, les contrats, les retards et le matériel. Les motifs d’absence ne sont visibles que de l’admin.',
  decision: 'Les quatre questions de chaque matin, chacune avec sa réponse et le bouton pour agir.',
  plan: 'Chaque parcelle a la forme de son contour, nord en haut, à la même échelle pour tout le domaine. Sa couleur dit l’état de la tâche choisie, celui de sa fiche pour la période : faite une fois validée, en cours une fois commencée ; un arrachage fini pour l’équipe est fait, la suite au prestataire. Une parcelle où la tâche est désactivée sur sa fiche ou dans la liste de la tâche, ou pas choisie pour la campagne (arrachage, désherbage, effeuillage), reste à sa place en contour pâle : ni à faire ni en retard, elle ne compte pas dans l’avancement. Le trait sous chaque appellation dit son avancement. Une parcelle en cours porte l’équipe qui l’a commencée, même un autre jour. Au survol, une loupe la montre en grand ; la toucher ouvre sa fiche. Les rangs dessinés sont un repère, pas le relevé des rangs ; une parcelle sans contour est un carré de sa surface, en pointillé.',
  fil: 'En ce moment : chaque parcelle en cours, avec l’équipe qui l’a commencée et depuis quand — même un autre jour —, puis le tracteur en marche ou en pause. Un arrachage en étapes compte depuis sa première étape validée. Aujourd’hui : les validations, les débuts de parcelle et le travail au tracteur de la journée (parcelles finies, avec le temps mesuré au chrono ; session ouverte ; traitement), du plus récent au plus ancien. L’équipe passe d’abord ; celui qui a saisi n’y figure que s’il était dans les rangs.',
  courbe: 'Le reste mesuré : une ligne relie la photo de chaque jour au point d’aujourd’hui, en direct. La photo est prise à la première ouverture du Pilotage par un administrateur, une fois les données arrivées (60 jours gardés) ; un jour sans photo est un trou. L’axe part de la première photo. La projection suit la capacité du planning ; la ligne fine montre l’allure qu’il faudrait pour finir pile à l’objectif.',
  atterrissage: 'La fin projetée de l’onglet Économie : ce qui est déjà dépensé, plus le travail qui reste, compté au barème et corrigé de la cadence mesurée de l’équipe quand elle s’applique (sinon au barème seul). Tracteur, GNR et phyto suivent l’avancement ; les prestations et les travaux à l’heure comptent ce qu’ils ont coûté.',
  coutha: 'L’atterrissage de la campagne, divisé par les hectares en production (une vigne arrachée n’en a plus). Le prévu est le budget, divisé de la même façon.',
  ecart: 'Les heures passées dans les rangs (planning), moins le tracteur et les travaux à l’heure (arrachage, désherbage manuel… : rien au barème en face), face aux heures du barème du travail validé. Au-dessus de zéro, l’équipe met plus longtemps que le barème.',
  cadence: 'Heures de barème validées par jour travaillé, sur les quatre dernières semaines, face à l’allure qu’il faut tenir pour finir à l’objectif.',
  inaction: 'Ce que coûterait le retard si rien n’est décidé : le travail hors de sa fenêtre prend du temps en plus chaque semaine. C’est une hypothèse de calcul, pas une mesure.',
  echart: 'Du début de la période à aujourd’hui : le budget main-d’œuvre payé (heures du planning, au jour où elles ont été faites, hors travaux à l’heure) et le travail fait au barème (à la date des validations). Tant que le payé reste sous le fait, la main-d’œuvre coûte moins que prévu. Les pointillés prolongent jusqu’à la fin prévue.',
  postes: 'Main-d’œuvre : la barre est son budget, la partie pleine ce qui est payé, le trait la fin prévue ; à droite, l’écart prévu. Tracteur, GNR, phyto : leur prévu suit l’avancement ; à droite, ce qui reste à dépenser. Prestations et travaux à l’heure (arrachage…) : payés au réel, sans prévu.',
  apps: 'Le barème du travail validé dans chaque appellation, au coût horaire de l’équipe, divisé par ses hectares en production. Une appellation sans travail validé ne se compare pas.',
  taches: 'Pour chaque tâche au barème qui a du travail validé : l’écart entre les heures réellement versées et le barème. À droite du zéro, l’équipe va moins vite que le barème. Un travail à l’heure (arrachage…) n’a pas de barème : il a sa ligne dans « Par poste ».',
};
const SVG = (d, cls) => '<svg' + (cls ? ' class="' + cls + '"' : '') + ' viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>';
const ICO = {
  chev: '<svg class="ck-chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5"/></svg>',
  ok: SVG('<path d="M6 12.5l4 4 8-9"/>'),
  nuage: SVG('<path class="m-nuage" d="M7 17.5a4.5 4.5 0 0 1 .6-9 5.5 5.5 0 0 1 10.3 2A3.5 3.5 0 0 1 17.5 17.5z"/>'),
  pluie: SVG('<path class="m-nuage" d="M7 15a4.5 4.5 0 0 1 .6-9 5.5 5.5 0 0 1 10.3 2A3.5 3.5 0 0 1 17.5 15z"/><path class="m-eau" d="M9 18l-1 2.5M13 18l-1 2.5M17 18l-1 2.5"/>'),
  gel: SVG('<path class="m-gel" d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.6 4.6 12 7l2.4-2.4M9.6 19.4 12 17l2.4 2.4"/>'),
  eclaircie: SVG('<circle class="m-sol" cx="9" cy="8.5" r="3"/><path class="m-rai" d="M9 2.6v1.3M3.1 8.5h1.3M4.8 4.3l.9.9M13.2 4.3l-.9.9"/><path class="m-nuage" d="M9.8 19.5a3.8 3.8 0 0 1 .5-7.6 4.6 4.6 0 0 1 8.6 1.7 2.9 2.9 0 0 1-.6 5.9z"/>'),
  soleil: SVG('<circle class="m-sol" cx="12" cy="12" r="4"/><path class="m-rai" d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>'),
  vent: SVG('<path d="M3 8.5h10a2.5 2.5 0 1 0-2.5-2.5M3 12h15.5a2.5 2.5 0 1 1-2.5 2.5M3 15.5h7"/>'),   // AUJ-8 (§312) : la ligne du vent, sous chaque jour
  contrat: SVG('<path d="M7 3.5h7l4 4V20.5H6.5v-17z"/><path d="M14 3.5V8h4M9.5 12.5h5M9.5 16h3.5"/>'),
  retard: SVG('<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>'),
  materiel: SVG('<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.4 2.4-2.6-.6-.6-2.6z"/>'),
  equipe: SVG('<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>'),
  formation: SVG('<path d="M3 9.5 12 5l9 4.5-9 4.5z"/><path d="M7 11.5V16c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-4.5"/>'),
  cave: SVG('<path d="M8 3.5h8l-.5 6a3.5 3.5 0 0 1-7 0z"/><path d="M12 13v6.5M8.5 20.5h7"/>'),
  crayon: SVG('<path d="M4 20h4l10-10-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
  cadenas: SVG('<rect x="5.5" y="10.5" width="13" height="9.5" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>'),
  feuille: SVG('<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19l7.5-7.5"/>'),
  euro: SVG('<circle cx="12" cy="12" r="8.5"/><path d="M15.2 9a3.8 3.8 0 1 0 0 6M7.5 11h5.5M7.5 13.2h5.5"/>'),
};
const btnI = (cle, lab) => '<button class="ck-i" type="button" data-info="' + cle + '" data-bulle="" aria-label="' + esc(lab) + '" aria-expanded="false">i</button>';
const entete = (titre, cadre, info, idCadre, droite) => '<header class="ck-p-hd' + (droite ? ' serre' : '') + '"><div><h2 class="ck-titre-p">' + titre
  + (info ? btnI(info, 'Comment lire « ' + titre.replace(/<[^>]+>/g, '') + ' »') : '') + '</h2><p class="ck-cadre"' + (idCadre ? ' id="' + idCadre + '"' : '') + '>' + cadre + '</p></div>' + (droite || '') + '</header>';

// La petite courbe d’un chiffre (grammaire SPARK-1 du kit).
function spark(vals, mauvais, w = 92, h = 34) {
  if (!vals || vals.length < 2) return '';   // REF-2 : pas d'historique, pas de petite courbe (jamais un tracé vide)
  const B = 30, n = vals.length, pl = 2, pr = 5, pt = 4, pb = 4, iw = w - pl - pr, ih = h - pt - pb;
  const y = e => pt + ih / 2 - (Math.max(-B, Math.min(B, e)) / B) * (ih / 2);
  const x = k => pl + k / (n - 1) * iw;
  const d = 'M' + vals.map((e, k) => x(k).toFixed(1) + ' ' + y(e).toFixed(1)).join('L');
  const eL = vals[n - 1], defav = mauvais === 'bas' ? eL < 0 : eL > 0;
  const cls = (Math.abs(eL) < 3 || !defav) ? 'fait' : 'attention';
  const ym = (pt + ih / 2).toFixed(1);
  return '<svg class="ck-spark" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" aria-hidden="true">'
    + '<line class="ref" x1="' + pl + '" x2="' + (w - pr) + '" y1="' + ym + '" y2="' + ym + '"/>'
    + '<path class="l-' + cls + '" d="' + d + '"/><circle class="p-' + cls + '" cx="' + x(n - 1).toFixed(1) + '" cy="' + y(eL).toFixed(1) + '" r="2.6"/></svg>';
}

/* ── En-tête de l’écran : le résumé en une phrase, et la bascule ── */
function htmlTete() {
  return '<div class="ck-tete-g"><p class="ck-tete-date">' + esc(V.dateTxt) + '</p><p class="ck-tete-res" id="ck-resume" aria-live="polite"></p></div>'
    + (V.eco ? '<div class="ck-bascule" role="tablist" aria-label="Vue de la journée">'
      + '<button type="button" role="tab" data-mode="terrain" aria-selected="true">' + ICO.feuille + 'Terrain</button>'
      + '<button type="button" role="tab" data-mode="eco" aria-selected="false">' + ICO.euro + 'Économie</button>'
      + '<span class="ck-bascule-ind" aria-hidden="true"></span></div>' : '');
}

const tuile = (id, lab, num, vis, cadre, onglet, cible) =>
  '<div class="ck-ph" data-ph="' + id + '">'
  + '<button class="ck-ph-go" type="button" data-onglet="' + onglet + '" aria-label="' + esc(lab) + ' : ouvrir ' + esc(cible) + '"></button>'
  + '<div class="ck-ph-l"><span>' + lab + '</span>' + btnI(id, 'Comment ce chiffre est calculé') + ICO.chev + '</div>'
  + '<div class="ck-ph-m"><span class="ck-ph-n">' + num + '</span><span class="ck-ph-vis">' + vis + '</span></div>'
  + '<p class="ck-cadre">' + cadre + '</p></div>';
function htmlPhotos(r) {
  const avs = '<span class="ck-avs" role="img" aria-label="' + esc(V.presTxt) + '">'
    + GENS.map(g => '<span class="ck-av-m' + (g.absent ? ' abs' : '') + '">' + esc(g.p.charAt(0)) + '</span>').join('') + '</span>';
  const okIc = '<svg class="ck-ok-ic" viewBox="0 0 32 32" role="img" aria-label="Tout est à jour"><circle cx="16" cy="16" r="13"/><path d="M10.5 16.5l3.6 3.6 7.4-8"/></svg>';
  return tuile('travaux', 'Travaux', '<b class="ck-cpt" id="ck-ph-trav" data-v="0">0</b><small>\u202f%</small>', spark(SPARK_TRAV, 'bas'),
      '<span id="ck-ph-trav-c">' + nb(r.hF) + ' h faites sur ' + nb(r.hT) + ' h</span>', 'camp', 'La campagne')
    + tuile('effectif', 'Effectif', '<b class="ck-cpt" id="ck-ph-eff" data-v="0">0</b><small>\u202fsur ' + V.effectifTotal + '</small>', avs,
      esc(V.absTxt), 'equ', 'L’équipe et les tâches')
    + (V.eco ? tuile('budget', 'Budget', '<b class="ck-cpt" id="ck-ph-bud" data-v="0">0</b><small>\u202f%</small>', spark(SPARK_BUD, 'haut'),
      '<span id="ck-ph-bud-c">du budget main-d’œuvre dépensé, pour ' + nb(r.pct) + '\u00a0% du travail fait</span>', 'eco', 'Économie') : '')
    + tuile('conformite', 'Conformité', '<b class="ck-cpt" id="ck-ph-conf" data-v="0">0</b><small>\u202f' + (V.confN > 1 ? 'points à régler' : 'point à régler') + '</small>',
      V.confN ? '' : okIc, esc(V.confTxt), 'conf', 'Conformité');
}

function htmlVerdict(r) {
  return '<div class="ck-v-haut"><span class="ck-v-k">Fin prévue des travaux</span><span class="ck-etat" id="ck-v-etat"></span></div>'
    + '<h2 class="ck-v-phrase">Les travaux ' + V.saisonDe + ' finiront le <span class="ck-roule" id="ck-v-fin"><span>' + dLong(r.fin) + '</span></span>.</h2>'
    + '<p class="ck-v-sous"><span id="ck-v-ecart"></span>, avec l’équipe prévue au <span class="nw">planning.' + btnI('fin', 'Comment la fin prévue est calculée') + '</span></p>'
    + '<div class="ck-frise" id="ck-frise" aria-hidden="true">'
    + '<div class="ck-fr-piste"><i class="ck-fr-passe"></i><i class="ck-fr-proj"></i><i class="ck-fr-marge"></i></div>'
    + '<span class="ck-fr-mk ck-fr-auj"><em>Aujourd’hui</em></span>'
    + '<span class="ck-fr-mk ck-fr-fin"><em id="ck-fr-fin-l"></em></span>'
    + '<span class="ck-fr-mk ck-fr-visee"><em>Objectif, ' + dCourt(VISEE) + '</em></span>'
    + '<span class="ck-fr-bout">' + dCourt(DEBUT) + '</span></div>'
    + '<div class="ck-v-act">' + (V.admin ? '<button class="ck-obj" type="button" data-fn="objectif" aria-label="Changer la date de l’objectif">'
    + 'Objectif : tout fini le <b>' + dLong(VISEE) + '</b>' + ICO.crayon + '</button>' : '<span class="ck-obj ck-obj-lu">Objectif : tout fini le <b>' + dLong(VISEE) + '</b></span>')
    + '<button class="ck-btn ck-btn-pri" type="button" data-onglet="sim">Simuler un renfort</button></div>';
}

function savoirItems() {
  // Les éléments viennent des sources de « À savoir » de l'appli (météo, absences, contrats, retards, matériel, cave).
  return (V.savoir || []).map(x => Object.assign({ ic: ({ meteo: 'pluie', equipe: 'equipe', contrat: 'contrat', retard: 'retard', materiel: 'materiel', cave: 'cave' })[x.cat] || 'info' }, x));
}

function htmlSavoir(r) {
  const items = savoirItems(r);
  // PRO-1 (§269) : une frise météo vide, sa légende et « Tout voir (0) » s'affichaient quand il n'y avait rien.
  // ★ AUJ-8 (§312) : sous chaque jour, des FAITS — le risque de pluie (la barre et le %, le plus haut de la journée), le cumul,
  //   le vent le plus fort —, plus de « brûlage possible » (Nico, 11/10 : « ce n'est pas à l'appli de décider »). Une valeur
  //   inconnue laisse sa ligne vide, jamais un 0 inventé ; un jour non travaillé n'est pas grisé (Nico, 11/10).
  const pc = v => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
  const met = !METEO.length ? '' : ('<div class="ck-met" role="list" aria-label="Météo des cinq prochains jours">' + METEO.map(m =>
    '<div class="ck-met-j' + (m.ic === 'pluie' ? ' alerte' : '') + '" role="listitem" title="' + esc(m.txt) + '">'
    + '<span class="ck-met-n">' + m.j + '</span>' + '<span class="ck-met-ic ic-' + m.ic + '">' + ICO[m.ic] + '</span>'
    + '<span class="ck-met-t"><b>' + m.tmax + '°</b> ' + m.tmin + '°</span>'
    + (m.pp != null ? '<span class="ck-met-pp" aria-hidden="true"><i style="width:' + pc(m.pp) + '%"></i></span><span class="ck-met-pc">' + pc(m.pp) + '\u00a0%</span>'
      : '<span class="ck-met-pp vide" aria-hidden="true"></span><span class="ck-met-pc">\u00a0</span>')
    + '<span class="ck-met-mm">' + (m.mm >= 0.5 ? String(m.mm).replace('.', ',') + '\u202fmm' : '\u00a0') + '</span>'
    + '<span class="ck-met-v">' + (m.vent != null ? ICO.vent + '<span>' + Math.round(Number(m.vent) || 0) + '</span><span class="ck-met-vu">km/h</span>' : '\u00a0') + '</span></div>').join('') + '</div>'
    + (METEO.some(m => m.pp != null) ? '<p class="ck-met-leg"><i></i>risque de pluie</p>' : ''));
  const lis = items.map(x => '<li class="ck-sv ck-sv-' + x.cat + (x.prio === 1 ? ' fort' : '') + '"' + (x.id ? ' id="' + x.id + '"' : '') + '>'
    + '<span class="ck-sv-ic">' + ICO[x.ic] + '</span>'
    + '<div class="ck-sv-tx"><div class="ck-sv-h"><b>' + esc(x.titre) + '</b><span class="ck-sv-q">' + esc(x.quand) + '</span></div>'
    + (x.sous ? '<p class="ck-sv-s">' + esc(x.sous) + '</p>' : '')   // AUJ-8 : rien en cours, rien d'écrit
    + (x.action ? '<button type="button" class="ck-sv-a"' + (x.onglet ? ' data-onglet="' + x.onglet + '"' : '') + (x.fn ? ' data-fn="' + x.fn + '"' : '')
      + (x.module ? ' data-module="' + x.module + '"' : '') + '>' + x.action + '</button>' : '')
    + '</div></li>').join('');
  return entete('À savoir', 'Ce qui peut changer la journée ou la semaine', 'savoir', null,
      '<span class="ck-prive" title="Les motifs d’absence ne sont visibles que de l’admin">' + ICO.cadenas + 'Admin</span>')
    + met + '<ul class="ck-sv-l' + (S.svTout ? ' tout' : '') + '" id="ck-sv-l">' + lis + '</ul>'
    + (items.length ? '' : '<p class="ck-vide">Rien à signaler pour les jours qui viennent : ni absence, ni fin de contrat, ni retard, ni matériel immobilisé.</p>')
    + (items.length > 5 ? '<button type="button" class="ck-btn ck-btn-ghost ck-btn-s ck-sv-tout" id="ck-sv-tout" aria-expanded="' + S.svTout + '">'
      + (S.svTout ? 'Replier' : 'Tout voir (' + items.length + ')') + '</button>' : '');
}

function htmlDecision() {
  const D = V.decision || {};
  const presents = GENS.map(g => '<span class="ck-av-m' + (g.absent ? ' abs' : '') + '" title="' + esc(g.p + (g.absent ? ', ' + (g.motif || 'absent') : '')) + '">' + esc(g.p.charAt(0)) + '</span>').join('');
  const tens = GENS.filter(g => !g.absent && g.tens != null).map(g => '<span class="ck-tn" title="' + esc(g.p) + ' : ' + g.tens + '\u00a0%"><i style="height:' + Math.max(0, Math.min(100, (g.tens - 60) * 2.5)) + '%"'
    + (g.tens > 105 ? ' class="haut"' : '') + '></i><em>' + esc(g.p.charAt(0)) + '</em></span>').join('');
  const dz = (t, v, raison, bande, pied, attr) => '<div class="ck-dz"' + (attr || '') + '><div class="ck-dz-t">' + t + '</div><div class="ck-dz-v">' + esc(v) + '</div>'
    + '<p class="ck-dz-r">' + esc(raison) + '</p><div class="ck-dz-b">' + bande + '</div><div class="ck-dz-p">' + pied + '</div></div>';
  const p = D.pres || {}, tr = D.traiter || {}, pr = D.prio || {}, te = D.tension || {};
  // PRO-1 (§269) : la fenêtre de traitement se DESSINE sur 24 heures. Avant, son dessin de l'ancienne tuile était
  //   aplati en texte et les heures se collaient : « 0 h12 h24 h ».
  let bTr = '';
  if (tr.fen) bTr = '<span class="ck-dz-fen"><span class="ck-dz-fen-piste" role="img" aria-label="Fenêtre de traitement de ' + tr.fen.g0 + ' h à ' + tr.fen.g1 + ' h">'
    + '<i style="left:' + (tr.fen.g0 / 24 * 100).toFixed(1) + '%;width:' + (Math.max(0, tr.fen.g1 - tr.fen.g0) / 24 * 100).toFixed(1) + '%"></i></span>'
    + '<span class="ck-dz-fen-ax" aria-hidden="true"><span>0 h</span><span>12 h</span><span>24 h</span></span>'
    + (tr.risque ? '<span class="ck-dz-alerte">Pluie ensuite : risque de lessivage</span>' : '') + '</span>';
  else if (tr.prochaine) bTr = '<span class="ck-dz-calme">' + ICO.ok + 'Prochaine fenêtre : ' + esc(tr.prochaine) + '</span>';
  // PRO-1 : la barre ne suit que la tâche NOMMÉE ; « À choisir » montre les tâches qui se disputent la place.
  let bPr = '';
  if (V.prio && T[V.prio]) bPr = '<span class="ck-dz-barre"><span class="ck-barre"><i class="b-cours" id="ck-dz-prio-i" style="width:0%"></i></span><span class="ck-dz-pc" id="ck-dz-prio-t"></span></span>';
  else if (pr.choix && pr.choix.length) bPr = '<span class="ck-dz-chips">' + pr.choix.slice(0, 4).map(n => '<span>' + esc(n) + '</span>').join('') + (pr.choix.length > 4 ? '<span>+' + (pr.choix.length - 4) + '</span>' : '') + '</span>';
  const piedPr = V.admin ? '<button type="button" class="ck-lien" data-fn="priorite">' + (pr.mode === 'choix' ? 'Choisir la priorité' : 'Changer la priorité') + '</button>'
    : '<span class="ck-dz-note">L’administrateur fixe la priorité</span>';
  return entete('La décision du jour', 'Quatre questions, quatre réponses, un bouton chacune', 'decision')
    + '<div class="ck-dz-g">'
    + dz('Présences', p.v || '—', p.raison || '', '<span class="ck-avs">' + presents + '</span>', '<button type="button" class="ck-lien" data-module="planning">Ouvrir le planning</button>')
    + dz('Traiter ?', tr.v || '—', tr.raison || '', bTr, '<button type="button" class="ck-lien" data-module="phyto">Registre phyto</button>', ' data-mvt="traiter"')
    + dz('Tâche prioritaire', pr.v || '—', pr.raison || '', bPr, piedPr)
    + dz('Tension de l’équipe', te.v || '—', te.raison || '', '<span class="ck-tns">' + tens + '</span>', te.v && te.v !== '—' ? '<button type="button" class="ck-lien" data-fn="tension">Voir le détail</button>' : '')
    + '</div>';
}

function svgPlan() {
  const K = mesuresPlan(PLAN_W), D = K.p ? 3 : 3.4, angles = new Set(), fa = typeof window._mvFormeAngle === 'function' ? window._mvFormeAngle : () => 90;
  PARCS.forEach(p => { if (p.f && !p.arr) angles.add(fa(p.f.ang)); });
  const defs = '<pattern id="ck-hach" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line class="ck-hach-l" x1="0" y1="0" x2="0" y2="7"/></pattern>'
    + [...angles].map(k => '<pattern id="ck-rg-' + k + '" width="' + D + '" height="' + D + '" patternUnits="userSpaceOnUse" patternTransform="rotate(' + k + ')"><path class="ck-rg-l" d="M' + (D / 2) + ' 0V' + D + '"/></pattern>').join('');
  const pcW = largeurTx('100 %', POL_PL.pc);
  const zones = APPS.map(a => {
    const [x, y, w] = a.f, deux = (a.ht || K.HT) > K.HT, yR = y + (deux ? 33 : 19);
    // Sur deux lignes : le nom (coupé d'un « … » s'il ne tient pas même seul, le nom entier au survol), puis la surface et l'avancement.
    let nom = a.nom;
    if (deux && largeurTx(nom, POL_PL.zone) > w) { while (nom.length > 3 && largeurTx(nom + '…', POL_PL.zone) > w) nom = nom.slice(0, -1); nom = nom.trimEnd() + '…'; }
    return '<g class="ck-zone" data-app="' + a.id + '">'
      + (deux
        ? '<text class="ck-zone-nom" x="' + f1(x) + '" y="' + f1(y + 13) + '">' + esc(nom) + '<title>' + esc(a.nom) + '</title></text>'
          + '<text class="ck-zone-ha" x="' + f1(x) + '" y="' + f1(y + 28) + '">' + haTxt(a.ha) + '</text>'
          + '<text class="ck-zone-pc" id="ck-zt-' + a.id + '" x="' + f1(x + w) + '" y="' + f1(y + 28) + '" text-anchor="end"></text>'
        : '<text class="ck-zone-nom" x="' + f1(x) + '" y="' + f1(y + 13) + '">' + esc(a.nom) + '<tspan class="ck-zone-ha" dx="8">' + haTxt(a.ha) + '</tspan></text>'
          + (w - a.tw >= pcW + 12 ? '<text class="ck-zone-pc" id="ck-zt-' + a.id + '" x="' + f1(x + w) + '" y="' + f1(y + 13) + '" text-anchor="end"></text>' : ''))
      + '<rect class="ck-zone-rail" x="' + f1(x) + '" y="' + f1(yR) + '" width="' + f1(w) + '" height="2" rx="1"/>'
      + '<rect class="ck-zone-prog" id="ck-zp-' + a.id + '" x="' + f1(x) + '" y="' + f1(yR) + '" width="' + f1(w) + '" height="2" rx="1"/></g>';
  }).join('');
  const parcs = PARCS.map(p => '<path class="ck-pa et-' + etatVue(S.vue, p.id) + (p.f ? '' : ' sans-contour') + '" data-id="' + p.id + '" d="' + dParc(p) + '"'
    + (p.arr ? ' aria-label="' + esc(p.nom) + ', arrachée"' : ' tabindex="0" role="button" aria-label="' + esc(p.nom) + '"') + '/>').join('');
  const rangs = PARCS.filter(p => p.f && !p.arr).map(p => '<path class="ck-pr" id="ck-pr-' + p.id + '" d="' + dParc(p) + '" fill="url(#ck-rg-' + fa(p.f.ang) + ')"/>').join('');
  // Une toute petite parcelle garde une cible de 24 px au doigt.
  const cibles = PARCS.filter(p => p.box[2] < 24 && p.box[3] < 24).map(p => '<rect class="ck-pa-hit" data-id="' + p.id + '" x="' + f1(p.cx - 12) + '" y="' + f1(p.cy - 12) + '" width="24" height="24"/>').join('');
  return '<svg class="ck-svg" id="ck-svg" viewBox="0 0 ' + PLAN_W + ' ' + PLAN_H + '" width="' + PLAN_W + '" height="' + PLAN_H + '" role="group" aria-label="Plan des parcelles à l’échelle, rangées par appellation">'
    + '<defs>' + defs + '</defs><g class="ck-zones">' + zones + '</g><g class="ck-parcs">' + parcs + '</g><g id="ck-flash"></g>'
    + '<g class="ck-rangs">' + rangs + '</g><g class="ck-cibles">' + cibles + '</g><path id="ck-survol" d=""/><path id="ck-sel" d=""/></svg>';
}
const LEG = [['faite', 'Faites'], ['cours', 'En cours'], ['afaire', 'À faire'], ['retard', 'En retard'], ['arr', 'Arrachée'], ['hors', 'Pas concernées']];
function htmlPlan() {
  return '<header class="ck-p-hd"><div><h2 class="ck-titre-p">Le domaine en direct' + btnI('plan', 'Comment lire le plan') + '</h2>'
    + '<p class="ck-cadre" id="ck-plan-cadre"></p></div>'
    + '<div class="ck-seg" role="tablist" aria-label="Tâche affichée sur le plan">'
    + TACHES.map(t => '<button type="button" role="tab" data-t="' + t.id + '" aria-selected="' + (t.id === S.vue) + '">' + esc(t.nom) + '</button>').join('')
    + '<span class="ck-seg-ind" aria-hidden="true"></span></div></header>'
    + '<div class="ck-carte" id="ck-carte"><div class="ck-carte-in" id="ck-carte-in"><div class="ck-svg-boite" id="ck-svg-boite"></div>'
    + '<div class="ck-calque" id="ck-calque"></div></div></div>'
    + '<button type="button" class="ck-plan-tout" id="ck-plan-tout" aria-expanded="false" hidden></button>'
    + '<div class="ck-plan-pied"><div class="ck-leg" role="group" aria-label="Filtrer le plan par état">'
    + LEG.map(([k, l]) => '<button type="button" class="ck-leg-i" data-f="' + k + '" aria-pressed="false"' + (k === 'hors' ? ' hidden' : '') + '><i class="sw sw-' + k + '"></i>' + l + ' <b id="ck-leg-' + k + '" data-v="0">0</b></button>').join('')
    + '</div><div class="ck-echelle" id="ck-echelle" aria-hidden="true"></div></div>'
    + '<p class="ck-plan-note" id="ck-plan-note" hidden></p>';
}
// L'échelle et le nord sous le plan : la promesse « à l'échelle » se lit, elle ne se croit pas sur parole.
function majEchelle() {
  const el = $('#ck-echelle'); if (!el) return;
  const pas = typeof window._mvFormePas === 'function' ? window._mvFormePas(PLAN_S, 56, 130) : 100, L = Math.round(pas * PLAN_S);
  const lib = typeof window._mvFormeMetres === 'function' ? window._mvFormeMetres(pas) : pas + '\u202fm';
  el.innerHTML = '<svg width="14" height="26" viewBox="0 0 14 26"><text class="ck-ech-t" x="7" y="5" text-anchor="middle" dominant-baseline="middle">N</text><path class="ck-ech-l" d="M7 25V12M4 15l3-3.5 3 3.5"/></svg>'
    + '<svg width="' + (L + 2) + '" height="26" viewBox="0 0 ' + (L + 2) + ' 26"><text class="ck-ech-t" x="' + (L / 2 + 1) + '" y="10" text-anchor="middle" dominant-baseline="middle">' + lib + '</text>'
    + '<path class="ck-ech-l" d="M1 19V24H' + (L + 1) + 'V19"/></svg>';
}
// Les parcelles sans contour : dessinées en carré de leur surface, et le plan le dit.
function majNote() {
  const el = $('#ck-plan-note'); if (!el) return;
  const sans = PARCS.filter(p => !p.f), n = sans.length;
  if (!n) { el.hidden = true; return; }
  const noms = sans.map(p => p.nom), liste = n <= 3 ? (n === 1 ? noms[0] : noms.slice(0, -1).join(', ') + ' et ' + noms[n - 1]) : n + ' parcelles';
  el.innerHTML = '<i aria-hidden="true"></i><span>' + (n === PARCS.length ? 'Aucun contour enregistré pour ce domaine : chaque parcelle est un carré de sa surface. Les contours se chargent à l’installation.'
    : esc(liste) + (n > 1 ? ' n’ont' : ' n’a') + ' pas de contour : ' + (n > 1 ? 'dessinées' : 'dessinée') + ' en carré de ' + (n > 1 ? 'leur' : 'sa') + ' surface.') + '</span>';
  el.hidden = false;
}
// Sur une seule colonne (téléphone), le plan se replie sous ses premières appellations ; « Tout le plan » ouvre le reste.
function majPli() {
  const c = $('#ck-carte'), b = $('#ck-plan-tout'); if (!c || !b) return;
  let pli = 0;
  if (mesuresPlan(PLAN_W).p) APPS.forEach((a, i) => { const bas = a.f[1] + a.f[3]; if (i === 0 || bas <= 380) pli = Math.max(pli, bas); });
  if (!pli || PLAN_H <= pli + 80) { c.classList.remove('plie'); b.hidden = true; return; }
  c.style.setProperty('--pli', Math.ceil(pli + 10) + 'px');
  c.classList.toggle('plie', !S.planTout);
  b.hidden = false; b.setAttribute('aria-expanded', String(!!S.planTout));
  b.textContent = S.planTout ? 'Replier le plan' : 'Tout le plan (' + APPS.length + ' appellations)';
}
// Le dessin, à la largeur réelle : au montage, puis à chaque largeur nouvelle (ranger).
let planEssais = 0;
function dessinerPlan(force) {
  const boite = $('#ck-carte-in'), sb = $('#ck-svg-boite'); if (!boite || !sb) return;
  const W = Math.round(boite.clientWidth);
  // ★ AUJ-5 (§307) : la case du plan n'a pas encore sa largeur (onglet qui revient, page qui s'affiche) — on réessaie aux
  //   images suivantes au lieu de laisser le plan vide jusqu'au prochain redimensionnement de la page.
  if (W < 120) { if (planEssais++ < 30) requestAnimationFrame(() => dessinerPlan(true)); return; }
  planEssais = 0;
  if (!force && Math.abs(W - PLAN_LARG) < 4 && sb.firstChild) return;
  disposer(W);
  sb.innerHTML = svgPlan();
  majEchelle(); majNote(); majPli(); majPlan(); survoler(null);
}

function equipesHtml(t) {
  const eqs = S.equipes.filter(e => e.parc && e.tache === t);
  if (!eqs.length) return '';
  return '<span class="ck-ch-eq" title="' + esc(eqs.map(e => EQ[e.id].noms).join(', ')) + '"><span class="ck-pt-vif" aria-hidden="true"></span>'
    + eqs.map(e => '<span class="ck-duo">' + EQ[e.id].ini.map(i => '<span class="ck-av ck-av-s">' + i + '</span>').join('') + '</span>').join('')
    + '<span class="ck-sr">' + eqs.length + ' équipe' + (eqs.length > 1 ? 's' : '') + ' sur une parcelle en cours</span></span>';
}
// ★ CHANT-1 (§316) : la liste arrive rangée par le modèle (pilotage.js, _mvOrdreChantiers) — à faire ou en cours par date de
//   début, l'arrachage fini pour l'équipe, puis les terminés. Ce que la fenêtre ajoute : passée sans être fini, ou la suite au prestataire.
const suiteFen = (t, x) => x.etat === 'retard' ? ', fenêtre passée' : ((t.eqFini && x.pct < 99.95) ? ', la suite au prestataire' : '');
function htmlChantiers(r) {
  return entete('Chantiers ' + V.saisonDe, 'Par date de début, les terminés en bas')
    + '<ul class="ck-ch-l">' + TACHES.map(t => {
      const x = r.t[t.id];
      return '<li><button type="button" class="ck-ch' + (t.id === S.vue ? ' vue' : '') + '" data-t="' + t.id + '" aria-label="Afficher ' + esc(t.art) + ' sur le plan">'
        + '<span class="ck-ch-nom">' + esc(t.nom) + '<span class="ck-ch-eqw">' + equipesHtml(t.id) + '</span></span>'
        + '<span class="ck-ch-pct t-' + x.etat + '"><b data-v="0">0</b>\u202f%</span>'
        + '<span class="ck-barre"><i class="b-' + x.etat + '" style="width:0%"></i></span>'
        + '<span class="ck-ch-fen">du ' + dCourt(t.debut) + ' au ' + dCourt(t.fin) + '<span class="ck-ch-ret">' + suiteFen(t, x) + '</span></span>'
        + '<span class="ck-ch-det"><b class="ck-ch-hf" data-v="0">0</b> / ' + nb(x.hT) + '\u202fh</span></button></li>';
    }).join('') + '</ul>';
}

// ═══ DIRECT-1 (§318) — LE TRACTEUR ET « EN CE MOMENT » DANS LE FIL ═══
// Nico (12/10) : « il n'y a personne en direct », puis « aujourd'hui j'étais sur le tracteur, j'aimerais bien que ça apparaisse ».
// Le modèle (pilotage.js/_pilCk2Modele, lu dans cockpit.js/_ckTracJour) donne les événements du tracteur mêlés au fil, et le
// tracteur en marche ; les parcelles en cours sont celles des pastilles (S.equipes, la même lecture).
// ⚠️ Aucun article devant l'activité : les noms sont libres (« Labour », « Semis »…), « le » ou « la » serait parfois faux.
const EV_TRAC = { trac: 1, 'trac-debut': 1, traite: 1 };
const dureeTxt = m => { const r = Math.max(1, Math.round(m)); if (r < 60) return r + '\u00a0min'; const h = Math.floor(r / 60), x = r % 60; return h + '\u00a0h' + (x ? '\u00a0' + String(x).padStart(2, '0') : ''); };
const listeTxt = l => l.length > 1 ? l.slice(0, -1).join(', ') + ' et ' + l[l.length - 1] : (l[0] || '');
function texteTrac(e) {
  const qui = (e.eq && EQ[e.eq] && EQ[e.eq].noms) || 'Quelqu’un', act = e.act ? maj1(e.act) : 'Tracteur', n = e.parcs.length;
  if (e.type === 'traite') return { titre: qui + ' a traité', sous: n > 2 ? n + '\u00a0parcelles' : (listeTxt(e.parcs) || act) };
  if (e.type === 'trac-debut') return { titre: qui + ' a pris le tracteur', sous: act + (e.trac ? ', ' + e.trac : '') };
  return { titre: qui + ' a fini ' + (n > 1 ? n + '\u00a0parcelles' : (e.parcs[0] || 'une parcelle')),
    sous: act + ' au tracteur' + (n > 1 ? '\u00a0: ' + listeTxt(e.parcs) : '') + (e.m ? ', ' + dureeTxt(e.m) : '') };
}
// « En ce moment » : les parcelles en cours (commencée le plus récemment d'abord), puis le tracteur en marche ou en pause.
function coursItems() {
  const v = S.equipes.filter(e => e.parc && PIDX[e.parc] && T[e.tache]).slice()
    .sort((a, b) => String(b.depuis || '').localeCompare(String(a.depuis || '')));
  return v.map(e => ({ k: 'v', e })).concat(S.trac.map(x => ({ k: 't', e: x })));
}
function htmlCoursLi(c) {
  const eq = EQ[c.e.id] || { noms: '', ini: ['?'] }, anonyme = !eq.noms || (eq.ini.length === 1 && eq.ini[0] === '?');
  const ic = '<span class="ck-duo">' + eq.ini.map(i => '<span class="ck-av">' + esc(i) + '</span>').join('') + '</span>';
  let t, s, tag = 'En cours';
  if (c.k === 'v') {
    const p = PIDX[c.e.parc], tt = T[c.e.tache];
    t = anonyme ? maj1(tt.art) + ' en cours' : eq.noms + ' sur ' + tt.art;
    s = [p.nom, quand(c.e.depuis), anonyme ? 'personne d’indiqué' : ''].filter(Boolean).join(', ');   // DIRECT-2 : sans jour connu, pas de date
  } else {
    t = (anonyme ? 'Quelqu’un' : eq.noms) + ' au tracteur';
    s = [c.e.act ? maj1(c.e.act) : 'Tracteur', listeTxt(c.e.parcs), c.e.ts ? (c.e.pause ? 'en pause depuis ' : 'depuis ') + heureTxt(c.e.ts) : (c.e.pause ? 'en pause' : '')].filter(Boolean).join(', ');
    if (c.e.pause) tag = 'En pause';
  }
  return '<li class="ck-ev ck-ev-cours"><span class="ck-ev-ic">' + ic + '</span><span class="ck-ev-tx"><span class="ck-ev-t">' + esc(t) + '</span>'
    + '<span class="ck-ev-s">' + esc(s) + '</span></span><span class="ck-ev-d"><span class="ck-ev-tag">' + tag + '</span></span></li>';
}
const videFil = n => n ? 'Rien de validé ni de commencé aujourd’hui pour l’instant.'
  : 'Rien encore aujourd’hui. Les parcelles en cours, les validations, les débuts de chantier et le tracteur s’afficheront ici.';
function texteEv(e) {
  if (EV_TRAC[e.type]) return texteTrac(e);   // DIRECT-1 (§318)
  const p = PIDX[e.pid], tt = T[e.t];
  const qui = e.eq ? EQ[e.eq].noms : 'Vous';
  // PRO-1 (§269) : « Nico ont validé » — le pluriel seulement quand ils sont plusieurs.
  const pl = !!(e.eq && EQ[e.eq].ini && EQ[e.eq].ini.length > 1);
  const verbe = e.type === 'valide' ? (e.eq ? (pl ? 'ont validé ' : 'a validé ') : 'avez validé ') : (e.eq ? (pl ? 'ont commencé ' : 'a commencé ') : 'avez commencé ');
  return { titre: qui + ' ' + verbe + tt.art, sous: e.type === 'valide' ? p.nom + ', ' + haTxt(p.ha) : p.nom };
}
function htmlEv(e) {
  const tx = texteEv(e);
  const ic = e.eq ? '<span class="ck-duo">' + EQ[e.eq].ini.map(i => '<span class="ck-av">' + esc(i) + '</span>').join('') + '</span>'
    : '<span class="ck-ic-rond ck-ic-vous">' + ICO.ok + '</span>';
  // DIRECT-1 (§318) : une ligne sans heure connue (un tracteur sans geste daté) n'en affiche pas — jamais « il y a 489 000 h ».
  return '<li class="ck-ev ck-ev-' + e.type + '" data-id="' + e.id + '"><span class="ck-ev-ic">' + ic + '</span>'
    + '<span class="ck-ev-tx"><span class="ck-ev-t">' + esc(tx.titre) + '</span><span class="ck-ev-s">' + esc(tx.sous) + (e.par === 'vous' && e.eq ? ', validé par vous' : '') + '</span></span>'
    + '<span class="ck-ev-d">' + (e.ts ? '<time data-ts="' + e.ts + '">' + ilYa(e.ts) + '</time>' : '') + (e.type === 'valide' ? '<span class="ck-ev-h">+' + nb(e.h) + '\u202fh</span>' : '') + '</span></li>';
}
// ★ DIRECT-1 (§318) : « En ce moment » (qui est où : parcelles en cours, tracteur), puis la journée. Nico (12/10) : « il n'y a
//   personne en direct » — le fil ne lisait que le journal du jour, une équipe sur une parcelle commencée la veille n'y était pas.
function htmlFil() {
  const C = coursItems(), n = S.evts.length;
  return '<header class="ck-p-hd"><div><h2 class="ck-titre-p"><span class="ck-pt-vif ck-pt-fil" aria-hidden="true"></span>En direct' + btnI('fil', 'Comment lire « En direct »') + '</h2>'
    + '<p class="ck-cadre">Qui est où en ce moment, et ce que l’équipe fait aujourd’hui</p></div></header>'
    + '<p class="ck-fil-sec" id="ck-fil-sec-c"' + (C.length ? '' : ' hidden') + '>En ce moment</p>'
    + '<ul class="ck-fil-c" id="ck-fil-c">' + C.map(htmlCoursLi).join('') + '</ul>'
    + '<p class="ck-fil-sec" id="ck-fil-sec-j"' + (C.length ? '' : ' hidden') + '>Aujourd’hui</p>'
    + '<ol class="ck-fil-l' + (S.filTout ? ' tout' : '') + '" id="ck-fil-l">' + S.evts.map(htmlEv).join('') + '</ol>'
    + '<p class="ck-vide" id="ck-fil-vide"' + (n ? ' hidden' : '') + '>' + videFil(C.length) + '</p>'
    + '<button type="button" class="ck-btn ck-btn-ghost ck-btn-s ck-fil-tout" id="ck-fil-tout" aria-expanded="' + S.filTout + '"' + (n > 4 ? '' : ' hidden') + '>' + (S.filTout ? 'Replier' : 'Tout le fil') + '</button>';
}

/* ── Les graphes — grammaire du kit (MV_GRAPH_COL) : la mesure en terre, le prévu en or,
   le fait en vert, le repère du jour en rouge, tout texte en texte-doux, une unité = un pixel. ── */
function cadre(w, ymax, grand, x0) {
  // PRO-1 (§269) : en grand (« Agrandir »), la hauteur suit l'écran.
  const etroit = w < 560, h = grand ? Math.round(Math.max(300, Math.min(window.innerHeight * .62, w * .5))) : (etroit ? 230 : 270);
  const c = { w, h, etroit, padL: etroit ? 40 : 58, padR: 18, padT: 34, padB: 30, ymax, D0: x0 || DEBUT };   // D0 (AUJ-5) : le début de l'axe
  c.iw = w - c.padL - c.padR; c.ih = h - c.padT - c.padB;
  c.X = d => c.padL + (d - c.D0) / (XMAX - c.D0) * c.iw;
  c.Y = v => c.padT + c.ih * (1 - v / ymax);
  return c;
}
// PRO-1 (§269) : un pas rond (1, 2, 2,5 ou 5 × 10ⁿ). Les graduations étaient celles de la démonstration (0 à 2 500).
function pasNet(max, n) {
  const brut = Math.max(1, max) / Math.max(1, n), p = Math.pow(10, Math.floor(Math.log10(brut))), q = brut / p;
  return (q <= 1 ? 1 : q <= 2 ? 2 : q <= 2.5 ? 2.5 : q <= 5 ? 5 : 10) * p;
}
const f1 = v => v.toFixed(1);
function moisReperes(d0 = DEBUT) {
  const r = [[d0, MOIS_C[d0.getUTCMonth()]]];
  for (let d = J(d0.getUTCFullYear(), d0.getUTCMonth() + 2, 1); d <= XMAX; d = J(d.getUTCFullYear(), d.getUTCMonth() + 2, 1)) r.push([d, MOIS_C[d.getUTCMonth()]]);
  return r;
}
function axes(c, ticks, unite) {
  let s = '';
  ticks.forEach(v => {
    s += '<line class="ck-c-gl" x1="' + c.padL + '" x2="' + (c.w - c.padR) + '" y1="' + f1(c.Y(v)) + '" y2="' + f1(c.Y(v)) + '"/>'
      + '<text class="ck-c-txt" x="' + (c.padL - 8) + '" y="' + f1(c.Y(v) + 4) + '" text-anchor="end">' + nb(v) + (v === ticks[ticks.length - 1] ? '\u202f' + unite : '') + '</text>';
  });
  // PRO-1 (§269) : un mois n'a son étiquette que s'il laisse la place à sa voisine (« sept. » et « oct. » se
  //   recouvraient au téléphone ; la maquette retirait « mars » en dur pour ses propres dates).
  const ecart = c.etroit ? 30 : 38, L = moisReperes(c.D0); let der = -1e9;
  L.forEach(([d, l], k) => {
    const x = c.X(d);
    if (x < c.padL - 1 || x > c.w - c.padR - 14) return;
    if (k === 0 && L[1] && c.X(L[1][0]) - x < ecart) return;
    if (x - der < ecart) return;
    der = x;
    s += '<text class="ck-c-txt" x="' + f1(x + 2) + '" y="' + (c.h - c.padB + 18) + '">' + l + '</text>';
  });
  const xv = c.X(VISEE), xa = c.X(AUJ), bord = x => x < c.padL + 36 ? 'start' : (x > c.w - c.padR - 36 ? 'end' : 'middle'), proches = Math.abs(xv - xa) < 84;
  s += '<line class="ck-c-visee" x1="' + f1(xv) + '" x2="' + f1(xv) + '" y1="' + (c.padT - 8) + '" y2="' + (c.h - c.padB) + '"/>'
    + '<text class="ck-c-txt" x="' + f1(xv) + '" y="' + (c.padT - (proches ? 26 : 14)) + '" text-anchor="' + bord(xv) + '">objectif</text>'
    + '<line class="ck-c-auj" x1="' + f1(xa) + '" x2="' + f1(xa) + '" y1="' + (c.padT - 8) + '" y2="' + (c.h - c.padB) + '"/>'
    + '<text class="ck-c-txt" x="' + f1(xa) + '" y="' + (c.padT - 14) + '" text-anchor="' + bord(xa) + '">aujourd’hui</text>';
  return s;
}
const G = { c: null, w: 0, reste: null, fin: null };
// AUJ-5 (§307) : l'axe de la charge restante part de la première mesure (deux jours avant), jamais avant la période ; sans
//   photo, d'une semaine avant aujourd'hui. Il partait du début de la période : les quelques jours mesurés formaient une
//   bande remplie, collée à « aujourd'hui » — la « colonne » que Nico a vue (10/10).
function debutCourbe() {
  const m = HIST.filter(o => o.d >= DEBUT && o.d < AUJ).reduce((a, o) => (!a || o.d < a ? o.d : a), null);
  const d0 = m ? ajout(m, -2) : ajout(AUJ, -7);
  return d0 > DEBUT ? d0 : DEBUT;
}
function htmlCourbe(w) {
  const pas = pasNet(TOTAL, w < 560 ? 3 : 5), ymax = Math.max(pas, Math.ceil(TOTAL / pas) * pas), ticks = [];
  for (let v = 0; v <= ymax + 1e-6; v += pas) ticks.push(v);
  const c = cadre(w, ymax, G.grand, debutCourbe()); G.c = c; G.w = w;
  let s = axes(c, ticks, 'h');
  s += '<path id="ck-c-besoin" class="ck-c-besoin"/><path id="ck-c-proj" class="ck-c-proj"/>'
    + '<path id="ck-c-ligne" class="ck-c-ligne"/><circle id="ck-c-pt" class="ck-c-pt" r="4.5"/>'
    + '<g id="ck-c-fin"><rect class="ck-c-fin" x="-5" y="-5" width="10" height="10" rx="1.5" transform="rotate(45)"/><text id="ck-c-fin-l" class="ck-c-txt ck-c-fin-l" y="-13" text-anchor="middle"></text></g>'
    + '<line id="ck-c-guide" class="ck-c-guide" y1="' + c.padT + '" y2="' + (c.h - c.padB) + '"/><circle id="ck-c-gpt" class="ck-c-gpt" r="4"/>'
    + '<rect class="ck-c-zone" x="' + c.padL + '" y="0" width="' + c.iw + '" height="' + c.h + '"/>';
  return '<svg viewBox="0 0 ' + c.w + ' ' + c.h + '" width="' + c.w + '" height="' + c.h + '" role="img" aria-label="Charge restante de la campagne : mesurée jusqu’à aujourd’hui, puis projetée jusqu’à la fin prévue">' + s + '</svg>'
    + '<div class="ck-tip" id="ck-tip" aria-hidden="true"></div>';
}
function dessinerCourbe(reste, fin) {
  const c = G.c; if (!c || !$('#ck-c-ligne')) return;   // AUJ-6 : jamais dans une boîte pas encore dessinée
  const pts = HIST.filter(o => o.d < AUJ && o.d >= c.D0).map(o => [c.X(o.d), c.Y(o.r)]);
  pts.push([c.X(AUJ), c.Y(reste)]);
  const ligne = pts.length > 1 ? 'M' + pts.map(p => f1(p[0]) + ' ' + f1(p[1])).join('L') : '';
  const y0 = c.Y(0), xa = c.X(AUJ), ya = c.Y(reste), xf = c.X(fin), xv = c.X(VISEE);
  $('#ck-c-ligne').setAttribute('d', ligne);
  // ★ AUJ-6 (§308) : le reste mesuré est une LIGNE seule, puis le point du jour (#ck-c-pt). Les ronds d'AUJ-5, un par photo,
  //   s'empilaient en « oooo » sur les premiers jours d'un axe de huit mois, et des photos à 0 h (prises avant l'arrivée des
  //   données) tiraient des traits verticaux : cockpit.js/_ckChargeSerie les écarte, pilotage.js/_pilPhotoEcrire ne les prend plus.
  $('#ck-c-proj').setAttribute('d', 'M' + f1(xa) + ' ' + f1(ya) + 'L' + f1(xf) + ' ' + f1(y0));
  // VIF-1 : un objectif déjà passé n'a pas d'allure à tenir — la ligne partait vers la gauche, sur la colonne voisine.
  $('#ck-c-besoin').setAttribute('d', VISEE > AUJ ? 'M' + f1(xa) + ' ' + f1(ya) + 'L' + f1(xv) + ' ' + f1(y0) : '');
  const pt = $('#ck-c-pt'); pt.setAttribute('cx', f1(xa)); pt.setAttribute('cy', f1(ya));
  $('#ck-c-fin').setAttribute('transform', 'translate(' + f1(xf) + ' ' + f1(y0) + ')');
  const fl = $('#ck-c-fin-l'); if (fl) fl.setAttribute('text-anchor', xf > c.w - c.padR - 30 ? 'end' : 'middle');
}

/* ══ VUE ÉCONOMIE ══ */
function htmlEVerdict(r) {
  return '<div class="ck-v-haut"><span class="ck-v-k">Atterrissage de la campagne</span><span class="ck-etat" id="ck-ev-etat"></span></div>'
    + '<h2 class="ck-v-phrase">La campagne devrait coûter <span class="ck-roule" id="ck-ev-att"><span>' + eur(r.att) + '</span></span>.</h2>'
    + '<p class="ck-v-sous"><span id="ck-ev-sous"></span>' + btnI('atterrissage', 'Comment l’atterrissage est calculé') + '</p>'
    + '<div class="ck-frise ck-frise-e" id="ck-efrise" aria-hidden="true">'
    + '<div class="ck-fr-piste"><i class="ck-fr-dep"></i><i class="ck-fr-reste"></i><i class="ck-fr-marge"></i></div>'
    + '<span class="ck-fr-mk ck-fr-mdep"><em id="ck-ef-dep"></em></span>'
    + '<span class="ck-fr-mk ck-fr-fin"><em id="ck-ef-att"></em></span>'
    + '<span class="ck-fr-mk ck-fr-visee"><em id="ck-ef-bud"></em></span></div>'
    + '<div class="ck-v-act"><button class="ck-btn ck-btn-pri" type="button" data-onglet="eco">Ouvrir l’Économie</button>'
    + '<button class="ck-btn ck-btn-ghost" type="button" data-fn="export">Exporter pour la compta</button></div>';
}
function htmlEKpis(r) {
  const k = (id, lab, num, vis, cadreTxt, info) => '<div class="ck-ph ck-ek" data-ek="' + id + '">'
    + '<div class="ck-ph-l"><span>' + lab + '</span>' + btnI(info, 'Comment ce chiffre est calculé') + '</div>'
    + '<div class="ck-ph-m"><span class="ck-ph-n">' + num + '</span><span class="ck-ph-vis">' + vis + '</span></div>'
    + '<p class="ck-cadre">' + cadreTxt + '</p></div>';
  return '<div class="ck-ek-g">'
    + k('coutha', 'Coût à l’hectare', '<b id="ck-ek-ha" data-v="0">0</b><small>\u202f€/ha</small>', '', '<span id="ck-ek-ha-c">prévu : ' + nb(r.coutHaPrevu) + '\u202f€/ha</span>', 'coutha')
    + k('ecart', 'Écart au barème', '<b id="ck-ek-ec">' + pct1(r.ecartMoy * 100) + '</b>', spark(SPARK_ECART, 'haut'), 'heures réelles face au barème', 'ecart')
    + k('cadence', 'Cadence de l’équipe', '<b>' + nb(r.capMoy) + '</b><small>\u202fh/j</small>', '', '<span id="ck-ek-cad-c">il en faut ' + nb(r.besoin) + ' pour finir le ' + dLong(VISEE) + '</span>', 'cadence')
    + (function () { const x = (V.eco || {}).inaction; const ok = !x || !(x.h > 1);
        return k('inaction', 'Coût de l’inaction', ok ? '<b class="ck-ek-calme">Rien à rattraper</b>' : '<b>+\u202f' + nb(x.h) + '</b><small>\u202fh</small>', '',
          ok ? 'les travaux tiennent dans leurs fenêtres' : 'env. ' + eur100(x.eur) + ' si rien n’est décidé' + (x.horsDelai ? ', ' + x.horsDelai + ' tâche' + (x.horsDelai > 1 ? 's' : '') + ' hors délai' : ''), 'inaction'); })()
    + '</div>';
}
const GE = { c: null, w: 0, att: null, fin: null };
// ★★ AUJ-7 (§309) — LE GRAPHE « DÉPENSÉ FACE AU FAIT », DATÉ PAR LE MOTEUR. Deux courbes en %, du début de la période à aujourd'hui,
//   qui ne font que monter : le budget main-d'œuvre PAYÉ (heures du planning au jour où elles ont été faites, hors travaux à
//   l'heure) et le travail FAIT au barème (à la date des validations). Plus d'aire verte entre les deux : elle formait des
//   colonnes et ne disait rien (Nico, 10/10). L'échelle monte au-delà de 100 % quand la fin prévue dépasse le budget.
let SERIE_E = [];
const attPct = r => (r && r.moBudget ? r.moAtt / r.moBudget * 100 : 100);
const finSerieE = () => SERIE_E[SERIE_E.length - 1] || { d: AUJ, fait: R ? R.pct : 0, dep: R ? R.budgetPct : 0 };   // sans planning : les chiffres du jour seuls
function htmlEChart(w) {
  const at = attPct(R), ymax = Math.ceil(Math.max(100, at, ...SERIE_E.map(o => o.dep)) / 25) * 25;
  const c = cadre(w, ymax); GE.c = c; GE.w = w;
  const pas = (c.etroit || ymax > 150) ? 50 : 25, gr = []; for (let v = 0; v <= ymax + .01; v += pas) gr.push(v);
  let s = axes(c, gr, '%');
  s += '<line class="ck-e-budget" x1="' + c.padL + '" x2="' + (c.w - c.padR) + '" y1="' + f1(c.Y(100)) + '" y2="' + f1(c.Y(100)) + '"/>'
    + '<path id="ck-e-pfait" class="ck-e-pfait"/><path id="ck-e-pdep" class="ck-e-pdep"/>'
    + '<path id="ck-e-fait" class="ck-e-fait"/><path id="ck-e-dep" class="ck-e-dep"/>'
    + '<g id="ck-e-bout"><circle class="ck-e-bf" r="4.5"/><text class="ck-c-txt ck-e-lf" text-anchor="end" x="-9" y="4">100 % fait</text></g>'
    + '<g id="ck-e-bout2"><rect class="ck-c-fin" x="-5" y="-5" width="10" height="10" rx="1.5" transform="rotate(45)"/><text id="ck-e-ld" class="ck-c-txt ck-e-ld" text-anchor="end" x="-10" y="16"></text></g>'
    + '<line id="ck-e-guide" class="ck-c-guide" y1="' + c.padT + '" y2="' + (c.h - c.padB) + '"/>'
    + '<rect class="ck-c-zone" x="' + c.padL + '" y="0" width="' + c.iw + '" height="' + c.h + '"/>';
  return '<svg viewBox="0 0 ' + c.w + ' ' + c.h + '" width="' + c.w + '" height="' + c.h + '" role="img" aria-label="Main-d’œuvre : part du budget payée face à la part du travail faite, du début de la période à aujourd’hui, puis projetées jusqu’à la fin prévue">' + s + '</svg>'
    + '<div class="ck-tip" id="ck-etip" aria-hidden="true"></div>';
}
function dessinerEChart(at, fin) {
  const c = GE.c; if (!c || !$('#ck-e-fait')) return;   // AUJ-6 : la boîte d'un montage neuf est vide tant qu'elle n'est pas dessinée
  const pts = SERIE_E.filter(o => o.d >= c.D0 && o.d <= AUJ), z = finSerieE();
  const ch = L => L.length > 1 ? 'M' + L.map(o => f1(o[0]) + ' ' + f1(o[1])).join('L') : '';
  $('#ck-e-fait').setAttribute('d', ch(pts.map(o => [c.X(o.d), c.Y(o.fait)])));
  $('#ck-e-dep').setAttribute('d', ch(pts.map(o => [c.X(o.d), c.Y(o.dep)])));
  const xa = c.X(z.d), xf = c.X(fin);
  $('#ck-e-pfait').setAttribute('d', 'M' + f1(xa) + ' ' + f1(c.Y(z.fait)) + 'L' + f1(xf) + ' ' + f1(c.Y(100)));
  $('#ck-e-pdep').setAttribute('d', 'M' + f1(xa) + ' ' + f1(c.Y(z.dep)) + 'L' + f1(xf) + ' ' + f1(c.Y(at)));
  $('#ck-e-bout').setAttribute('transform', 'translate(' + f1(xf) + ' ' + f1(c.Y(100)) + ')');
  $('#ck-e-bout2').setAttribute('transform', 'translate(' + f1(xf) + ' ' + f1(c.Y(at)) + ')');
  const ld = $('#ck-e-ld'); ld.textContent = nb(at) + '\u202f% du budget'; ld.setAttribute('y', at > 100 ? -10 : 16);   // au-dessus du losange quand il passe le budget
}
// ★★ AUJ-7 (§309) — « PAR POSTE » NE DIT QUE CE QUI EST CALCULÉ. À droite : l'écart prévu de la main-d'œuvre et de toute la
//   campagne (jamais « 0 » ni « −0 » : « au budget ») ; pour le tracteur, le GNR, le phyto : ce qui reste à dépenser d'après
//   l'avancement ; pour les prestations et les travaux à l'heure : ce qu'ils ont coûté, sans prévu. Le trait de fin ne reste que
//   sur la main-d'œuvre : sur les autres postes il tombait au bout du budget et ne disait rien (Nico, 10/10).
const ecartTxt = v => { const n = Math.round(v); return n === 0 ? 'au budget' : signe(n) + '\u202f€'; };
const tauxH = v => Number(v || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + '\u202f€';
const echPoste = l => Math.max(l.budget, l.att || 0, l.dep) * 1.06 || 1;
function lignePoste(l) {
  const ech = echPoste(l), w = v => (v / ech * 100).toFixed(1) + '%';
  let droite, cls = 'neutre', barre = '', gauche;
  if (l.ref === 'ecart') {
    droite = ecartTxt(l.att - l.budget); cls = Math.round(l.att - l.budget) <= 0 ? 'ok' : 'ko'; gauche = eur(l.dep) + ' sur ' + eur(l.budget);
    barre = '<div class="ck-puce"><i class="bud" style="width:' + w(l.budget) + '"></i><i class="dep" id="ck-po-b-' + l.id + '" style="width:0%"></i><i class="att' + (Math.round(l.att - l.budget) > 0 ? ' ko' : '') + '" id="ck-po-a-' + l.id + '" style="left:' + w(l.att) + '"></i></div>';   // au-delà du budget, le trait passe en orange
  } else if (l.ref === 'proj') {
    droite = 'reste ' + eur(l.budget - l.dep); gauche = eur(l.dep) + ' sur ' + eur(l.budget) + ' prévus';
    barre = '<div class="ck-puce"><i class="bud" style="width:' + w(l.budget) + '"></i><i class="dep" id="ck-po-b-' + l.id + '" style="width:0%"></i></div>';
  } else {
    droite = eur(l.dep); gauche = l.id === 'hb' ? 'payé à l’heure, sans barème' : l.id === 'pre' ? 'facturé, sans prévu' : 'pas encore de prévu';
  }
  return '<li class="ck-po" data-po="' + l.id + '"><div class="ck-po-h"><span class="n">' + esc(l.nom) + '</span><span class="ck-po-d ' + cls + '">' + esc(droite) + '</span></div>'
    + barre + '<div class="ck-po-s"><span>' + esc(gauche) + '</span><span>' + esc(l.note || '') + '</span></div></li>';
}
const ligneMO = r => ({ id: 'mo', nom: 'Main-d’œuvre', ref: 'ecart', budget: r.moBudget, dep: r.moDep, att: r.moAtt,
  note: r.moH > 0 ? nb(r.moH) + ' h dans les rangs, ' + tauxH(r.moDep / r.moH) + ' de l’heure' : '' });
function htmlPostes(r) {
  const et = Math.round(r.att - r.budget);
  return entete('Par poste', 'Dépensé, et où chaque poste devrait atterrir', 'postes')
    + '<ul class="ck-po-l">' + [ligneMO(r)].concat(POSTES).map(lignePoste).join('')
    + '<li class="ck-po ck-po-tot"><div class="ck-po-h"><span class="n">Toute la campagne</span><span class="ck-po-d ' + (et <= 0 ? 'ok' : 'ko') + '" id="ck-po-d-tot">' + esc(ecartTxt(r.att - r.budget)) + '</span></div>'
    + '<div class="ck-po-s"><span id="ck-po-s-tot">' + eur(r.dep) + ' dépensés sur ' + eur(r.budget) + '</span><span id="ck-po-a-tot">atterrissage ' + eur(r.att) + '</span></div></li></ul>';
}
// Les barres pleines s'élargissent après le montage (transition de la feuille).
function majPostes(r) {
  const fixe = l => { const ech = echPoste(l), b = $('#ck-po-b-' + l.id), a = $('#ck-po-a-' + l.id);
    if (b) b.style.width = (l.dep / ech * 100).toFixed(2) + '%'; if (a) a.style.left = ((l.att || 0) / ech * 100).toFixed(2) + '%'; };
  fixe(ligneMO(r)); POSTES.forEach(l => { if (l.ref === 'proj') fixe(l); });
}
function htmlApps(r) {
  // AUJ-7 : une appellation sans hectare en production (sa seule vigne est arrachée) ne s'affiche plus ; sans travail validé,
  //   elle dit « — » au lieu de « 0 €/ha » et sort de la comparaison.
  const LA = APPS.filter(a => r.a[a.id] && r.a[a.id].ha > 0);
  const max = Math.max(1, ...LA.map(a => r.a[a.id].coutHa));
  const tri = LA.filter(a => r.a[a.id].coutHa > 0).sort((x, y) => r.a[y.id].coutHa - r.a[x.id].coutHa), hi = tri[0], lo = tri[tri.length - 1];
  return entete('Par appellation', 'Main-d’œuvre engagée à l’hectare, à ce jour', 'apps')
    + '<ul class="ck-ap-l">' + LA.map(a => {
      const x = r.a[a.id], v = x.coutHa > 0;
      return '<li class="ck-ap"><div class="ck-ap-h"><span class="n">' + esc(a.nom) + '</span><span class="v">' + (v ? nb(x.coutHa) + '\u202f€/ha' : '—') + '</span></div>'
        + '<div class="ck-ap-b"><span class="ck-barre fine"><i class="b-terre" style="width:' + (x.coutHa / max * 100).toFixed(1) + '%"></i></span>'
        + (a.ecart != null ? '<span class="ck-ap-c ' + (a.ecart > 0.05 ? 'ko' : a.ecart < 0 ? 'ok' : '') + '">' + pct1(a.ecart * 100) + '</span>' : '') + '</div>'
        + '<div class="ck-ap-s">' + haTxt(x.ha) + ' en production' + (v ? '' : ', aucun travail validé') + '</div></li>';
    }).join('') + '</ul>'
    + (hi && lo && hi !== lo && r.a[lo.id].coutHa > 0 ? '<p class="ck-ap-note">' + esc(hi.nom) + ' a demandé ' + nb((r.a[hi.id].coutHa / r.a[lo.id].coutHa - 1) * 100) + '\u00a0% de plus à l’hectare que ' + esc(lo.nom) + ', d’après les heures validées de la campagne.</p>' : '');
}
// AUJ-7 : seules les tâches AU BARÈME qui ont du travail validé. Un travail à l'heure (arrachage…) n'a pas de barème en face, une
//   tâche pas commencée rien à comparer — elles s'affichaient à « 0,0 % », « 0 h de barème, 0 h réelles ».
const tachesE = () => TACHES.filter(t => ((V && V.eco && V.eco.ecTache) || {})[t.cle || t.nom] != null);
function htmlTaches(r) {
  const B = 10, L = tachesE(), tete = entete('Écart au barème, par tâche', 'Heures réelles face au barème, sur les parcelles validées', 'taches');
  if (!L.length) return tete + '<p class="ck-fil-vide">Aucun travail au barème validé pour l’instant : rien à comparer.</p>';
  return tete
    + '<div class="ck-ta-ax" aria-hidden="true"><span>plus rapide</span><span>barème</span><span>plus lent</span></div>'
    + '<ul class="ck-ta-l">' + L.map(t => {
      const x = r.t[t.id], e = x.ecart * 100, w = Math.min(B, Math.abs(e)) / B * 50;
      return '<li class="ck-ta" data-ta="' + t.id + '"><span class="ck-ta-n">' + esc(t.nom) + '</span>'
        + '<span class="ck-ta-b"><i class="ck-ta-zero"></i><i class="ck-ta-v ' + (e > 0 ? 'lent' : 'vite') + '" id="ck-ta-v-' + t.id + '" style="' + (e > 0 ? 'left:50%' : 'right:50%') + ';width:' + w.toFixed(1) + '%"></i></span>'
        + '<span class="ck-ta-e ' + (e > 0 ? 'lent' : 'vite') + '" id="ck-ta-e-' + t.id + '">' + pct1(e) + '</span>'
        + '<span class="ck-ta-s" id="ck-ta-s-' + t.id + '">' + nb(x.hF) + ' h de barème, ' + nb(x.hR) + ' h réelles</span></li>';
    }).join('') + '</ul>';
}

/* ═══ 8. LES MISES À JOUR — ciblées, animées, jamais un écran redessiné en entier ═══ */

const libEtat = (t, e) => ({ faite: T[t].f ? 'faite' : 'fait', cours: 'en cours', afaire: 'à faire', retard: 'en retard', arr: 'arrachée', hors: 'pas concernée' }[e]);
const COUL = { faite: 'var(--et-faite-b)', cours: 'var(--et-cours-b)', afaire: 'var(--texte-doux)', retard: 'var(--et-retard-b)', arr: 'var(--texte-doux)', hors: 'var(--texte-doux)' };

function majResume(r) {
  const n = savoirItems(r).filter(x => x.prio === 1).length;
  const temps = r.ecart > 0 ? r.ecart + ' jour' + (r.ecart > 1 ? 's' : '') + ' d’avance' : r.ecart < 0 ? -r.ecart + ' jours de retard' : 'pile à l’heure';
  const e0 = Math.round(r.sous), argent = !(V.eco && r.budget > 0) ? '' : (e0 === 0 ? 'pile dans le budget' : e0 > 0 ? eur(e0) + ' sous le budget' : eur(-e0) + ' au-dessus du budget');   // AUJ-7 : à l'euro, comme partout
  $('#ck-resume').innerHTML = '<b>' + maj1(temps) + '</b>, ' + (argent ? '<b>' + argent + '</b>, ' : '') + (n ? n + ' point' + (n > 1 ? 's' : '') + ' à anticiper.' : 'rien à anticiper.');
}
function majVerdict(r) {
  Anim.rouler($('#ck-v-fin'), dLong(r.fin));
  const ec = r.ecart, box = $('#ck-v-ecart');
  const modele = ec > 0 ? (ec > 1 ? 'av-n' : 'av-1') : ec < 0 ? (ec < -1 ? 'ap-n' : 'ap-1') : 'pile';
  if (box.dataset.m !== modele) {
    box.dataset.m = modele;
    box.innerHTML = modele === 'pile' ? 'Pile à l’objectif'
      : '<b data-v="' + Math.abs(ec) + '">' + Math.abs(ec) + '</b> jour' + (Math.abs(ec) > 1 ? 's' : '') + (ec > 0 ? ' avant' : ' après') + ' l’objectif';
    box.className = ec >= 0 ? 'ok' : 'ko';
  } else if (modele !== 'pile') Anim.compter(box.querySelector('b'), Math.abs(ec), nb, 600);
  const et = $('#ck-v-etat'), cls = ec >= 3 ? 'ok' : ec >= 0 ? 'juste' : 'ko';
  et.className = 'ck-etat ' + cls;
  et.textContent = cls === 'ok' ? 'En avance' : cls === 'juste' ? 'Dans les temps' : 'En retard';
  const f = d => Math.max(0, Math.min(1, (d - DEBUT) / (XMAX - DEBUT))) * 100;
  const a = f(AUJ), fi = f(r.fin), v = f(VISEE), q = s => $('#ck-frise ' + s);
  q('.ck-fr-passe').style.width = a + '%';
  q('.ck-fr-proj').style.left = a + '%';
  q('.ck-fr-proj').style.width = Math.max(0, fi - a) + '%';
  const m = q('.ck-fr-marge');
  m.classList.toggle('ko', fi > v);
  m.style.left = Math.min(fi, v) + '%';
  m.style.width = Math.abs(v - fi) + '%';
  q('.ck-fr-auj').style.left = a + '%';
  q('.ck-fr-fin').style.left = fi + '%';
  q('.ck-fr-visee').style.left = v + '%';
  q('.ck-fr-fin').classList.toggle('droite', fi > 70);
  // PRO-1 (§269) : la date de début cède la place à « Aujourd’hui » quand ils se touchent, et « Aujourd’hui » à
  //   l'objectif en fin de saison — les deux étiquettes du bas se recouvraient.
  q('.ck-fr-bout').classList.toggle('masque', a < 16);
  q('.ck-fr-auj').classList.toggle('gauche', a < 6);
  q('.ck-fr-auj').classList.toggle('muet', v - a < 22 && v - a > -22);
  $('#ck-fr-fin-l').textContent = 'Fin prévue, ' + dCourt(r.fin);
}
function majPhotos(r) {
  Anim.compter($('#ck-ph-trav'), r.pct);
  Anim.compter($('#ck-ph-bud'), r.budgetPct);
  $('#ck-ph-trav-c').textContent = nb(r.hF) + ' h faites sur ' + nb(r.hT) + ' h';
  const bc = $('#ck-ph-bud-c'); if (bc) bc.textContent = 'du budget main-d’œuvre dépensé, pour ' + nb(r.pct) + '\u00a0% du travail fait';   // AUJ-5 : sans taux horaire, la tuile n'existe pas
}
function majSavoir(r) {
  const box = $('#ck-savoir'); if (!box) return;
  const h = htmlSavoir(r);
  if (box.dataset.h !== h) { box.dataset.h = h; box.innerHTML = h; }
}
function majDecision(r) {
  // PRO-1 (§269) : la barre suit la tâche prioritaire NOMMÉE, et elle seule (elle montrait la première tâche pas finie).
  const id = V.prio && r.t[V.prio] ? V.prio : null, i = $('#ck-dz-prio-i'), tx = $('#ck-dz-prio-t');
  if (!id || !i || !tx) return;
  const x = r.t[id];
  i.style.width = x.pct.toFixed(2) + '%';
  tx.textContent = nb(x.pct) + '\u00a0%, ' + nb(x.hF) + ' / ' + nb(x.hT) + '\u202fh';
}
function majPlan(o = {}) {
  const t = S.vue; if (!t || !T[t]) return;
  // ★ HORS-1 (§322) : compter d'abord — la ligne « Pas concernées » de la légende n'existe que s'il y en a, et un filtre posé
  //   dessus tombe avec elle (on ne relâche pas un bouton caché).
  const n = { faite: 0, cours: 0, afaire: 0, retard: 0, arr: 0, hors: 0 };
  PARCS.forEach(p => { n[etatVue(t, p.id)]++; });
  if (S.filtre === 'hors' && !n.hors) {
    S.filtre = null; $$('.ck-leg-i').forEach(b => b.setAttribute('aria-pressed', 'false'));
    const c = $('#ck-carte'); if (c) delete c.dataset.filtre;
  }
  $$('.ck-pa').forEach(el => {
    const id = el.dataset.id, p = PIDX[id]; if (!p) return;
    const e = etatVue(t, id), on = S.filtre === e;
    const cls = 'ck-pa et-' + e + (p.f ? '' : ' sans-contour') + (on ? ' f-on' : '');
    if (el.getAttribute('class') !== cls) el.setAttribute('class', cls);
    const r = document.getElementById('ck-pr-' + id); if (r) { r.classList.toggle('f-on', on); r.classList.toggle('hors', e === 'hors'); }   // HORS-1 : pas de rangs sur un fantôme
    if (!p.arr) el.setAttribute('aria-label', p.nom + ', ' + AIDX[p.app].nom + ', ' + haTxt(p.ha) + ', ' + (e === 'hors' ? 'pas concernée par ' + T[t].art : T[t].nom.toLowerCase() + ' ' + libEtat(t, e)));
  });
  majEquipes();
  LEG.forEach(([k]) => Anim.compter($('#ck-leg-' + k), n[k], nb, 600));
  const bh = $('.ck-leg-i[data-f="hors"]'); if (bh) bh.hidden = !n.hors;   // HORS-1 : la ligne n'existe que s'il y en a
  APPS.forEach(a => {
    const x = R.a[a.id], zp = $('#ck-zp-' + a.id); if (!x || !zp) return;
    zp.style.transform = 'scaleX(' + ((x.pct || 0) / 100).toFixed(4) + ')';
    zp.setAttribute('class', 'ck-zone-prog' + (x.pct != null && x.pct >= 99.95 ? ' fini' : ''));
    const zt = $('#ck-zt-' + a.id); if (zt) zt.textContent = x.pct == null ? '\u2014' : nb(x.pct) + '\u202f%';   // la tâche est déjà dite par le sélecteur au-dessus
  });
  // ★ FORME-1 : le cadre lit la MÊME chose que les pastilles — une équipe par parcelle en cours, quel que soit le jour.
  const ici = S.equipes.filter(e => e.parc && e.tache === t).length;
  const autres = TACHES.filter(x => x.id !== t).map(x => ({ x, n: S.equipes.filter(e => e.parc && e.tache === x.id).length })).filter(z => z.n).map(z => z.n + ' sur ' + z.x.art);
  $('#ck-plan-cadre').textContent = (ici ? ici + (ici > 1 ? ' équipes' : ' équipe') + ' sur ' + T[t].art : 'Aucune parcelle en cours sur ' + T[t].art)
    + (autres.length ? ', ' + autres.join(', ') : '') + ', parcelles à l’échelle';
  if (o.onde) onde(o.onde.pid, o.onde.etat, o.onde.t);
  const sel = $('#ck-sel'); if (sel) sel.setAttribute('d', S.sel && PIDX[S.sel] ? dParc(PIDX[S.sel]) : '');
}
const JOURS_L = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
// « commencée aujourd'hui », « hier », « jeudi » (dans la semaine), « le 2 janv. »
// ★ DIRECT-2 (§328) : jour inconnu = rien. Un jour absent valait « commencée aujourd'hui » : c'était inventer une date.
function quand(d) {
  if (!d) return '';
  if (d >= iso(AUJ)) return 'commencée aujourd’hui';
  const x = deIso(d), n = Math.round((AUJ - x) / 864e5);
  if (n === 1) return 'commencée hier';
  if (n < 7) return 'commencée ' + JOURS_L[x.getUTCDay()];
  return 'commencée le ' + (x.getUTCDate() === 1 ? '1er' : x.getUTCDate()) + '\u00a0' + MOIS_C[x.getUTCMonth()];
}
function majEquipes() {
  const calque = $('#ck-calque'); if (!calque) return;
  const vis = S.equipes.filter(e => e.parc && e.tache === S.vue), aujIso = iso(AUJ);
  // AUJ-5 (§307) : la pastille de présence clignote — toutes les équipes sur une parcelle en cours, un jour travaillé au planning.
  calque.classList.toggle('vif', !!(V && V.jourTravaille !== false));
  $$('.ck-eq', calque).forEach(m => {
    if (m.classList.contains('part')) return;
    if (!vis.some(e => e.id === m.dataset.eq)) { m.classList.add('part'); setTimeout(() => m.remove(), 420); }
  });
  vis.forEach(e => {
    // La pastille reste dans le plan, même sur une parcelle au bord ; commencée un autre jour, elle passe en clair.
    const p = PIDX[e.parc], dx = 11 + 7.5 * (EQ[e.id].ini.length - 1);
    const left = (bornePl(p.cx, dx + 2, PLAN_W - dx - 2) / PLAN_W * 100) + '%', top = (bornePl(p.cy, 13, PLAN_H - 13) / PLAN_H * 100) + '%';
    let m = calque.querySelector('.ck-eq[data-eq="' + e.id + '"]:not(.part)');
    if (!m) {
      m = document.createElement('div');
      m.className = 'ck-eq neuf';
      m.dataset.eq = e.id;
      m.innerHTML = EQ[e.id].ini.map(i => '<span class="ck-av">' + esc(i) + '</span>').join('');
      m.style.left = left; m.style.top = top;
      calque.appendChild(m);
      requestAnimationFrame(() => requestAnimationFrame(() => m.classList.remove('neuf')));
    } else if (m.style.left !== left || m.style.top !== top) { m.style.left = left; m.style.top = top; }
    // DIRECT-2 (§328) : un jour inconnu n'est pas « aujourd'hui » — la pastille passe en clair, son titre n'a pas de date.
    m.classList.toggle('ancien', !(e.depuis && e.depuis >= aujIso));
    m.title = [EQ[e.id].noms, quand(e.depuis)].filter(Boolean).join(', ');
  });
}
function onde(pid, etat, t) {
  const p = PIDX[pid], calque = $('#ck-calque');
  const col = (t && t !== S.vue) ? 'var(--or)' : COUL[etat];
  ['a', 'b'].forEach(k => {
    const o = document.createElement('i');
    o.className = 'ck-onde ' + k;
    o.style.left = pX(p); o.style.top = pY(p);
    o.style.setProperty('--c', col);
    calque.appendChild(o);
    setTimeout(() => o.remove(), 1700);
  });
  if (reduit() || (t && t !== S.vue)) return;
  const fl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  fl.setAttribute('d', dParc(p));
  fl.setAttribute('class', 'ck-fl-' + etat);
  $('#ck-flash').appendChild(fl);
  fl.animate([{ opacity: .95 }, { opacity: 0 }], { duration: 1300, easing: 'cubic-bezier(.22,1,.36,1)' }).onfinish = () => fl.remove();
}
function majChantiers(r, o = {}) {
  TACHES.forEach(t => {
    const x = r.t[t.id], row = $('.ck-ch[data-t="' + t.id + '"]');
    const bar = row.querySelector('.ck-barre i'), w = x.pct.toFixed(2) + '%';
    if (bar.style.width !== w) {
      const monte = parseFloat(bar.style.width) < x.pct;
      bar.style.width = w;
      if (monte && o.reflet) Anim.reflet(row.querySelector('.ck-barre'));
    }
    bar.className = 'b-' + x.etat;
    const pc = row.querySelector('.ck-ch-pct');
    pc.className = 'ck-ch-pct t-' + x.etat;
    Anim.compter(pc.querySelector('b'), x.pct);
    Anim.compter(row.querySelector('.ck-ch-hf'), x.hF);
    row.querySelector('.ck-ch-ret').textContent = suiteFen(t, x);
    const eqw = row.querySelector('.ck-ch-eqw'), html = equipesHtml(t.id);
    if (eqw.dataset.h !== html) { eqw.dataset.h = html; eqw.innerHTML = html; }
    row.classList.toggle('vue', S.vue === t.id);
  });
}
function majCourbe(r) {
  $('#ck-gr-cadre').textContent = nb(r.reste) + ' h à faire, ' + nb(r.capMoy) + ' h par jour en moyenne d’ici la fin';
  const ca = $('#ck-agr-cadre'); if (ca) ca.textContent = $('#ck-gr-cadre').textContent;
  if (!G.c) return;
  const r0 = G.reste, f0 = G.fin, r1 = r.reste, f1v = r.fin;
  if (r0 === r1 && +f0 === +f1v) return;
  G.reste = r1; G.fin = f1v;
  Anim.tween(780, k => dessinerCourbe(lerp(r0, r1, k), new Date(lerp(+f0, +f1v, k))));
  $('#ck-c-fin-l').textContent = dCourt(f1v);
}
function majFil() {
  const ol = $('#ck-fil-l');
  const ids = new Set(S.evts.map(e => String(e.id)));
  const places = Anim.noter($$('.ck-ev', ol));
  $$('.ck-ev', ol).forEach(li => {
    if (ids.has(li.dataset.id) || li.dataset.sort) return;
    li.dataset.sort = '1';
    const h = li.getBoundingClientRect().height;
    if (reduit()) { li.remove(); return; }
    li.style.overflow = 'hidden';
    li.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0, paddingTop: '0px', paddingBottom: '0px' }],
      { duration: 380, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' }).onfinish = () => li.remove();
  });
  const nouveaux = S.evts.filter(e => !ol.querySelector('.ck-ev[data-id="' + e.id + '"]'));
  nouveaux.slice().reverse().forEach(e => {
    ol.insertAdjacentHTML('afterbegin', htmlEv(e));
    const li = ol.firstElementChild;
    li.classList.add('neuf');
    if (!reduit()) li.animate([{ opacity: 0, transform: 'translateY(-10px)' }, { opacity: 1, transform: 'none' }], { duration: 480, easing: 'cubic-bezier(.22,1,.36,1)' });
  });
  Anim.glisser(places);
  $$('.ck-ev', ol).slice(40).forEach(li => li.remove());
  const vide = $('#ck-fil-vide'); if (vide) vide.hidden = S.evts.length > 0;
  const tout = $('#ck-fil-tout'); if (tout) tout.hidden = S.evts.length <= 4;
  // DIRECT-1 (§318) : « En ce moment » se redessine en entier — quelques lignes, lues comme les pastilles.
  const C = coursItems(), cl = $('#ck-fil-c');
  if (cl) cl.innerHTML = C.map(htmlCoursLi).join('');
  ['#ck-fil-sec-c', '#ck-fil-sec-j'].forEach(q => { const x = $(q); if (x) x.hidden = !C.length; });
  filTaille(); setTimeout(filTaille, 520);   // COLLE-1 : remesurée, puis une fois les lignes neuves et sortantes posées (480 ms)
  if (vide) vide.textContent = videFil(C.length);
}
function majEco(r) {
  if (!V.eco) return;
  Anim.rouler($('#ck-ev-att'), eur(r.att));
  // ★ AUJ-7 (§309) : un seul arrondi, à l'euro, partout (la tête arrondissait à la centaine, « Par poste » à l'euro : le même
  //   chiffre s'écrivait deux fois). La phrase dit sur quoi repose le travail qui reste : la cadence mesurée, ou le barème.
  const e0 = Math.round(r.sous);
  $('#ck-ev-sous').textContent = (e0 === 0 ? 'Pile dans le budget de ' : e0 > 0 ? eur(e0) + ' sous le budget de ' : eur(-e0) + ' au-dessus du budget de ') + eur(r.budget)
    + (r.cadAppl ? ', au rythme mesuré de l’équipe.' : ', le travail restant compté au barème.');
  const et = $('#ck-ev-etat');
  et.className = 'ck-etat ' + (e0 >= 0 ? 'ok' : 'ko');
  et.textContent = e0 > 0 ? 'Sous le budget' : e0 === 0 ? 'Dans le budget' : 'Au-dessus du budget';
  const ech = Math.max(r.budget, r.att) * 1.04, f = v => Math.max(0, Math.min(100, v / ech * 100)), q = s => $('#ck-efrise ' + s);
  q('.ck-fr-dep').style.width = f(r.dep) + '%';
  q('.ck-fr-reste').style.left = f(r.dep) + '%';
  q('.ck-fr-reste').style.width = Math.max(0, f(r.att) - f(r.dep)) + '%';
  const m = q('.ck-fr-marge');
  m.classList.toggle('ko', r.att > r.budget);
  m.style.left = Math.min(f(r.att), f(r.budget)) + '%';
  m.style.width = Math.abs(f(r.budget) - f(r.att)) + '%';
  q('.ck-fr-mdep').style.left = f(r.dep) + '%';
  q('.ck-fr-fin').style.left = f(r.att) + '%';
  q('.ck-fr-visee').style.left = f(r.budget) + '%';
  q('.ck-fr-fin').classList.toggle('droite', f(r.att) > 70);
  { const _pd = r.budget ? r.dep / Math.max(r.budget, r.att) : 0, _pb = r.budget ? r.budget / Math.max(r.budget, r.att) : 1;
    $('#ck-ef-dep').textContent = Math.abs(_pb - _pd) < .4 ? '' : 'Dépensé, ' + eur(r.dep); }   // REF-2 : deux étiquettes trop proches ne se chevauchent pas
  $('#ck-ef-att').textContent = 'Atterrissage, ' + eur(r.att);
  $('#ck-ef-bud').textContent = 'Budget, ' + eur(r.budget);
  Anim.compter($('#ck-ek-ha'), r.coutHa);
  $('#ck-ek-ec').textContent = pct1(r.ecartMoy * 100);
  $('#ck-ek-cad-c').textContent = 'il en faut ' + nb(r.besoin) + ' pour finir le ' + dLong(VISEE);
  majPostes(r);   // AUJ-7 : les textes sont posés au montage ; seules les barres pleines bougent
  tachesE().forEach(t => {   // AUJ-7 : les seules tâches dessinées
    const x = r.t[t.id], e = x.ecart * 100, w = Math.min(10, Math.abs(e)) / 10 * 50;
    const v = $('#ck-ta-v-' + t.id);
    v.className = 'ck-ta-v ' + (e > 0 ? 'lent' : 'vite');
    v.style.left = e > 0 ? '50%' : '';
    v.style.right = e > 0 ? '' : '50%';
    v.style.width = w.toFixed(1) + '%';
    const te = $('#ck-ta-e-' + t.id);
    te.textContent = pct1(e);
    te.className = 'ck-ta-e ' + (e > 0 ? 'lent' : 'vite');
    $('#ck-ta-s-' + t.id).textContent = nb(x.hF) + ' h de barème, ' + nb(x.hR) + ' h réelles';
  });
  majEChart(r);
}
function majEChart(r) {
  if (!GE.c) return;
  const at = attPct(r);
  if (at > GE.c.ymax + .5) { redimEChart(true); return; }   // AUJ-7 : la fin prévue sort du cadre — on le redessine plus haut
  const a0 = GE.att != null ? GE.att : at, fin0 = GE.fin || r.fin;
  GE.att = at; GE.fin = r.fin;
  if (S.mode !== 'eco') { dessinerEChart(at, r.fin); return; }
  Anim.tween(720, k => dessinerEChart(lerp(a0, at, k), new Date(lerp(+fin0, +r.fin, k))));
}
function majTout(o = {}) {
  R = calc();
  majResume(R); majVerdict(R); majPhotos(R); majSavoir(R); majDecision(R); majPlan(o); majChantiers(R, o); majCourbe(R); majFil(); majEco(R);
  const live = $('#ck-live');
  if (live) { live.classList.remove('bip'); void live.offsetWidth; live.classList.add('bip'); }
}


/* ═══ 11. COUCHES FLOTTANTES : message, info, survol ═══ */
function toast(o) {
  // Le message passe par celui de l'appli.
  const t = (o && o.texte) || '';
  if (typeof window.showToast === 'function') window.showToast(t); else if (typeof window.toast === 'function') window.toast(t);
}

/* ★ BULLE-1 (§314) — les « i » d'Aujourd'hui ouvrent LA bulle de l'appli (utils.js, _mvBulleOuvrir). Celle de la maquette
   (#ck-pop) avait perdu ses règles au portage (REF-1, §266) : zéro style, le texte tombait nu en bas de la page. Il ne reste
   ici que le texte : la position, la pointe, le toucher à côté, Échap et le défilement sont ceux de toute l'appli. */
function ouvrirInfo(btn, clavier) {
  if (typeof window._mvBulleOuvrir !== 'function') { if (window.logError) window.logError({ level: 'info', cat: 'cockpit', msg: '_mvBulleOuvrir absent' }); return; }
  const k = btn.dataset.info;
  window._mvBulleOuvrir(btn, { p: [esc(INFO[k] || '')] }, { sig: '.ck-i[data-info="' + k + '"]', clavier: !!clavier });
}
// ★ FORME-1 (§301) — LA LOUPE : au survol (souris), la parcelle en grand avec ce qu'il faut savoir. Au doigt, pas de
//   loupe : le toucher ouvre la fiche, qui montre aussi la forme. Posée sur <body> (position fixe), jamais sous le doigt.
let loupeId = null;
const survolFin = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
function phraseEtat(t, pid) {
  const e = etatVue(t, pid), eq = S.equipes.find(x => x.parc === pid && x.tache === t);
  if (e === 'arr') return 'Arrachée';
  if (e === 'hors') return 'Pas concernée par ' + esc(T[t].art) + (T[t].sel ? ' (pas choisie pour cette campagne)' : ' (désactivée sur cette parcelle)');   // HORS-1 (§322)
  if (e === 'faite' && (S.presta[t] || {})[pid]) return esc(T[t].nom) + ' ' + libEtat(t, e) + ' pour l’équipe, la suite au prestataire';   // ETAT-1 (§320)
  const q = (e === 'cours' && eq) ? quand(eq.depuis) : '';   // DIRECT-2 (§328) : sans jour connu, la loupe ne date pas
  return esc(T[t].nom) + ' ' + libEtat(t, e) + (e === 'cours' && eq ? ', ' + esc(EQ[eq.id].noms) + (q ? ', <em>' + q + '</em>' : '') : '');
}
function montrerLoupe(pid, x, y) {
  const p = PIDX[pid]; if (!p || !document.getElementById('ck-page')) { cacherLoupe(); return; }
  let lp = document.getElementById('ck-loupe');
  if (!lp) { lp = document.createElement('div'); lp.id = 'ck-loupe'; lp.className = 'ck2 ck-loupe'; lp.setAttribute('role', 'tooltip'); lp.hidden = true; document.body.appendChild(lp); }
  if (loupeId !== pid) {
    loupeId = pid;
    const e = etatVue(S.vue, pid), app = AIDX[p.app].nom;
    const sous = [app, p.commune && app.toLowerCase().indexOf(p.commune.toLowerCase()) !== 0 ? p.commune : '', p.cep].filter(Boolean).join(', ');
    const fo = p.f && typeof window._mvFormeSvg === 'function' ? window._mvFormeSvg(p.f, 272, 150, { etat: e, id: 'cklp' }) : '';
    lp.innerHTML = '<div class="ck-lp-forme">' + (fo || '<p class="ck-lp-vide">Pas de contour enregistré : sur le plan, un carré de sa surface.</p>') + '</div>'
      + '<div class="ck-lp-t"><b>' + esc(p.nom) + '</b><span>' + haTxt(p.ha) + '</span></div>'
      + '<div class="ck-lp-s">' + esc(sous) + '</div>'
      + '<div class="ck-lp-e"><i class="sw sw-' + e + '"></i><span>' + phraseEtat(S.vue, pid) + '</span></div>';
  }
  lp.hidden = false;
  const w = lp.offsetWidth, h = lp.offsetHeight, vw = window.innerWidth, vh = window.innerHeight;
  let left = x + 20; if (left + w > vw - 8) left = x - 20 - w;
  lp.style.left = bornePl(left, 8, vw - w - 8) + 'px'; lp.style.top = bornePl(y - h / 2, 8, vh - h - 8) + 'px';
  requestAnimationFrame(() => lp.classList.add('ouvert'));
}
function cacherLoupe() { const lp = document.getElementById('ck-loupe'); loupeId = null; if (lp) { lp.classList.remove('ouvert'); lp.hidden = true; } }
function survoler(pid, ev) {
  const sv = $('#ck-survol'); if (!sv) { cacherLoupe(); return; }
  if (!pid) { sv.setAttribute('d', ''); cacherLoupe(); return; }
  sv.setAttribute('d', dParc(PIDX[pid]));
  if (!survolFin()) return;
  if (ev && ev.clientX != null) { montrerLoupe(pid, ev.clientX, ev.clientY); return; }
  const r = $('#ck-svg').getBoundingClientRect(), p = PIDX[pid];
  montrerLoupe(pid, r.left + p.cx / PLAN_W * r.width, r.top + p.cy / PLAN_H * r.height);
}
/* ═══ 12. NAVIGATION : tâche du plan, bascule Terrain / Économie, onglets, thème, barre latérale ═══ */
function placerInd(actif, ind) {
  if (!actif || !ind) return;
  ind.style.left = actif.offsetLeft + 'px';
  ind.style.width = actif.offsetWidth + 'px';
}
function choisirTache(t) {
  if (t === S.vue) return;
  S.vue = t;
  R = calc();
  $$('.ck-seg [role="tab"]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.t === t)));
  placerInd($('.ck-seg [aria-selected="true"]'), $('.ck-seg-ind'));
  // La vague : les parcelles changent de couleur de gauche à droite.
  if (!reduit()) $$('.ck-pa').forEach(el => { el.style.transitionDelay = Math.round(PIDX[el.dataset.id].cx / PLAN_W * 260) + 'ms'; });
  majPlan();
  majChantiers(R);
  setTimeout(() => $$('.ck-pa').forEach(el => { el.style.transitionDelay = ''; }), 900);
  survoler(null);
}
function choisirMode(m) {
  if (m === S.mode) return;
  const avant = S.mode;
  S.mode = m;
  $$('.ck-bascule [role="tab"]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.mode === m)));
  placerInd($('.ck-bascule [aria-selected="true"]'), $('.ck-bascule-ind'));
  const vIn = $('#ck-vue-' + m), vOut = $('#ck-vue-' + avant), sens = m === 'eco' ? 1 : -1;
  vOut.hidden = true;
  vIn.hidden = false;
  if (m === 'eco') { redimEChart(true); majEco(R); } else { redimCourbe(true); }
  if (!reduit()) vIn.animate([{ opacity: 0, transform: 'translateX(' + (28 * sens) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 460, easing: 'cubic-bezier(.22,1,.36,1)' });
  if (m === 'eco' && !reduit()) {
    const sv = $$('#ck-vue-eco .ck-puce .dep, #ck-vue-eco .ck-ta-v');
    sv.forEach((el, k) => el.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 700, delay: 80 + k * 40, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }));
  }
}
function choisirOnglet(k) {
  // Les onglets de la maquette sont ceux du Pilotage : on y va pour de vrai.
  const M = { camp: 'avc', equ: 'equ', sim: 'sim', eco: 'eco', conf: 'cfm', dec: 'equ', an: 'an' };
  if (typeof window._pilSetTab === 'function') window._pilSetTab(M[k] || k);
}



function voirRetard() {
  const t = TACHES.find(x => AUJ > x.fin && PARCS.some(p => !p.arr && etatVue(x.id, p.id) === 'retard'));
  if (!t) return;
  if (S.mode !== 'terrain') choisirMode('terrain');
  choisirTache(t.id);
  S.filtre = 'retard';
  $$('.ck-leg-i').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.f === 'retard')));
  const carte = $('#ck-carte'); if (carte) carte.dataset.filtre = 'retard';
  majPlan();
  $('#ck-plan').scrollIntoView({ behavior: reduit() ? 'auto' : 'smooth', block: 'start' });
}

/* ═══ 15. LES GRAPHES : survol, largeur ═══ */
function redimCourbe(force) {
  const box = $('#ck-gr');
  // ★ AUJ-6 (§308) : une boîte cachée (page en arrière-plan) ne se dessine pas — et le DIT (G.w = 0) : revenue à l'écran, elle
  //   se croyait déjà dessinée à sa largeur et restait vide. Une boîte vide se redessine toujours.
  if (!box) return;
  if (box.offsetParent === null) { G.w = 0; return; }
  const w = Math.round(box.clientWidth);
  if (!w || (!force && Math.abs(w - G.w) < 3 && box.querySelector('svg'))) return;
  box.innerHTML = htmlCourbe(w);
  dessinerCourbe(G.reste, G.fin);
  $('#ck-c-fin-l').textContent = dCourt(G.fin);
}
function redimEChart(a) { if (!V.eco) return; return redimEChart0(a); }
function redimEChart0(force) {
  const box = $('#ck-egr');
  if (!box) return;
  if (box.offsetParent === null) { GE.w = 0; return; }   // AUJ-6 : même règle que la charge restante
  const w = Math.round(box.clientWidth);
  if (!w || (!force && Math.abs(w - GE.w) < 3 && box.querySelector('svg'))) return;
  box.innerHTML = htmlEChart(w);
  const at = attPct(R);
  GE.att = at; GE.fin = R.fin;
  dessinerEChart(at, R.fin);
}
function jourSous(ev, c, svg) {
  const rc = svg.getBoundingClientRect(), k = (ev.clientX - rc.left - c.padL) / c.iw;
  if (k < 0 || k > 1) return null;
  const d0 = c.D0 || DEBUT, brut = new Date(+d0 + k * (XMAX - d0));
  return J(brut.getUTCFullYear(), brut.getUTCMonth() + 1, brut.getUTCDate() + (brut.getUTCHours() >= 12 ? 1 : 0));
}
function placerTip(tip, c, gx, gy) {
  const tw = tip.offsetWidth;
  let tx = gx + 14;
  if (tx + tw > c.w - 4) tx = gx - tw - 14;
  tip.style.left = tx + 'px';
  tip.style.top = Math.max(4, Math.min(c.h - tip.offsetHeight - 4, gy - tip.offsetHeight / 2)) + 'px';
  tip.classList.add('vu');
}
function suivreCourbe(ev) {
  const c = G.c, svg = $('#ck-gr svg'), tip = $('#ck-tip');
  if (!c || !svg) return;
  const jour = jourSous(ev, c, svg);
  if (!jour) { cacherTip(); return; }
  let v, quoi;
  if (jour < AUJ) {
    const h = HIST.find(o => +o.d === +jour);
    if (!h) {   // PRO-1 (§269) : pas de photo ce jour-là — on le dit, au lieu de prêter le chiffre d'aujourd'hui
      $('#ck-c-gpt').style.opacity = 0; const gl0 = $('#ck-c-guide'), gx0 = c.X(jour);
      gl0.setAttribute('x1', gx0); gl0.setAttribute('x2', gx0); gl0.style.opacity = 1;
      tip.innerHTML = '<b>' + JOURS_C[jour.getUTCDay()] + ' ' + dCourt(jour) + '</b><span>Pas de mesure ce jour-là</span>';
      placerTip(tip, c, gx0, c.padT + c.ih / 2); return;
    }
    v = h.r; quoi = 'Reste mesuré';
  }
  else if (+jour === +AUJ) { v = G.reste; quoi = 'Reste aujourd’hui'; }
  else if (jour <= G.fin) { v = G.reste * (1 - (jour - AUJ) / (G.fin - AUJ)); quoi = 'Projection'; }
  else { v = 0; quoi = 'Travaux finis'; }
  const gx = c.X(jour), gy = c.Y(v), gl = $('#ck-c-guide'), gp = $('#ck-c-gpt');
  gl.setAttribute('x1', gx); gl.setAttribute('x2', gx); gl.style.opacity = 1;
  gp.setAttribute('cx', gx); gp.setAttribute('cy', gy); gp.style.opacity = 1;
  gp.setAttribute('class', 'ck-c-gpt' + (jour > AUJ ? ' proj' : ''));
  tip.innerHTML = '<b>' + JOURS_C[jour.getUTCDay()] + ' ' + dCourt(jour) + (estOuvre(jour) ? '' : ', non travaillé') + '</b><span>' + quoi + ' : ' + nb(v) + '\u202fh</span>';
  placerTip(tip, c, gx, gy);
}
function suivreEChart(ev) { if (!V.eco) return; return suivreEChart0(ev); }
function suivreEChart0(ev) {
  const c = GE.c, svg = $('#ck-egr svg'), tip = $('#ck-etip');
  if (!c || !svg) return;
  const jour = jourSous(ev, c, svg);
  if (!jour) { cacherTip(); return; }
  let fa, de, quoi = '';
  // AUJ-7 : jusqu'à aujourd'hui, la série datée (le dernier point connu à ce jour) ; ensuite, les projections.
  if (+jour <= +AUJ) { const L = SERIE_E.filter(o => +o.d <= +jour), o = L[L.length - 1]; if (!o) { cacherTip(); return; } fa = o.fait; de = o.dep; }
  else if (jour <= GE.fin) { const z = finSerieE(), k = (jour - AUJ) / Math.max(1, GE.fin - AUJ); fa = lerp(z.fait, 100, k); de = lerp(z.dep, GE.att, k); quoi = ', projection'; }
  else { fa = 100; de = GE.att; quoi = ', travaux finis'; }
  const gx = c.X(jour), gl = $('#ck-e-guide');
  gl.setAttribute('x1', gx); gl.setAttribute('x2', gx); gl.style.opacity = 1;
  tip.innerHTML = '<b>' + JOURS_C[jour.getUTCDay()] + ' ' + dCourt(jour) + quoi + '</b><span><i class="pt-fait"></i>Travail fait : ' + nb(fa) + '\u202f%</span><span><i class="pt-dep"></i>Budget dépensé : ' + nb(de) + '\u202f%</span>';
  placerTip(tip, c, gx, c.Y((fa + de) / 2));
}
function cacherTip() {
  ['#ck-tip', '#ck-etip'].forEach(s => { const t = $(s); if (t) t.classList.remove('vu'); });
  ['#ck-c-guide', '#ck-c-gpt', '#ck-e-guide'].forEach(s => { const e = $(s); if (e) e.style.opacity = 0; });
}



/* ═══ Ce que la maquette simulait, et que l'appli fait pour de vrai ═══ */
let simOn = false, simTimer = 0;
const PAL = [];
// FORME-1 (§301) : la fiche de la parcelle, openDP. openSelParc est la feuille qui choisit les parcelles d'une TÂCHE
//   (arrachage, désherbage, effeuillage) : appelée avec un nom de parcelle, elle ne s'ouvrait pas (« Admin requis » hors admin).
function ouvrirFeuille(pid) { const p = PIDX[pid]; if (p && !p.arr) { cacherLoupe(); if (typeof window.openDP === 'function') window.openDP(p.nom); } }


const RANGS = {
  // ★ COLLE-1 (§412) : « En direct » en tête de la colonne de droite, dans sa carte, au-dessus d'« À savoir » (Nico, 21/10).
  t: { large: [['verdict', 'decision'], ['plan', 'chant', 'courbe'], ['fil', 'savoir']],
       moyen: [['verdict', 'decision', 'plan', 'chant', 'courbe'], [], ['fil', 'savoir']],   // AUJ-5 : « À savoir » reste à droite
       petit: [['verdict', 'savoir', 'decision', 'plan', 'fil', 'chant', 'courbe'], [], []] },
  e: { large: [['ever', 'ekpi'], ['echart', 'etac'], ['epos', 'eapp']],
       moyen: [['ever', 'ekpi', 'epos'], ['echart', 'etac', 'eapp'], []],
       petit: [['ever', 'ekpi', 'echart', 'epos', 'eapp', 'etac'], [], []] },
};
let rangerRaf = 0, redimT = 0, redimPlanT = 0;
function rangerBientot() { if (!rangerRaf) rangerRaf = requestAnimationFrame(() => { rangerRaf = 0; ranger(); }); }
// ★ COLLE-1 (§412) — « En direct », dans la colonne de droite, garde la hauteur d'une journée calme (la feuille le plafonne) ;
//   quand son contenu dépasse, la fin s'efface en fondu et « Tout voir (N) », en haut à droite, le déplie sur place —
//   « Replier » le remet à sa taille (Nico, 21/10 : « de la taille d'une journée calme avec possibilité d'extension »).
//   Ailleurs (téléphone, une colonne) : le bouton d'avant, « Tout le fil » au-delà de quatre faits (DIRECT-1).
function filTaille() {
  const f = $('#ck-fil'), b = $('#ck-fil-tout'), l = $('#ck-fil-l'); if (!f || !b) return;
  if (!(f.parentElement && f.parentElement.id === 'ck-t-c')) {
    f.classList.remove('deborde', 'ouvert'); if (l) l.classList.toggle('tout', !!S.filTout);
    b.hidden = S.evts.length <= 4; b.textContent = S.filTout ? 'Replier' : 'Tout le fil'; b.setAttribute('aria-expanded', String(!!S.filTout));
    return;
  }
  const ouvert = !!S.filOuvert;
  f.classList.toggle('ouvert', ouvert); if (l) l.classList.toggle('tout', ouvert);
  if (!ouvert) { f.classList.remove('deborde'); f.classList.toggle('deborde', f.scrollHeight > f.clientHeight + 4); }
  b.hidden = !f.classList.contains('deborde');
  b.textContent = ouvert ? 'Replier' : 'Tout voir (' + (coursItems().length + S.evts.length) + ')';
  b.setAttribute('aria-expanded', String(ouvert));
}
// ★ AUJ-6 (§308) : « À savoir » colle SOUS les barres collantes du Pilotage (le fil de portée, puis les onglets), à leur hauteur
//   MESURÉE. À 16 px du haut (AUJ-5, --ck-colle jamais posé), il passait sous la barre d'onglets dès qu'on descendait (10/10).
// ★ COLLE-1 (§412) : le bandeau compris. TETE-2 (§329) a fait du haut du Pilotage un vrai .mod-header, collant à top:0
//   au-dessus de tout : la mesure ne le comptait pas, la colonne de droite passait dessous (Nico, 21/10). Les onglets se
//   calent désormais sous lui (styles.css, --pil-entete-bas posé par pilotage.js) : le plus bas des trois donne la hauteur.
function colleHaut() {
  let bas = 0;
  $$('#page-pilotage .mod-header, #page-pilotage .pil-portee, #page-pilotage .pil-tabsbar').forEach(el => {
    const cs = getComputedStyle(el), h = el.getBoundingClientRect().height;
    if (h && (cs.position === 'sticky' || cs.position === 'fixed')) bas = Math.max(bas, (parseFloat(cs.top) || 0) + h);
  });
  return Math.round(bas) + 16;
}
function ranger() {
  const pg = $('#ck-page');
  // PRO-1 (§269) : le cockpit a quitté l'écran (autre onglet, autre module) — l'observateur restait branché sur la
  //   page disparue et plantait à chaque redimensionnement (« reading 'clientWidth' », journalisé en erreur).
  if (!pg) { if (obs) { obs.disconnect(); obs = null; } return; }
  const w = pg.clientWidth - 2 * parseFloat(getComputedStyle(pg).paddingLeft || 0);
  pg.style.setProperty('--ck-colle', colleHaut() + 'px');   // AUJ-6
  const taille = w >= 1000 ? 'large' : w >= 760 ? 'moyen' : 'petit';   // AUJ-5 : la maquette dès 1 000 px (1 150 avant)
  if (pg.dataset.taille !== taille) {
    pg.dataset.taille = taille;
    ['t', 'e'].forEach(v => RANGS[v][taille].forEach((ids, k) => {
      const col = $('#ck-' + v + '-' + 'abc'[k]); if (!col) return;
      ids.forEach(id => { const el = $('#ck-' + id); if (el) col.appendChild(el); });
    }));
  }
  filTaille();   // COLLE-1 : la hauteur d'« En direct » se remesure à chaque rangement (place ou largeur changée)
  // PRO-1 : les graphes suivent TOUTE nouvelle largeur (ils ne se redessinaient qu'au changement de disposition : la
  //   barre latérale repliée ou dépliée les laissait trop larges ou trop étroits), une fois la largeur posée.
  clearTimeout(redimT); redimT = setTimeout(() => { if ($('#ck-page')) { redimCourbe(false); redimEChart(false); } }, 140);
  clearTimeout(redimPlanT); redimPlanT = setTimeout(() => { if ($('#ck-page')) dessinerPlan(false); }, 140);   // FORME-1 : le plan suit la largeur
}
/* PRO-1 (§269) — « Agrandir » : la courbe en grand, au-dessus de la page. Le tracé est DÉPLACÉ, pas copié : ses
   identifiants restent uniques, son survol et sa bulle le suivent. Échap, le voile ou « Fermer » le ramènent. */
function agrandir(on) {
  let boite = $('#ck-agr');
  if (!on) {
    if (!boite || boite.hidden) return;
    const gr = boite.querySelector('#ck-gr'), leg = $('#ck-courbe .ck-gr-leg');
    if (gr) { if (leg) leg.parentNode.insertBefore(gr, leg); else gr.remove(); }
    boite.classList.remove('ouvert'); boite.hidden = true; G.grand = false; document.body.classList.remove('ck-agr-on');
    redimCourbe(true);
    const b = $('#ck-courbe [data-fn="agrandir"]'); if (b) b.focus();
    return;
  }
  const gr = $('#ck-gr'); if (!gr) return;
  if (!boite) {
    boite = document.createElement('div'); boite.id = 'ck-agr'; boite.className = 'ck-agr'; boite.hidden = true;
    boite.setAttribute('role', 'dialog'); boite.setAttribute('aria-modal', 'true'); boite.setAttribute('aria-label', 'Charge restante, en grand');
    boite.innerHTML = '<div class="ck-agr-voile" data-fn="reduire"></div><div class="ck-agr-p ck2"><header class="ck-p-hd"><div><h2 class="ck-titre-p">Charge restante</h2>'
      + '<p class="ck-cadre" id="ck-agr-cadre"></p></div><button type="button" class="ck-btn ck-btn-ghost ck-btn-s" data-fn="reduire">Fermer</button></header>'
      + '<div class="ck-agr-slot"></div><div class="ck-gr-leg" aria-hidden="true"><span><i class="lg-mes"></i>Reste mesuré</span><span><i class="lg-proj"></i>Projection</span><span><i class="lg-bes"></i>Allure pour finir à l’objectif</span></div></div>';
    document.body.appendChild(boite);
    boite.addEventListener('click', ev => { if (ev.target.closest('[data-fn="reduire"]')) agrandir(false); });
  }
  const ca = $('#ck-gr-cadre'); $('#ck-agr-cadre').textContent = ca ? ca.textContent : '';
  boite.querySelector('.ck-agr-slot').appendChild(gr);
  boite.hidden = false; G.grand = true; document.body.classList.add('ck-agr-on');
  redimCourbe(true);
  requestAnimationFrame(() => boite.classList.add('ouvert'));
  const f = boite.querySelector('button[data-fn="reduire"]'); if (f) f.focus();
}
// La boîte d'un montage précédent : on la vide sans rien redessiner (la page va être remontée).
function agrandiOublier() {
  const boite = $('#ck-agr'); if (!boite) return;
  const gr = boite.querySelector('#ck-gr'); if (gr) gr.remove();
  boite.classList.remove('ouvert'); boite.hidden = true; G.grand = false; document.body.classList.remove('ck-agr-on');
}
/* PRO-1 (§269) — la date de l'objectif se règle ici (admin), avec le sélecteur de date du téléphone ou de l'ordinateur.
   L'enregistrement est celui du Pilotage (_pilObjectifRegler : même clé, même sauvegarde, même message). */
function choisirObjectif(btn) {
  if (!V.admin) return;
  let inp = $('#ck-obj-in');
  if (!inp) {
    inp = document.createElement('input'); inp.type = 'date'; inp.id = 'ck-obj-in'; inp.className = 'ck-obj-in'; inp.tabIndex = -1;
    inp.setAttribute('aria-label', 'Date de l’objectif');
    btn.parentNode.appendChild(inp);
    inp.addEventListener('change', () => { if (inp.value && typeof window._pilObjectifRegler === 'function') window._pilObjectifRegler(inp.value); });
  }
  inp.value = iso(VISEE);
  try { if (typeof inp.showPicker === 'function') inp.showPicker(); else inp.focus(); }
  catch (e) { inp.focus(); if (window._mvAvale) window._mvAvale(e, 'cockpit-vue.js/choisirObjectif'); }
}
function monter() {
  $('#ck-tete').innerHTML = htmlTete();
  $('#ck-photos').innerHTML = htmlPhotos(R);
  $('#ck-verdict').innerHTML = htmlVerdict(R);
  $('#ck-savoir').innerHTML = htmlSavoir(R);
  $('#ck-decision').innerHTML = htmlDecision(R);
  $('#ck-plan').innerHTML = htmlPlan();
  $('#ck-chant').innerHTML = htmlChantiers(R);
  $('#ck-fil').innerHTML = htmlFil();
  $('#ck-courbe').innerHTML = entete('Charge restante', '', 'courbe', 'ck-gr-cadre', '<button class="ck-btn ck-btn-ghost ck-btn-s" type="button" data-fn="agrandir">Agrandir</button>')
    + '<div class="ck-gr" id="ck-gr"></div>'
    + '<div class="ck-gr-leg" aria-hidden="true"><span><i class="lg-mes"></i>Reste mesuré</span><span><i class="lg-proj"></i>Projection</span><span><i class="lg-bes"></i>Allure pour finir à l’objectif</span></div>';
  if (!V.eco) return;   // pas d'économie branchée (pas de taux) : la vue Économie ne se dessine pas
  $('#ck-ever').innerHTML = htmlEVerdict(R);
  $('#ck-ekpi').innerHTML = htmlEKpis(R);
  $('#ck-echart').innerHTML = entete('Main-d’œuvre : dépensé face au fait', 'Tant que le dépensé reste sous le fait, la campagne coûte moins que prévu', 'echart')
    + '<div class="ck-gr" id="ck-egr"></div>'
    + '<div class="ck-gr-leg" aria-hidden="true"><span><i class="lg-fait"></i>Travail fait</span><span><i class="lg-mes"></i>Budget dépensé</span></div>';
  $('#ck-epos').innerHTML = htmlPostes(R);
  $('#ck-eapp').innerHTML = htmlApps(R);
  $('#ck-etac').innerHTML = htmlTaches(R);
  G.reste = R.reste; G.fin = R.fin;
  $('#ck-savoir').dataset.h = htmlSavoir(R);
}function entree() {
  const r = R;
  // ★★ AUJ-6 (§308) : chaque mise à jour est ISOLÉE. Une seule qui levait arrêtait l'entrée avant sa fin : la page gardait
  //   « ck-entree » (parcelles à opacité 0, titres d'appellation visibles) et la charge restante n'était jamais tracée — les
  //   dessins « qui disparaissent parfois » (Nico, 10/10 ; la cause qui levait : voir _ck2Monter).
  [() => majResume(r), () => majVerdict(r), () => majDecision(r), () => majPlan(), () => majChantiers(r), () => majCourbe(r), () => majEco(r), () => redimCourbe(true)]
    .forEach(f => { try { f(); } catch (e) { if (window._mvAvale) window._mvAvale(e, 'cockpit-vue.js/entree'); } });
  const fin = () => {
    Anim.compter($('#ck-ph-trav'), r.pct, nb, 1100);
    Anim.compter($('#ck-ph-eff'), V.presents, nb, 700);
    Anim.compter($('#ck-ph-bud'), r.budgetPct, nb, 1100);
    Anim.compter($('#ck-ph-conf'), V.confN || 0, nb, 0);
  };
  if (reduit()) { $('#ck-page').classList.remove('ck-entree'); fin(); return; }   // AUJ-6 : la page se montre d'abord
  // Un seul moment orchestré : le plan se dessine de gauche à droite, les chiffres montent,
  // la courbe se trace. Ensuite, plus rien ne bouge sans raison.
  $$('.ck-pa').forEach(el => { el.style.transitionDelay = Math.round(PIDX[el.dataset.id].cx / PLAN_W * 520) + 'ms'; });
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const pg = $('#ck-page'); if (pg) pg.classList.remove('ck-entree');
    setTimeout(fin, 160);
    const l = $('#ck-c-ligne');
    if (l) {
      const len = l.getTotalLength();
      l.style.strokeDasharray = len; l.style.strokeDashoffset = len;
      l.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 1300, delay: 200, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' })
        .onfinish = () => { l.style.strokeDasharray = ''; l.style.strokeDashoffset = ''; l.getAnimations().forEach(a => a.cancel()); };
    }
    setTimeout(() => $$('.ck-pa').forEach(el => { el.style.transitionDelay = ''; }), 1500);
  }));
}
/* ═══ 16. MONTAGE — dans l'onglet Aujourd'hui du Pilotage (REF-1, §266) ═══ */
let R = null, branche = false, obs = null;
function brancher() {
  window.addEventListener('scroll', () => cacherLoupe(), { passive: true });   // FORME-1 : la loupe ne flotte pas pendant qu'on défile
  document.addEventListener('click', ev => {
    if (!document.getElementById('ck-page')) return;       // le cockpit n'est pas à l'écran
    const i = ev.target.closest('.ck-i');
    if (i) { ev.stopPropagation(); ouvrirInfo(i, ev.detail === 0); return; }
    const mo = ev.target.closest('.ck-bascule [role="tab"]');
    if (mo) { choisirMode(mo.dataset.mode); return; }
    const seg = ev.target.closest('.ck-seg [role="tab"]');
    if (seg) { choisirTache(seg.dataset.t); return; }
    const ch = ev.target.closest('.ck-ch');
    if (ch) { choisirTache(ch.dataset.t); if (window.innerWidth < 1024) $('#ck-plan').scrollIntoView({ behavior: reduit() ? 'auto' : 'smooth', block: 'start' }); return; }
    const lg = ev.target.closest('.ck-leg-i');
    if (lg) {
      const f = lg.dataset.f, on = S.filtre !== f;
      S.filtre = on ? f : null;
      $$('.ck-leg-i').forEach(b => b.setAttribute('aria-pressed', String(on && b === lg)));
      const carte = $('#ck-carte'); if (S.filtre) carte.dataset.filtre = S.filtre; else delete carte.dataset.filtre;
      majPlan(); return;
    }
    const fn = ev.target.closest('[data-fn]');
    if (fn && fn.dataset.fn === 'voirRetard') { voirRetard(); return; }
    if (fn && fn.dataset.fn === 'export') { if (typeof window._pilEcoExport === 'function') window._pilEcoExport(); return; }
    // PRO-1 (§269) : « Agrandir » était branché sur une instruction vide ; « Changer la priorité » menait à l'onglet
    //   L'équipe & le matériel au lieu d'ouvrir le choix de la priorité.
    if (fn && fn.dataset.fn === 'agrandir') { agrandir(true); return; }
    if (fn && fn.dataset.fn === 'priorite') {
      if (typeof window.openPriorityEdit === 'function') window.openPriorityEdit();
      else if (window.logError) window.logError({ level: 'info', cat: 'cockpit', msg: 'openPriorityEdit absent' });
      return;
    }
    if (fn && fn.dataset.fn === 'tension') { if (typeof window._pilGo === 'function') window._pilGo('tension'); return; }
    if (fn && fn.dataset.fn === 'objectif') { choisirObjectif(fn); return; }
    if (ev.target.closest('#ck-plan-tout')) { S.planTout = !S.planTout; majPli(); if (!S.planTout) $('#ck-plan').scrollIntoView({ behavior: reduit() ? 'auto' : 'smooth', block: 'start' }); return; }
    const og = ev.target.closest('[data-onglet]');
    if (og) { choisirOnglet(og.dataset.onglet); return; }
    const mod = ev.target.closest('[data-module]');
    if (mod) { if (typeof window.goTo === 'function') window.goTo(mod.dataset.module); return; }
    const plus = ev.target.closest('#ck-fil-tout, #ck-sv-tout');
    if (plus && plus.id === 'ck-fil-tout' && plus.closest('#ck-t-c')) { S.filOuvert = !S.filOuvert; filTaille(); return; }   // COLLE-1
    if (plus) {
      const l = plus.id === 'ck-fil-tout' ? $('#ck-fil-l') : $('#ck-sv-l'), on = !l.classList.contains('tout');
      l.classList.toggle('tout', on); plus.setAttribute('aria-expanded', String(on));
      if (plus.id === 'ck-fil-tout') S.filTout = on; else S.svTout = on;
      plus.textContent = on ? 'Replier' : (plus.id === 'ck-fil-tout' ? 'Tout le fil' : 'Tout voir (' + savoirItems(R).length + ')');
    }
  });
  document.addEventListener('keydown', ev => {
    if (ev.key !== 'Escape' || ev.defaultPrevented) return;     // BULLE-1 : ce premier Échap a refermé la bulle
    const b = document.getElementById('ck-agr'); if (b && !b.hidden) { agrandir(false); return; }
  });
}
function brancherPlan() {
  // FORME-1 (§301) : les gestes du plan sont délégués à la carte, qui survit au redessin (le dessin suit la largeur).
  const carte = $('#ck-carte');
  if (carte && !carte._ck) {
    carte._ck = 1;
    const cible = ev => { const el = ev.target.closest && ev.target.closest('.ck-pa,.ck-pa-hit'); return el && PIDX[el.dataset.id] ? el.dataset.id : null; };
    carte.addEventListener('pointerover', ev => { const id = cible(ev); if (id && ev.pointerType !== 'touch') survoler(id, ev); });
    carte.addEventListener('pointerleave', () => survoler(null));
    carte.addEventListener('click', ev => { const id = cible(ev); if (id) ouvrirFeuille(id); });
    carte.addEventListener('keydown', ev => { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.classList && ev.target.classList.contains('ck-pa')) { ev.preventDefault(); ouvrirFeuille(ev.target.dataset.id); } });
    carte.addEventListener('focusin', ev => { if (ev.target.classList && ev.target.classList.contains('ck-pa')) survoler(ev.target.dataset.id); });
    carte.addEventListener('focusout', () => survoler(null));
  }
  // Les graphes suivent la souris (la maquette les branchait au montage de sa page).
  const gr = $('#ck-gr'); if (gr && !gr._ck) { gr._ck = 1; gr.addEventListener('pointermove', suivreCourbe); gr.addEventListener('pointerleave', cacherTip); }
  const egr = $('#ck-egr'); if (egr && !egr._ck) { egr._ck = 1; egr.addEventListener('pointermove', suivreEChart); egr.addEventListener('pointerleave', cacherTip); }
}
function heures() { $$('.ck-ev time').forEach(t => { t.textContent = ilYa(+t.dataset.ts); }); }
window._ck2Monter = function (v) {
  if (!document.getElementById('ck-page')) return;
  agrandiOublier();
  // ★★ AUJ-6 (§308) — LA CAUSE DES DESSINS DISPARUS : un montage repart de zéro. Les cadres des graphes (G.c, GE.c) et la
  //   bascule (S.mode) survivaient au montage précédent : après un passage par Économie, le montage suivant (une donnée qui
  //   arrive, un retour sur l'onglet) redessinait le graphe Économie dans une boîte neuve encore vide — « #ck-e-fait »
  //   absent, TypeError dans majEco, entrée arrêtée : parcelles invisibles, charge restante vide. Le squelette s'ouvre sur
  //   Terrain sans filtre de légende ; on revient sur Économie si c'est là qu'on était.
  const modeAvant = S.mode;
  G.c = null; G.w = 0; GE.c = null; GE.w = 0; GE.fait = GE.dep = GE.att = null; S.mode = 'terrain'; S.filtre = null;
  charger(v); R = calc();
  G.reste = R.reste; G.fin = R.fin; GE.fin = R.fin;   // l'état des graphes : la maquette le prenait au chargement
  cacherLoupe(); monter(); brancherPlan(); ranger(); dessinerPlan(true);
  if (!branche) { brancher(); branche = true; setInterval(heures, 30000); }
  if ('ResizeObserver' in window) { if (obs) obs.disconnect(); obs = new ResizeObserver(() => rangerBientot()); obs.observe($('#ck-page')); const ci = $('#ck-carte-in'); if (ci) obs.observe(ci); const hd = document.querySelector('#page-pilotage .mod-header'); if (hd) obs.observe(hd); }   // AUJ-5 : le plan suit aussi SA case ; COLLE-1 : et le bandeau, dont la hauteur règle la colonne de droite
  placerInd($('.ck-seg [aria-selected="true"]'), $('.ck-seg-ind'));
  placerInd($('.ck-bascule [aria-selected="true"]'), $('.ck-bascule-ind'));
  SANS_MVT = !!window._ck2EntreeFaite; entree(); SANS_MVT = false; window._ck2EntreeFaite = true;
  if (modeAvant === 'eco' && V.eco) { SANS_MVT = true; try { choisirMode('eco'); } finally { SANS_MVT = false; } }   // AUJ-6
};
window._ck2Maj = function (v) {
  // VIF-1 (§414) : la mise à jour en direct, appelée par pilotage.js (_pilRafraichirVif) quand les données changent. Les
  //   parcelles qui viennent d'être faites ou commencées ont leur onde, comme une validation dans la maquette.
  if (!document.getElementById('ck-page')) return;
  const avant = {}, nom = {};
  Object.keys(S.etats).forEach(t => { avant[t] = Object.assign({}, S.etats[t]); });
  PARCS.forEach(p => { nom[p.id] = p.nom; });
  charger(v); majTout({});
  if (reduit()) return;
  const parNom = {}; PARCS.forEach(p => { parNom[p.nom] = p.id; });
  Object.keys(S.etats).forEach(t => Object.keys(avant[t] || {}).forEach(pid => {
    const n = nom[pid], id = n && parNom[n], a = avant[t][pid], b = id && S.etats[t][id];
    if (id && b && a && b !== a && (b === 'faite' || b === 'cours')) onde(id, b, t);
  }));
};
})();
