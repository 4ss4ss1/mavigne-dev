// ═════════════════════════════════════════════════════════════════════════════════════════════════
// ★★★ REF-1 (§266) — LE COCKPIT D'AUJOURD'HUI : LA MAQUETTE VALIDÉE, TELLE QUELLE
// Nico (07/10) : « la maquette était parfaite, tu t'en es complètement éloigné ». Ce module EST la maquette
// (dessins, mises à jour animées, navigation, graphes, montage), sans ses données de démonstration : elle lit
// un modèle V que pilotage.js construit avec les moteurs du Pilotage (_pilCk2Modele). Retirés : la simulation
// de démonstration, la feuille de validation (toucher une parcelle ouvre SA fiche, chemin de validation de
// toujours), la palette Ctrl K et la barre latérale (lots suivants, pour toute l'appli).
// La feuille de style de la maquette est passée à la charte (convertisseur REF-1) : section REF-1 de styles.css.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
window._ck2Squelette = function () { return '<div class="ck2"><div class="ck-page ck-entree" id="ck-page"> <div class="ck-tete" id="ck-tete"></div> <section class="ck-photos" id="ck-photos" aria-label="Les quatre photos du domaine"></section> <div class="ck-vue ck-gt" id="ck-vue-terrain"> <div class="ck-col" id="ck-t-a"> <section class="ck-verdict" id="ck-verdict" aria-label="Fin prévue des travaux"></section> <section class="ck-decision ck-panneau" id="ck-decision" aria-label="La décision du jour"></section> <aside class="ck-fil ck-panneau" id="ck-fil" aria-label="Fil en direct"></aside> </div> <div class="ck-col" id="ck-t-b"> <section class="ck-plan ck-panneau" id="ck-plan" aria-label="Le domaine en direct"></section> <section class="ck-chant ck-panneau" id="ck-chant" aria-label="Chantiers d’hiver"></section> <section class="ck-courbe ck-panneau" id="ck-courbe" aria-label="Charge restante"></section> </div> <div class="ck-col ck-col-c" id="ck-t-c"> <section class="ck-savoir ck-panneau" id="ck-savoir" aria-label="À savoir"></section> </div> </div> <div class="ck-vue ck-ge" id="ck-vue-eco" hidden> <div class="ck-col" id="ck-e-a"> <section class="ck-ever ck-verdict" id="ck-ever" aria-label="Atterrissage de la campagne"></section> <section class="ck-ekpi" id="ck-ekpi" aria-label="Indicateurs économiques"></section> </div> <div class="ck-col" id="ck-e-b"> <section class="ck-echart ck-panneau" id="ck-echart" aria-label="Dépensé face au fait"></section> <section class="ck-etac ck-panneau" id="ck-etac" aria-label="Écart au barème par tâche"></section> </div> <div class="ck-col ck-col-c" id="ck-e-c"> <section class="ck-epos ck-panneau" id="ck-epos" aria-label="Par poste"></section> <section class="ck-eapp ck-panneau" id="ck-eapp" aria-label="Par appellation"></section> </div> </div> </div> </div><div class="ck-pop" id="ck-pop" role="note" hidden><p></p></div> <div class="ck-sr" id="ck-annonce" aria-live="polite"></div>'; };
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
const estOuvre = d => {
  const w = d.getUTCDay();
  if (w === 0 || w === 6 || FERIES.has(iso(d))) return false;
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
let AUJ, DEBUT, VISEE, XMAX, TACHES = [], T = {}, PREREQ = {}, GENS = [], EQ = {}, APPS = [], AIDX = {}, BLOCS = [],
  PLAN_H = 720, PARCS = [], PIDX = {}, HA_TOT = 0, ORDRE = {}, TOTAL = 0, YMAX = 500, TAUX = 0, MARGE_BUDGET = 0,
  POSTES = [], HIST = [], METEO = [], T0 = Date.now(), MIN = 60e3, NEXT_ID = 1, SPARK_TRAV = [], SPARK_BUD = [], SPARK_ECART = [];
const S = { etats: {}, dates: {}, equipes: [], evts: [], vue: null, filtre: null, sel: null, onglet: 'auj', mode: 'terrain', svTout: false, filTout: false };
const H_JOUR = 1;
const effectif = () => (V ? V.presents : 0);
const capacite = () => 0;
const dParc = p => 'M' + p.pts.map(q => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('L') + 'Z';
const pX = p => (p.cx / 10) + '%';
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

// Le plan : une zone par appellation (de la plus grande à la plus petite), rangées par lignes ; dans chaque zone, un
// bloc par commune ; dans chaque bloc, une bande par parcelle, sa largeur selon sa surface. Les blocs ont les coins
// légèrement décalés, comme le plan dessiné de la maquette — un schéma, pas une carte.
function disposer(parcs) {
  const apps = {}, ordre = [];
  parcs.forEach(p => {
    const a = p.appellation || 'Sans appellation';
    if (!apps[a]) { apps[a] = { nom: a, ha: 0, com: {}, ordre: [] }; ordre.push(a); }
    const A = apps[a]; if (!p.arr) A.ha += p.ha;
    const c = p.commune || ''; if (!A.com[c]) { A.com[c] = []; A.ordre.push(c); } A.com[c].push(p);
  });
  ordre.sort((x, y) => apps[y].ha - apps[x].ha);
  // PRO-1 (§269) : une zone a d'abord la largeur qu'il faut pour lire son titre (nom et surface, police de 20 unités),
  //   puis sa part de la place qui reste, selon sa surface. Avant, une petite appellation voisine d'une grande passait
  //   sous 420 unités et partait seule sur sa ligne : sept appellations faisaient une colonne de bandeaux, réduite au
  //   quart dans son cadre — des titres de cinq pixels à l'écran.
  const ESP = 18, LARG = 960;
  const minW = a => Math.min(LARG, Math.max(240, Math.round(String(a).length * 11.5 + haTxt(apps[a].ha).length * 9.5 + 40)));
  const lignes = []; let cur = [], som = 0;
  ordre.forEach(a => { const m = minW(a); if (cur.length && (som + ESP + m > LARG || cur.length >= 3)) { lignes.push(cur); cur = []; som = 0; } som += (cur.length ? ESP : 0) + m; cur.push(a); });
  if (cur.length) lignes.push(cur);
  APPS = []; BLOCS = []; PARCS = [];
  let y = 44, k = 0;
  lignes.forEach(lg => {
    const haL = lg.reduce((s, a) => s + Math.max(apps[a].ha, .05), 0), mins = lg.map(minW);
    const libre = Math.max(0, LARG - ESP * (lg.length - 1) - mins.reduce((s, v) => s + v, 0));
    const nBlocs = Math.max(...lg.map(a => apps[a].ordre.length));
    const hZ = Math.round(Math.max(104, Math.min(300, 120 + nBlocs * 88)));
    let x = 20;
    lg.forEach((a, i) => {
      const A = apps[a], w = mins[i] + libre * Math.max(A.ha, .05) / haL;
      const id = 'a' + APPS.length;
      APPS.push({ id, nom: a, ecart: 0, f: [x, y, w, hZ], minW: mins[i] });
      const nb = A.ordre.length, hb = (hZ - 38 - 14 * (nb - 1)) / nb;
      A.ordre.forEach((c, j) => {
        const x0 = x + 24, x1 = x + w - 24, y0 = y + 38 + j * (hb + 14), y1 = y0 + hb, o = (k++ % 3) * 3 - 3;
        const b = { id: 'b' + BLOCS.length, nom: c || a, app: id, commune: c, q: [[x0, y0 + 4 + o], [x1, y0 - 2 - o], [x1 + 4, y1], [x0 + 4, y1 + 2]] };
        BLOCS.push(b);
        const ps = A.com[c].slice().sort((p, q) => String(p.nom).localeCompare(String(q.nom), 'fr'));
        const totB = ps.reduce((s, p) => s + Math.max(p.ha, .02), 0);
        const [P0, P1, P2, P3] = b.q, Lp = (P, Q, t) => [lerp(P[0], Q[0], t), lerp(P[1], Q[1], t)];
        let acc = 0;
        ps.forEach(p => {
          const s = Math.max(p.ha, .02), u0 = acc / totB, u1 = (acc + s) / totB; acc += s;
          const tA = Lp(P0, P1, u0), tZ = Lp(P0, P1, u1), bZ = Lp(P3, P2, u1), bA = Lp(P3, P2, u0);
          const larg = Math.hypot(tZ[0] - tA[0], tZ[1] - tA[1]), n = Math.max(2, Math.round(larg / 7.5)), rangs = [];
          for (let r = 1; r < n; r++) { const u = lerp(u0, u1, r / n), h = Lp(P0, P1, u), bas = Lp(P3, P2, u); rangs.push([Lp(h, bas, .07), Lp(h, bas, .93)]); }
          PARCS.push({ id: 'p' + PARCS.length, bloc: b.id, lieu: b.nom, app: id, commune: c, ha: p.ha, nom: p.nom, cep: p.cepage || '',
            arr: !!p.arr, pts: [tA, tZ, bZ, bA], cx: (tA[0] + tZ[0] + bZ[0] + bA[0]) / 4, cy: (tA[1] + tZ[1] + bZ[1] + bA[1]) / 4, rangs });
        });
        b.cx = (P0[0] + P1[0] + P2[0] + P3[0]) / 4; b.cy = (P0[1] + P1[1] + P2[1] + P3[1]) / 4;
      });
      x += w + ESP;
    });
    y += hZ + 44;
  });
  PLAN_H = Math.max(200, y - 20);
}

function charger(v) {
  V = v;
  AUJ = deIso(v.auj); DEBUT = deIso(v.debut || v.auj); VISEE = v.objectif ? deIso(v.objectif) : ajout(AUJ, 60);
  const fin = v.fin ? deIso(v.fin) : VISEE;
  XMAX = ajout(fin > VISEE ? fin : VISEE, 5);
  TACHES = (v.taches || []).map(t => ({ id: t.id, nom: t.nom, art: t.art || t.nom.toLowerCase(), f: !!t.f, hha: t.hha || 0,
    debut: deIso(t.debut || v.debut || v.auj), fin: deIso(t.fin || v.objectif || v.auj), pct: t.pct || 0, hDone: t.hDone, hTotal: t.hTotal, cle: t.cle }));
  T = Object.fromEntries(TACHES.map(t => [t.id, t]));
  GENS = (v.gens || []).map(g => ({ p: g.nom, absent: !!g.absent, motif: g.motif || '', tens: g.tens || 100 }));
  disposer(v.parcs || []);
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
  });
  if (!S.vue || !T[S.vue]) S.vue = (v.prio && T[v.prio]) ? v.prio : ((TACHES.find(t => t.pct < 100) || TACHES[0] || {}).id || null);
  EQ = {}; S.equipes = []; S.evts = [];
  (v.equipes || []).forEach((e, i) => { const id = 'e' + i; EQ[id] = { noms: e.noms, ini: e.ini }; if (parNom[e.parcelle] && T[e.tache]) S.equipes.push({ id, tache: e.tache, parc: parNom[e.parcelle], depuis: e.depuis || Date.now() }); });
  (v.evts || []).forEach((e, i) => {
    const id = 'f' + i; EQ[id] = EQ[id] || { noms: e.noms, ini: e.ini };
    if (parNom[e.parcelle] && T[e.tache]) S.evts.push({ id: i + 1, type: e.type, eq: id, t: e.tache, pid: parNom[e.parcelle], h: e.h || 0, ts: e.ts || Date.now() });
  });
  NEXT_ID = S.evts.length + 1;
  HIST = (v.photos || []).map(x => ({ d: deIso(x.d), r: x.reste, c: x.cout || 0 }));
  TOTAL = Math.max(v.total || 0, ...HIST.map(h => h.r), v.reste || 0, 1);
  YMAX = Math.ceil(TOTAL / 500) * 500;
  METEO = v.meteo || [];
  const e = v.eco || {};
  TAUX = e.taux || 0; POSTES = e.postes || [];
  // La ligne de budget du graphe « dépensé face au fait » : le budget main-d'œuvre du moteur (TOTAL heures × taux × (1 + marge)).
  MARGE_BUDGET = (TAUX > 0 && TOTAL > 0 && e.moBudget) ? e.moBudget / (TOTAL * TAUX) - 1 : 0;
  // Le dépensé au fil des jours : la part du budget consommée, photographiée chaque jour (PHOTO-1, champ cons).
  const consDe = Object.fromEntries((e.consParJour || []).map(x => [x.d, x.cons]));
  HIST.forEach(h => { const c = consDe[iso(h.d)]; h.c = c != null ? c / 100 * (e.moBudget || 0) : null; });
  APPS.forEach(a => { a.ecart = null; });
  SPARK_TRAV = v.sparkTrav || []; SPARK_BUD = e.sparkBud || []; SPARK_ECART = e.sparkEcart || [];
}

function calc() {
  const v = V, r = { t: {}, a: {}, hF: v.hFait || 0, hT: v.hTotal || 0, hR: 0, moDep: 0, moReste: 0 };
  TACHES.forEach(t => {
    let haF = 0, haT = 0;
    PARCS.forEach(p => { if (p.arr) return; haT += p.ha; if (S.etats[t.id][p.id] === 'faite') haF += p.ha; });
    const pct = t.pct != null ? t.pct : (haT ? haF / haT * 100 : 0);
    const etat = pct >= 99.95 ? 'fait' : (AUJ > t.fin ? 'retard' : 'cours');
    const ecT = ((V.eco || {}).ecTache || {})[t.cle || t.nom], hRt = ((V.eco || {}).hReelTache || {})[t.cle || t.nom];
    r.t[t.id] = { haF, haT, hF: t.hDone != null ? t.hDone : haF * t.hha, hT: t.hTotal != null ? t.hTotal : haT * t.hha, hR: hRt || 0, pct, etat, ecart: ecT != null ? ecT : 0 };
  });
  APPS.forEach(a => {
    const ps = PARCS.filter(p => p.app === a.id && !p.arr), ha = ps.reduce((s, p) => s + p.ha, 0);
    const haF = S.vue ? ps.filter(p => S.etats[S.vue][p.id] === 'faite').reduce((s, p) => s + p.ha, 0) : 0;
    r.a[a.id] = { ha, pct: ha ? haF / ha * 100 : 0, coutHa: ((v.eco || {}).coutHaApp || {})[a.nom] || 0 };
  });
  r.pct = v.pct != null ? v.pct : (r.hT ? r.hF / r.hT * 100 : 0);
  r.reste = v.reste || 0;
  r.ecartMoy = (v.eco || {}).ecartMoy || 0;
  r.fin = finPrevue(); r.finPaul = r.fin;
  r.ecart = v.marge != null ? v.marge : Math.round((VISEE - r.fin) / 864e5);
  r.capMoy = (v.eco && v.eco.cadence) || v.capMoy || 0; r.besoin = v.besoin || 0;
  const e = v.eco || {};
  r.hR = e.hReel || 0;
  r.moBudget = e.moBudget || 0; r.moDep = e.moDep || 0; r.moAtt = e.moAtt || 0;
  r.budget = e.budget || 0; r.dep = e.dep || 0; r.att = e.att || 0; r.sous = r.budget - r.att;
  r.budgetPct = r.moBudget ? r.moDep / r.moBudget * 100 : 0;
  r.coutHa = HA_TOT ? r.att / HA_TOT : 0; r.coutHaPrevu = HA_TOT ? r.budget / HA_TOT : 0;
  return r;
}

/* ═══ 7. LES DESSINS — chacun rend du HTML, comme dans l’appli ═══ */
const eur = v => nb(v) + '\u202f€';
const eur100 = v => nb(Math.round(v / 100) * 100) + '\u202f€';
const signe = v => (v > 0 ? '+' : v < 0 ? '−' : '') + nb(Math.abs(v));
const NF1 = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const pct1 = v => (v > 0 ? '+' : v < 0 ? '−' : '') + NF1.format(Math.abs(v)) + '\u202f%';
const INFO = {
  fin: 'La fin prévue prend les heures qui restent au barème et les retire, jour après jour, de la capacité inscrite au planning : contrats en cours, absences, formations et congés compris. Elle avance quand une parcelle est validée.',
  travaux: 'Heures du barème des parcelles validées, sur le total des tâches de la campagne. Une parcelle commencée ne compte qu’à sa validation.',
  effectif: 'Personnes prévues au planning aujourd’hui, hors bureau. Les absences viennent du planning.',
  budget: 'Part du budget main-d’œuvre de la campagne déjà dépensée, face à la part du travail faite. Dépenser moins vite qu’on n’avance, c’est être en avance.',
  conformite: 'Points du registre phyto et des documents obligatoires qui demandent une action de votre part.',
  savoir: 'Ce qui peut changer la journée ou la semaine : météo par secteur, absences, contrats, matériel, retards. Les motifs d’absence ne sont visibles que de l’admin.',
  decision: 'Les quatre questions de chaque matin, chacune avec sa réponse et le bouton pour agir.',
  plan: 'Les parcelles sont rangées par appellation, puis par lieu-dit. Chaque parcelle prend la couleur de son état pour la tâche choisie ; le trait doré au-dessus de chaque appellation montre son avancement. C’est un schéma : la vraie carte reste dans Parcelles.',
  courbe: 'Le reste mesuré vient de la photo prise chaque jour. La projection suit la capacité du planning. La ligne fine montre l’allure qu’il faudrait pour finir pile à l’objectif.',
  atterrissage: 'L’atterrissage additionne ce qui est dépensé et ce que coûtera le travail restant, au coût horaire de l’équipe et à l’écart au barème mesuré dans chaque appellation. Les autres postes suivent les factures saisies.',
  coutha: 'Atterrissage de la campagne, divisé par les hectares en production. Le prévu est le budget divisé de la même façon.',
  ecart: 'Heures réellement passées, face aux heures du barème, sur les parcelles validées. Au-dessus de zéro, l’équipe met plus longtemps que le barème.',
  cadence: 'Heures de barème validées par jour travaillé, sur les quatre dernières semaines, face à l’allure qu’il faut tenir pour finir à l’objectif.',
  inaction: 'Ce que coûterait le retard si rien n’est décidé : le travail hors de sa fenêtre prend du temps en plus chaque semaine. C’est une hypothèse de calcul, pas une mesure.',
  echart: 'Les deux courbes se lisent ensemble : tant que le dépensé reste sous le travail fait, la campagne coûte moins que prévu. Les pointillés prolongent jusqu’à la fin prévue.',
  postes: 'Chaque barre est le budget du poste. La partie pleine est le dépensé ; le trait vertical est l’atterrissage prévu.',
  apps: 'Le coût de la main-d’œuvre à l’hectare sur toute la campagne, corrigé de l’écart au barème mesuré dans chaque appellation.',
  taches: 'Pour chaque tâche, l’écart entre heures réelles et barème sur les parcelles validées. À droite du zéro, l’équipe va moins vite que le barème.',
};
const SVG = (d, cls) => '<svg' + (cls ? ' class="' + cls + '"' : '') + ' viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>';
const ICO = {
  chev: '<svg class="ck-chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5"/></svg>',
  ok: SVG('<path d="M6 12.5l4 4 8-9"/>'),
  nuage: SVG('<path d="M7 17.5a4.5 4.5 0 0 1 .6-9 5.5 5.5 0 0 1 10.3 2A3.5 3.5 0 0 1 17.5 17.5z"/>'),
  pluie: SVG('<path d="M7 15a4.5 4.5 0 0 1 .6-9 5.5 5.5 0 0 1 10.3 2A3.5 3.5 0 0 1 17.5 15z"/><path d="M9 18l-1 2.5M13 18l-1 2.5M17 18l-1 2.5"/>'),
  gel: SVG('<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.6 4.6 12 7l2.4-2.4M9.6 19.4 12 17l2.4 2.4"/>'),
  eclaircie: SVG('<circle cx="9" cy="8.5" r="3"/><path d="M9 2.6v1.3M3.1 8.5h1.3M4.8 4.3l.9.9M13.2 4.3l-.9.9"/><path d="M9.8 19.5a3.8 3.8 0 0 1 .5-7.6 4.6 4.6 0 0 1 8.6 1.7 2.9 2.9 0 0 1-.6 5.9z"/>'),
  soleil: SVG('<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>'),
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
const btnI = (cle, lab) => '<button class="ck-i" type="button" data-info="' + cle + '" aria-label="' + esc(lab) + '" aria-expanded="false">i</button>';
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
      '<span id="ck-ph-bud-c">de la main-d’œuvre, pour ' + nb(r.pct) + '\u00a0% du travail fait</span>', 'eco', 'Économie') : '')
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
  const met = !METEO.length ? '' : ('<div class="ck-met" role="list" aria-label="Météo des cinq prochains jours">' + METEO.map(m =>
    '<div class="ck-met-j' + (m.ic === 'pluie' ? ' alerte' : '') + '" role="listitem" title="' + esc(m.txt) + '">'
    + '<span class="ck-met-n">' + m.j + '</span>' + '<span class="ck-met-ic ic-' + m.ic + '">' + ICO[m.ic] + '</span>'
    + '<span class="ck-met-t"><b>' + m.tmax + '°</b> ' + m.tmin + '°</span>'
    + '<span class="ck-met-mm">' + (m.mm ? m.mm + '\u202fmm' : '\u00a0') + '</span>'
    + '<span class="ck-met-br b' + String(m.brul).replace('.', '') + '" title="' + (m.brul === 1 ? 'Brûlage possible' : m.brul ? 'Brûlage l’après-midi' : 'Non travaillé') + '"></span></div>').join('') + '</div>'
    + '<p class="ck-met-leg"><i></i>brûlage possible <i class="demi"></i>l’après-midi seulement</p>');
  const lis = items.map(x => '<li class="ck-sv ck-sv-' + x.cat + (x.prio === 1 ? ' fort' : '') + '"' + (x.id ? ' id="' + x.id + '"' : '') + '>'
    + '<span class="ck-sv-ic">' + ICO[x.ic] + '</span>'
    + '<div class="ck-sv-tx"><div class="ck-sv-h"><b>' + esc(x.titre) + '</b><span class="ck-sv-q">' + esc(x.quand) + '</span></div>'
    + '<p class="ck-sv-s">' + esc(x.sous) + '</p>'
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
  const zones = APPS.map(a => {
    const [x, y, w, h] = a.f;
    const ha = PARCS.filter(p => p.app === a.id && !p.arr).reduce((s, p) => s + p.ha, 0);
    return '<g class="ck-zone" data-app="' + a.id + '"><rect class="ck-zone-f" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="14"/>'
      + '<rect class="ck-zone-rail" x="' + (x + 14) + '" y="' + (y - 1.5) + '" width="' + (w - 28) + '" height="3" rx="1.5"/>'
      + '<rect class="ck-zone-prog" id="ck-zp-' + a.id + '" x="' + (x + 14) + '" y="' + (y - 1.5) + '" width="' + (w - 28) + '" height="3" rx="1.5"/>'
      + '<text class="ck-zone-nom" x="' + (x + 4) + '" y="' + (y - 12) + '">' + esc(a.nom) + '<tspan class="ck-zone-ha" dx="12">' + haTxt(ha) + '</tspan></text>'
      + (w - (a.minW || 0) >= 150 ? '<text class="ck-zone-pc" id="ck-zt-' + a.id + '" x="' + (x + w - 4) + '" y="' + (y - 12) + '" text-anchor="end"></text>' : '') + '</g>';
  }).join('');
  const lieux = BLOCS.map(b => {
    const [P0, P1] = b.q, a = Math.atan2(P1[1] - P0[1], P1[0] - P0[0]) * 180 / Math.PI;
    return '<text class="ck-lieu" transform="translate(' + (P0[0] + 2).toFixed(1) + ' ' + (P0[1] - 9).toFixed(1) + ') rotate(' + a.toFixed(2) + ')">' + esc(b.nom) + '</text>';
  }).join('');
  const clos = BLOCS.filter(b => b.clos).map(b => '<path class="ck-clos" d="M' + b.q.map(q => {
    const dx = q[0] - b.cx, dy = q[1] - b.cy, n = Math.hypot(dx, dy);
    return (q[0] + dx / n * 6).toFixed(1) + ' ' + (q[1] + dy / n * 6).toFixed(1);
  }).join('L') + 'Z"/>').join('');
  const maisons = []   /* REF-1 : le village de la démonstration n'a rien à faire sur un vrai domaine */
    .map((m, k) => '<rect' + (k === 5 ? ' class="chai"' : '') + ' x="' + m[0] + '" y="' + m[1] + '" width="' + m[2] + '" height="' + m[3] + '" rx="1.5" transform="rotate(' + m[4] + ' ' + (m[0] + m[2] / 2) + ' ' + (m[1] + m[3] / 2) + ')"/>').join('');
  const parcs = PARCS.map(p => '<path class="ck-pa et-' + etatVue(S.vue, p.id) + '" data-id="' + p.id + '" d="' + dParc(p) + '"'
    + (p.arr ? ' aria-label="' + esc(p.nom) + ', arrachée"' : ' tabindex="0" role="button" aria-label="' + esc(p.nom) + '"') + '/>').join('');
  const rangs = PARCS.filter(p => !p.arr).map(p => p.rangs.map(l => '<line x1="' + l[0][0].toFixed(1) + '" y1="' + l[0][1].toFixed(1) + '" x2="' + l[1][0].toFixed(1) + '" y2="' + l[1][1].toFixed(1) + '"/>').join('')).join('');
  return '<svg class="ck-svg" id="ck-svg" viewBox="0 0 1000 ' + PLAN_H + '" preserveAspectRatio="xMidYMid meet" role="group" aria-label="Plan des parcelles, rangées par appellation">'
    + '<defs><pattern id="ck-hach" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line class="ck-hach-l" x1="0" y1="0" x2="0" y2="7"/></pattern></defs>'
    + '<g class="ck-zones">' + zones + '</g>'
    + clos + '<g class="ck-lieux">' + lieux + '</g><g class="ck-parcs">' + parcs + '</g><g class="ck-rangs">' + rangs + '</g>'
    + '<g id="ck-flash"></g><path id="ck-survol" d=""/><path id="ck-sel" d=""/></svg>';
}
const LEG = [['faite', 'Faites'], ['cours', 'En cours'], ['afaire', 'À faire'], ['retard', 'En retard'], ['arr', 'Arrachée']];
function htmlPlan() {
  return '<header class="ck-p-hd"><div><h2 class="ck-titre-p">Le domaine en direct' + btnI('plan', 'Comment lire le plan') + '</h2>'
    + '<p class="ck-cadre" id="ck-plan-cadre"></p></div>'
    + '<div class="ck-seg" role="tablist" aria-label="Tâche affichée sur le plan">'
    + TACHES.map(t => '<button type="button" role="tab" data-t="' + t.id + '" aria-selected="' + (t.id === S.vue) + '">' + esc(t.nom) + '</button>').join('')
    + '<span class="ck-seg-ind" aria-hidden="true"></span></div></header>'
    + '<div class="ck-carte" id="ck-carte"><div class="ck-carte-in" style="aspect-ratio:1000/' + Math.round(PLAN_H) + '">' + svgPlan()
    + '<div class="ck-calque" id="ck-calque"><div class="ck-etiq" id="ck-etiq" hidden><i></i><span></span></div></div></div></div>'
    + '<div class="ck-leg" role="group" aria-label="Filtrer le plan par état">'
    + LEG.map(([k, l]) => '<button type="button" class="ck-leg-i" data-f="' + k + '" aria-pressed="false"><i class="sw sw-' + k + '"></i>' + l + ' <b id="ck-leg-' + k + '" data-v="0">0</b></button>').join('')
    + '</div>';
}

function equipesHtml(t) {
  const eqs = S.equipes.filter(e => e.parc && e.tache === t);
  if (!eqs.length) return '';
  return '<span class="ck-ch-eq" title="' + esc(eqs.map(e => EQ[e.id].noms).join(', ')) + '"><span class="ck-pt-vif" aria-hidden="true"></span>'
    + eqs.map(e => '<span class="ck-duo">' + EQ[e.id].ini.map(i => '<span class="ck-av ck-av-s">' + i + '</span>').join('') + '</span>').join('')
    + '<span class="ck-sr">' + eqs.length + ' équipe' + (eqs.length > 1 ? 's' : '') + ' sur le terrain</span></span>';
}
function htmlChantiers(r) {
  return entete('Chantiers ' + V.saisonDe, 'Dans l’ordre des dates de la campagne')
    + '<ul class="ck-ch-l">' + TACHES.map(t => {
      const x = r.t[t.id];
      return '<li><button type="button" class="ck-ch' + (t.id === S.vue ? ' vue' : '') + '" data-t="' + t.id + '" aria-label="Afficher ' + esc(t.art) + ' sur le plan">'
        + '<span class="ck-ch-nom">' + esc(t.nom) + '<span class="ck-ch-eqw">' + equipesHtml(t.id) + '</span></span>'
        + '<span class="ck-ch-pct t-' + x.etat + '"><b data-v="0">0</b>\u202f%</span>'
        + '<span class="ck-barre"><i class="b-' + x.etat + '" style="width:0%"></i></span>'
        + '<span class="ck-ch-fen">du ' + dCourt(t.debut) + ' au ' + dCourt(t.fin) + '<span class="ck-ch-ret">' + (x.etat === 'retard' ? ', fenêtre passée' : '') + '</span></span>'
        + '<span class="ck-ch-det"><b class="ck-ch-hf" data-v="0">0</b> / ' + nb(x.hT) + '\u202fh</span></button></li>';
    }).join('') + '</ul>';
}

function texteEv(e) {
  const p = PIDX[e.pid], tt = T[e.t];
  const qui = e.eq ? EQ[e.eq].noms : 'Vous';
  // PRO-1 (§269) : « Nico ont validé » — le pluriel seulement quand ils sont plusieurs.
  const pl = !!(e.eq && EQ[e.eq].ini && EQ[e.eq].ini.length > 1);
  const verbe = e.type === 'valide' ? (e.eq ? (pl ? 'ont validé ' : 'a validé ') : 'avez validé ') : (e.eq ? (pl ? 'ont commencé ' : 'a commencé ') : 'avez commencé ');
  return { titre: qui + ' ' + verbe + tt.art, sous: e.type === 'valide' ? p.nom + ', ' + haTxt(p.ha) : p.nom };
}
function htmlEv(e) {
  const tx = texteEv(e);
  const ic = e.eq ? '<span class="ck-duo">' + EQ[e.eq].ini.map(i => '<span class="ck-av">' + i + '</span>').join('') + '</span>'
    : '<span class="ck-ic-rond ck-ic-vous">' + ICO.ok + '</span>';
  return '<li class="ck-ev ck-ev-' + e.type + '" data-id="' + e.id + '"><span class="ck-ev-ic">' + ic + '</span>'
    + '<span class="ck-ev-tx"><span class="ck-ev-t">' + esc(tx.titre) + '</span><span class="ck-ev-s">' + esc(tx.sous) + (e.par === 'vous' && e.eq ? ', validé par vous' : '') + '</span></span>'
    + '<span class="ck-ev-d"><time data-ts="' + e.ts + '">' + ilYa(e.ts) + '</time>' + (e.type === 'valide' ? '<span class="ck-ev-h">+' + nb(e.h) + '\u202fh</span>' : '') + '</span></li>';
}
function htmlFil() {
  return '<header class="ck-p-hd"><div><h2 class="ck-titre-p"><span class="ck-pt-vif ck-pt-fil" aria-hidden="true"></span>En direct</h2>'
    + '<p class="ck-cadre">Ce que l’équipe valide et commence, au fil de la journée</p></div></header>'
    + '<ol class="ck-fil-l' + (S.filTout ? ' tout' : '') + '" id="ck-fil-l">' + S.evts.map(htmlEv).join('') + '</ol>'
    + '<p class="ck-vide" id="ck-fil-vide"' + (S.evts.length ? ' hidden' : '') + '>Rien encore aujourd’hui. Les validations et les débuts de chantier de l’équipe s’afficheront ici.</p>'
    + '<button type="button" class="ck-btn ck-btn-ghost ck-btn-s ck-fil-tout" id="ck-fil-tout" aria-expanded="' + S.filTout + '"' + (S.evts.length > 4 ? '' : ' hidden') + '>' + (S.filTout ? 'Replier' : 'Tout le fil') + '</button>';
}

/* ── Les graphes — grammaire du kit (MV_GRAPH_COL) : la mesure en terre, le prévu en or,
   le fait en vert, le repère du jour en rouge, tout texte en texte-doux, une unité = un pixel. ── */
function cadre(w, ymax, grand) {
  // PRO-1 (§269) : en grand (« Agrandir »), la hauteur suit l'écran.
  const etroit = w < 560, h = grand ? Math.round(Math.max(300, Math.min(window.innerHeight * .62, w * .5))) : (etroit ? 230 : 270);
  const c = { w, h, etroit, padL: etroit ? 40 : 58, padR: 18, padT: 34, padB: 30, ymax };
  c.iw = w - c.padL - c.padR; c.ih = h - c.padT - c.padB;
  c.X = d => c.padL + (d - DEBUT) / (XMAX - DEBUT) * c.iw;
  c.Y = v => c.padT + c.ih * (1 - v / ymax);
  return c;
}
// PRO-1 (§269) : un pas rond (1, 2, 2,5 ou 5 × 10ⁿ). Les graduations étaient celles de la démonstration (0 à 2 500).
function pasNet(max, n) {
  const brut = Math.max(1, max) / Math.max(1, n), p = Math.pow(10, Math.floor(Math.log10(brut))), q = brut / p;
  return (q <= 1 ? 1 : q <= 2 ? 2 : q <= 2.5 ? 2.5 : q <= 5 ? 5 : 10) * p;
}
const f1 = v => v.toFixed(1);
function moisReperes() {
  const r = [[DEBUT, MOIS_C[DEBUT.getUTCMonth()]]];
  for (let d = J(DEBUT.getUTCFullYear(), DEBUT.getUTCMonth() + 2, 1); d <= XMAX; d = J(d.getUTCFullYear(), d.getUTCMonth() + 2, 1)) r.push([d, MOIS_C[d.getUTCMonth()]]);
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
  const ecart = c.etroit ? 30 : 38, L = moisReperes(); let der = -1e9;
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
function htmlCourbe(w) {
  const pas = pasNet(TOTAL, w < 560 ? 3 : 5), ymax = Math.max(pas, Math.ceil(TOTAL / pas) * pas), ticks = [];
  for (let v = 0; v <= ymax + 1e-6; v += pas) ticks.push(v);
  const c = cadre(w, ymax, G.grand); G.c = c; G.w = w;
  let s = axes(c, ticks, 'h');
  s += '<path id="ck-c-aire" class="ck-c-aire"/><path id="ck-c-besoin" class="ck-c-besoin"/><path id="ck-c-proj" class="ck-c-proj"/>'
    + '<path id="ck-c-ligne" class="ck-c-ligne"/><circle id="ck-c-pt" class="ck-c-pt" r="4.5"/>'
    + '<g id="ck-c-fin"><rect class="ck-c-fin" x="-5" y="-5" width="10" height="10" rx="1.5" transform="rotate(45)"/><text id="ck-c-fin-l" class="ck-c-txt ck-c-fin-l" y="-13" text-anchor="middle"></text></g>'
    + '<line id="ck-c-guide" class="ck-c-guide" y1="' + c.padT + '" y2="' + (c.h - c.padB) + '"/><circle id="ck-c-gpt" class="ck-c-gpt" r="4"/>'
    + '<rect class="ck-c-zone" x="' + c.padL + '" y="0" width="' + c.iw + '" height="' + c.h + '"/>';
  return '<svg viewBox="0 0 ' + c.w + ' ' + c.h + '" width="' + c.w + '" height="' + c.h + '" role="img" aria-label="Charge restante de la campagne : mesurée jusqu’à aujourd’hui, puis projetée jusqu’à la fin prévue">' + s + '</svg>'
    + '<div class="ck-tip" id="ck-tip" aria-hidden="true"></div>';
}
function dessinerCourbe(reste, fin) {
  const c = G.c; if (!c) return;
  const pts = HIST.filter(o => o.d < AUJ && o.d >= DEBUT).map(o => [c.X(o.d), c.Y(o.r)]);
  pts.push([c.X(AUJ), c.Y(reste)]);
  const ligne = pts.length > 1 ? 'M' + pts.map(p => f1(p[0]) + ' ' + f1(p[1])).join('L') : '';
  const y0 = c.Y(0), xa = c.X(AUJ), ya = c.Y(reste), xf = c.X(fin), xv = c.X(VISEE);
  $('#ck-c-ligne').setAttribute('d', ligne);
  // PRO-1 (§269) : la zone mesurée part de la PREMIÈRE photo. Elle partait du début de la période : un grand triangle
  //   (ou, avec deux jours de photos, une grosse barre verticale) là où rien n'a été mesuré.
  $('#ck-c-aire').setAttribute('d', ligne ? 'M' + f1(pts[0][0]) + ' ' + f1(y0) + 'L' + ligne.slice(1) + 'L' + f1(xa) + ' ' + f1(y0) + 'Z' : '');
  $('#ck-c-proj').setAttribute('d', 'M' + f1(xa) + ' ' + f1(ya) + 'L' + f1(xf) + ' ' + f1(y0));
  $('#ck-c-besoin').setAttribute('d', 'M' + f1(xa) + ' ' + f1(ya) + 'L' + f1(xv) + ' ' + f1(y0));
  const pt = $('#ck-c-pt'); pt.setAttribute('cx', f1(xa)); pt.setAttribute('cy', f1(ya));
  $('#ck-c-fin').setAttribute('transform', 'translate(' + f1(xf) + ' ' + f1(y0) + ')');
  const fl = $('#ck-c-fin-l'); if (fl) fl.setAttribute('text-anchor', xf > c.w - c.padR - 30 ? 'end' : 'middle');
}

/* ══ VUE ÉCONOMIE ══ */
function htmlEVerdict(r) {
  return '<div class="ck-v-haut"><span class="ck-v-k">Atterrissage de la campagne</span><span class="ck-etat" id="ck-ev-etat"></span></div>'
    + '<h2 class="ck-v-phrase">La campagne devrait coûter <span class="ck-roule" id="ck-ev-att"><span>' + eur100(r.att) + '</span></span>.</h2>'
    + '<p class="ck-v-sous"><span id="ck-ev-sous"></span>, au rythme mesuré de l’équipe.' + btnI('atterrissage', 'Comment l’atterrissage est calculé') + '</p>'
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
const GE = { c: null, w: 0, fait: null, dep: null, att: null, fin: null };
function htmlEChart(w) {
  const c = cadre(w, 100); GE.c = c; GE.w = w;
  let s = axes(c, c.etroit ? [0, 50, 100] : [0, 25, 50, 75, 100], '%');
  s += '<line class="ck-e-budget" x1="' + c.padL + '" x2="' + (c.w - c.padR) + '" y1="' + f1(c.Y(100)) + '" y2="' + f1(c.Y(100)) + '"/>'
    + '<path id="ck-e-ecart" class="ck-e-ecart"/><path id="ck-e-pfait" class="ck-e-pfait"/><path id="ck-e-pdep" class="ck-e-pdep"/>'
    + '<path id="ck-e-fait" class="ck-e-fait"/><path id="ck-e-dep" class="ck-e-dep"/>'
    + '<g id="ck-e-bout"><circle class="ck-e-bf" r="4.5"/><text class="ck-c-txt ck-e-lf" text-anchor="end" x="-9" y="4">100 % fait</text></g>'
    + '<g id="ck-e-bout2"><rect class="ck-c-fin" x="-5" y="-5" width="10" height="10" rx="1.5" transform="rotate(45)"/><text id="ck-e-ld" class="ck-c-txt ck-e-ld" text-anchor="end" x="-10" y="16"></text></g>'
    + '<line id="ck-e-guide" class="ck-c-guide" y1="' + c.padT + '" y2="' + (c.h - c.padB) + '"/>'
    + '<rect class="ck-c-zone" x="' + c.padL + '" y="0" width="' + c.iw + '" height="' + c.h + '"/>';
  return '<svg viewBox="0 0 ' + c.w + ' ' + c.h + '" width="' + c.w + '" height="' + c.h + '" role="img" aria-label="Main-d’œuvre : part du budget dépensée face à la part du travail faite, puis projetées jusqu’à la fin prévue">' + s + '</svg>'
    + '<div class="ck-tip" id="ck-etip" aria-hidden="true"></div>';
}
function dessinerEChart(fait, dep, att, fin) {
  const c = GE.c; if (!c) return;
  const bud = TOTAL * (1 + MARGE_BUDGET) * TAUX;
  const pf = HIST.map(o => [c.X(o.d), c.Y((TOTAL - o.r) / TOTAL * 100)]), pd = (HIST.some(o => o.c != null) ? HIST.filter(o => o.c != null) : [{ d: AUJ, c: R.moDep }]).map(o => [c.X(o.d), c.Y(o.c / bud * 100)]);
  pf.push([c.X(AUJ), c.Y(fait)]); pd.push([c.X(AUJ), c.Y(dep)]);
  const ch = pts => 'M' + pts.map(p => f1(p[0]) + ' ' + f1(p[1])).join('L');
  $('#ck-e-fait').setAttribute('d', ch(pf));
  $('#ck-e-dep').setAttribute('d', ch(pd));
  $('#ck-e-ecart').setAttribute('d', ch(pf) + 'L' + pd.slice().reverse().map(p => f1(p[0]) + ' ' + f1(p[1])).join('L') + 'Z');
  const xa = c.X(AUJ), xf = c.X(fin);
  $('#ck-e-pfait').setAttribute('d', 'M' + f1(xa) + ' ' + f1(c.Y(fait)) + 'L' + f1(xf) + ' ' + f1(c.Y(100)));
  $('#ck-e-pdep').setAttribute('d', 'M' + f1(xa) + ' ' + f1(c.Y(dep)) + 'L' + f1(xf) + ' ' + f1(c.Y(att)));
  $('#ck-e-bout').setAttribute('transform', 'translate(' + f1(xf) + ' ' + f1(c.Y(100)) + ')');
  $('#ck-e-bout2').setAttribute('transform', 'translate(' + f1(xf) + ' ' + f1(c.Y(att)) + ')');
  $('#ck-e-ld').textContent = nb(att) + '\u202f% du budget';
}
function htmlPostes(r) {
  const lignes = [{ id: 'mo', nom: 'Main-d’œuvre', note: nb(r.hR) + ' h réelles, à ' + Number(TAUX || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + '\u202f€ de l’heure', budget: r.moBudget, dep: r.moDep, att: r.moAtt }].concat(POSTES);
  const max = Math.max(...lignes.map(l => Math.max(l.budget, l.att))) || 1;
  return entete('Par poste', 'Dépensé, et où chaque poste devrait atterrir', 'postes')
    + '<ul class="ck-po-l">' + lignes.map(l => {
      const ec = l.att - l.budget, ech = Math.max(l.budget, l.att) * 1.06;
      return '<li class="ck-po" data-po="' + l.id + '"><div class="ck-po-h"><span class="n">' + esc(l.nom) + '</span><span class="ck-po-d ' + (ec <= 0 ? 'ok' : 'ko') + '" id="ck-po-d-' + l.id + '">' + signe(ec) + '\u202f€</span></div>'
        + '<div class="ck-puce"><i class="bud" style="width:' + (l.budget / ech * 100).toFixed(1) + '%"></i><i class="dep" id="ck-po-b-' + l.id + '" style="width:0%"></i>'
        + '<i class="att" id="ck-po-a-' + l.id + '" style="left:' + (l.att / ech * 100).toFixed(1) + '%"></i></div>'
        + '<div class="ck-po-s"><span id="ck-po-s-' + l.id + '">' + eur(l.dep) + ' sur ' + eur(l.budget) + '</span><span>' + esc(l.note) + '</span></div></li>';
    }).join('')
    + '<li class="ck-po ck-po-tot"><div class="ck-po-h"><span class="n">Toute la campagne</span><span class="ck-po-d ok" id="ck-po-d-tot"></span></div>'
    + '<div class="ck-po-s"><span id="ck-po-s-tot"></span><span id="ck-po-a-tot"></span></div></li></ul>';
}
function htmlApps(r) {
  const max = Math.max(1, ...APPS.map(a => r.a[a.id].coutHa));
  const tri = APPS.filter(a => r.a[a.id].coutHa > 0).sort((x, y) => r.a[y.id].coutHa - r.a[x.id].coutHa), hi = tri[0], lo = tri[tri.length - 1];
  return entete('Par appellation', 'Main-d’œuvre engagée à l’hectare, à ce jour', 'apps')
    + '<ul class="ck-ap-l">' + APPS.map(a => {
      const x = r.a[a.id];
      return '<li class="ck-ap"><div class="ck-ap-h"><span class="n">' + esc(a.nom) + '</span><span class="v">' + nb(x.coutHa) + '\u202f€/ha</span></div>'
        + '<div class="ck-ap-b"><span class="ck-barre fine"><i class="b-terre" style="width:' + (x.coutHa / max * 100).toFixed(1) + '%"></i></span>'
        + (a.ecart != null ? '<span class="ck-ap-c ' + (a.ecart > 0.05 ? 'ko' : a.ecart < 0 ? 'ok' : '') + '">' + pct1(a.ecart * 100) + '</span>' : '') + '</div>'
        + '<div class="ck-ap-s">' + haTxt(x.ha) + ' en production</div></li>';
    }).join('') + '</ul>'
    + (hi && lo && hi !== lo && r.a[lo.id].coutHa > 0 ? '<p class="ck-ap-note">' + esc(hi.nom) + ' a demandé ' + nb((r.a[hi.id].coutHa / r.a[lo.id].coutHa - 1) * 100) + '\u00a0% de plus à l’hectare que ' + esc(lo.nom) + ', d’après les heures validées de la campagne.</p>' : '');
}
function htmlTaches(r) {
  const B = 10;
  return entete('Écart au barème, par tâche', 'Heures réelles face au barème, sur les parcelles validées', 'taches')
    + '<div class="ck-ta-ax" aria-hidden="true"><span>plus rapide</span><span>barème</span><span>plus lent</span></div>'
    + '<ul class="ck-ta-l">' + TACHES.map(t => {
      const x = r.t[t.id], e = x.ecart * 100, w = Math.min(B, Math.abs(e)) / B * 50;
      return '<li class="ck-ta" data-ta="' + t.id + '"><span class="ck-ta-n">' + esc(t.nom) + '</span>'
        + '<span class="ck-ta-b"><i class="ck-ta-zero"></i><i class="ck-ta-v ' + (e > 0 ? 'lent' : 'vite') + '" id="ck-ta-v-' + t.id + '" style="' + (e > 0 ? 'left:50%' : 'right:50%') + ';width:' + w.toFixed(1) + '%"></i></span>'
        + '<span class="ck-ta-e ' + (e > 0 ? 'lent' : 'vite') + '" id="ck-ta-e-' + t.id + '">' + pct1(e) + '</span>'
        + '<span class="ck-ta-s" id="ck-ta-s-' + t.id + '">' + nb(x.hF) + ' h de barème, ' + nb(x.hR) + ' h réelles</span></li>';
    }).join('') + '</ul>';
}

/* ═══ 8. LES MISES À JOUR — ciblées, animées, jamais un écran redessiné en entier ═══ */

const libEtat = (t, e) => ({ faite: T[t].f ? 'faite' : 'fait', cours: 'en cours', afaire: 'à faire', retard: 'en retard', arr: 'arrachée' }[e]);
const COUL = { faite: 'var(--et-faite-b)', cours: 'var(--et-cours-b)', afaire: 'var(--texte-doux)', retard: 'var(--et-retard-b)', arr: 'var(--texte-doux)' };

function majResume(r) {
  const n = savoirItems(r).filter(x => x.prio === 1).length;
  const temps = r.ecart > 0 ? r.ecart + ' jour' + (r.ecart > 1 ? 's' : '') + ' d’avance' : r.ecart < 0 ? -r.ecart + ' jours de retard' : 'pile à l’heure';
  const argent = !(V.eco && r.budget > 0) ? '' : (Math.abs(r.sous) < 100 ? 'dans le budget' : r.sous > 0 ? eur100(r.sous) + ' sous le budget' : eur100(-r.sous) + ' au-dessus du budget');
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
  $('#ck-ph-bud-c').textContent = 'de la main-d’œuvre, pour ' + nb(r.pct) + '\u00a0% du travail fait';
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
  const t = S.vue;
  $$('.ck-pa').forEach(el => {
    const id = el.dataset.id, e = etatVue(t, id);
    const cls = 'ck-pa et-' + e + (S.filtre === e ? ' f-on' : '');
    if (el.getAttribute('class') !== cls) el.setAttribute('class', cls);
    if (!PIDX[id].arr) el.setAttribute('aria-label', PIDX[id].nom + ', ' + AIDX[PIDX[id].app].nom + ', ' + haTxt(PIDX[id].ha) + ', ' + T[t].nom.toLowerCase() + ' ' + libEtat(t, e));
  });
  majEquipes();
  const n = { faite: 0, cours: 0, afaire: 0, retard: 0, arr: 0 };
  PARCS.forEach(p => { n[etatVue(t, p.id)]++; });
  LEG.forEach(([k]) => Anim.compter($('#ck-leg-' + k), n[k], nb, 600));
  APPS.forEach(a => {
    const x = R.a[a.id];
    $('#ck-zp-' + a.id).style.transform = 'scaleX(' + (x.pct / 100).toFixed(4) + ')';
    $('#ck-zp-' + a.id).setAttribute('class', 'ck-zone-prog' + (x.pct >= 99.95 ? ' fini' : ''));
    const zt = $('#ck-zt-' + a.id); if (zt) zt.textContent = T[t].nom + ' : ' + nb(x.pct) + '\u202f%';
  });
  const tot = S.equipes.filter(e => e.parc).length, ici = S.equipes.filter(e => e.parc && e.tache === t).length;
  $('#ck-plan-cadre').textContent = (tot ? tot + ' équipe' + (tot > 1 ? 's' : '') + ' sur le terrain, ' + (ici ? ici + ' sur ' + T[t].art : 'aucune sur ' + T[t].art) : 'Aucune équipe sur le terrain') + ', parcelles rangées par appellation';
  if (o.onde) onde(o.onde.pid, o.onde.etat, o.onde.t);
  if (S.sel) $('#ck-sel').setAttribute('d', dParc(PIDX[S.sel]));
}
function majEquipes() {
  const calque = $('#ck-calque');
  const vis = S.equipes.filter(e => e.parc && e.tache === S.vue);
  $$('.ck-eq', calque).forEach(m => {
    if (m.classList.contains('part')) return;
    if (!vis.some(e => e.id === m.dataset.eq)) { m.classList.add('part'); setTimeout(() => m.remove(), 420); }
  });
  vis.forEach(e => {
    const p = PIDX[e.parc], left = pX(p), top = pY(p);
    let m = calque.querySelector('.ck-eq[data-eq="' + e.id + '"]:not(.part)');
    if (!m) {
      m = document.createElement('div');
      m.className = 'ck-eq neuf';
      m.dataset.eq = e.id;
      m.title = EQ[e.id].noms;
      m.innerHTML = EQ[e.id].ini.map(i => '<span class="ck-av">' + i + '</span>').join('');
      m.style.left = left; m.style.top = top;
      calque.appendChild(m);
      requestAnimationFrame(() => requestAnimationFrame(() => m.classList.remove('neuf')));
    } else if (m.style.left !== left || m.style.top !== top) { m.style.left = left; m.style.top = top; }
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
    row.querySelector('.ck-ch-ret').textContent = x.etat === 'retard' ? ', fenêtre passée' : '';
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
}
function majEco(r) {
  if (!V.eco) return;
  Anim.rouler($('#ck-ev-att'), eur100(r.att));
  // PRO-1 (§269) : « 0 € sous le budget de… » quand l'atterrissage tombe sur le budget
  $('#ck-ev-sous').textContent = (Math.abs(r.sous) < 100 ? 'Dans le budget de ' : r.sous > 0 ? eur100(r.sous) + ' sous le budget de ' : eur100(-r.sous) + ' au-dessus du budget de ') + eur100(r.budget);
  const et = $('#ck-ev-etat');
  et.className = 'ck-etat ' + (r.sous >= 0 ? 'ok' : 'ko');
  et.textContent = r.sous >= 0 ? 'Sous le budget' : 'Au-dessus du budget';
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
    $('#ck-ef-dep').textContent = Math.abs(_pb - _pd) < .4 ? '' : 'Dépensé, ' + eur100(r.dep); }   // REF-2 : deux étiquettes trop proches ne se chevauchent pas
  $('#ck-ef-att').textContent = 'Atterrissage, ' + eur100(r.att);
  $('#ck-ef-bud').textContent = 'Budget, ' + eur100(r.budget);
  Anim.compter($('#ck-ek-ha'), r.coutHa);
  $('#ck-ek-ec').textContent = pct1(r.ecartMoy * 100);
  $('#ck-ek-cad-c').textContent = 'il en faut ' + nb(r.besoin) + ' pour finir le ' + dLong(VISEE);
  // Les postes : seule la main-d’œuvre bouge avec les validations.
  const lignes = [{ id: 'mo', budget: r.moBudget, dep: r.moDep, att: r.moAtt }].concat(POSTES);
  lignes.forEach(l => {
    const ech2 = Math.max(l.budget, l.att) * 1.06, ec = l.att - l.budget;
    $('#ck-po-b-' + l.id).style.width = (l.dep / ech2 * 100).toFixed(2) + '%';
    $('#ck-po-a-' + l.id).style.left = (l.att / ech2 * 100).toFixed(2) + '%';
    const d = $('#ck-po-d-' + l.id);
    d.textContent = signe(ec) + '\u202f€';
    d.className = 'ck-po-d ' + (ec <= 0 ? 'ok' : 'ko');
    $('#ck-po-s-' + l.id).textContent = eur(l.dep) + ' sur ' + eur(l.budget);
  });
  const dt = $('#ck-po-d-tot');
  dt.textContent = signe(r.att - r.budget) + '\u202f€';
  dt.className = 'ck-po-d ' + (r.att <= r.budget ? 'ok' : 'ko');
  $('#ck-po-s-tot').textContent = eur(r.dep) + ' dépensés sur ' + eur(r.budget);
  $('#ck-po-a-tot').textContent = 'atterrissage ' + eur(r.att);
  TACHES.forEach(t => {
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
  const fa = r.hF / TOTAL * 100, de = r.moDep / r.moBudget * 100, at = r.moAtt / r.moBudget * 100;
  const f0 = GE.fait != null ? GE.fait : fa, d0 = GE.dep != null ? GE.dep : de, a0 = GE.att != null ? GE.att : at, fin0 = GE.fin || r.fin;
  GE.fait = fa; GE.dep = de; GE.att = at; GE.fin = r.fin;
  if (S.mode !== 'eco') { dessinerEChart(fa, de, at, r.fin); return; }
  Anim.tween(720, k => dessinerEChart(lerp(f0, fa, k), lerp(d0, de, k), lerp(a0, at, k), new Date(lerp(+fin0, +r.fin, k))));
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

let infoBtn = null;
function ouvrirInfo(btn) {
  const pop = $('#ck-pop');
  if (infoBtn === btn) { fermerInfo(); return; }
  fermerInfo();
  infoBtn = btn;
  btn.setAttribute('aria-expanded', 'true');
  pop.querySelector('p').textContent = INFO[btn.dataset.info] || '';
  pop.hidden = false;
  const b = btn.getBoundingClientRect(), pw = Math.min(320, window.innerWidth * .86);
  pop.style.width = pw + 'px';
  const ph = pop.offsetHeight;
  let x = Math.max(12, Math.min(window.innerWidth - pw - 12, b.left + b.width / 2 - pw / 2));
  let y = b.bottom + 10;
  if (y + ph > window.innerHeight - 12) y = Math.max(12, b.top - ph - 10);
  pop.style.left = x + 'px'; pop.style.top = y + 'px';
  pop.style.setProperty('--ox', (b.left + b.width / 2 - x) + 'px');
  pop.style.setProperty('--oy', (y > b.top ? '0px' : ph + 'px'));
  requestAnimationFrame(() => pop.classList.add('ouvert'));
}
function fermerInfo() {
  const pop = $('#ck-pop');
  if (infoBtn) infoBtn.setAttribute('aria-expanded', 'false');
  infoBtn = null;
  pop.classList.remove('ouvert');
  pop.hidden = true;
}
function survoler(pid) {
  const et = $('#ck-etiq'), sv = $('#ck-survol');
  const id = pid || S.sel;
  if (!id) { et.hidden = true; sv.setAttribute('d', ''); return; }
  const p = PIDX[id], e = etatVue(S.vue, id);
  sv.setAttribute('d', pid ? dParc(p) : '');
  et.style.left = pX(p);
  et.style.top = pY(p);
  et.style.setProperty('--c', COUL[e]);
  et.querySelector('span').innerHTML = '<b>' + esc(p.nom) + '</b>\u2002' + haTxt(p.ha);
  et.hidden = false;
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
  if (!reduit()) $$('.ck-pa').forEach(el => { el.style.transitionDelay = Math.round(PIDX[el.dataset.id].cx / 1000 * 260) + 'ms'; });
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
  if (!box || box.offsetParent === null) return;
  const w = Math.round(box.clientWidth);
  if (!w || (!force && Math.abs(w - G.w) < 3)) return;
  box.innerHTML = htmlCourbe(w);
  dessinerCourbe(G.reste, G.fin);
  $('#ck-c-fin-l').textContent = dCourt(G.fin);
}
function redimEChart(a) { if (!V.eco) return; return redimEChart0(a); }
function redimEChart0(force) {
  const box = $('#ck-egr');
  if (!box || box.offsetParent === null) return;
  const w = Math.round(box.clientWidth);
  if (!w || (!force && Math.abs(w - GE.w) < 3)) return;
  box.innerHTML = htmlEChart(w);
  const fa = R.hF / TOTAL * 100, de = R.moDep / R.moBudget * 100, at = R.moAtt / R.moBudget * 100;
  GE.fait = fa; GE.dep = de; GE.att = at; GE.fin = R.fin;
  dessinerEChart(fa, de, at, R.fin);
}
function jourSous(ev, c, svg) {
  const rc = svg.getBoundingClientRect(), k = (ev.clientX - rc.left - c.padL) / c.iw;
  if (k < 0 || k > 1) return null;
  const brut = new Date(+DEBUT + k * (XMAX - DEBUT));
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
  const bud = R.moBudget;
  let fa, de, quoi = '';
  if (jour < AUJ) { const h = HIST.find(o => +o.d === +jour) || HIST[HIST.length - 1]; fa = (TOTAL - h.r) / TOTAL * 100; de = h.c / bud * 100; }
  else if (jour <= GE.fin) { const k = (jour - AUJ) / Math.max(1, GE.fin - AUJ); fa = lerp(GE.fait, 100, k); de = lerp(GE.dep, GE.att, k); if (+jour > +AUJ) quoi = ', projection'; }
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
function ouvrirFeuille(pid) { const p = PIDX[pid]; if (p && !p.arr && typeof window.openSelParc === 'function') window.openSelParc(p.nom); }


const RANGS = {
  t: { large: [['verdict', 'decision', 'fil'], ['plan', 'chant', 'courbe'], ['savoir']],
       moyen: [['verdict', 'savoir', 'decision'], ['plan', 'fil', 'chant', 'courbe'], []],
       petit: [['verdict', 'savoir', 'decision', 'plan', 'fil', 'chant', 'courbe'], [], []] },
  e: { large: [['ever', 'ekpi'], ['echart', 'etac'], ['epos', 'eapp']],
       moyen: [['ever', 'ekpi', 'epos'], ['echart', 'etac', 'eapp'], []],
       petit: [['ever', 'ekpi', 'echart', 'epos', 'eapp', 'etac'], [], []] },
};
let rangerRaf = 0, redimT = 0;
function rangerBientot() { if (!rangerRaf) rangerRaf = requestAnimationFrame(() => { rangerRaf = 0; ranger(); }); }
function ranger() {
  const pg = $('#ck-page');
  // PRO-1 (§269) : le cockpit a quitté l'écran (autre onglet, autre module) — l'observateur restait branché sur la
  //   page disparue et plantait à chaque redimensionnement (« reading 'clientWidth' », journalisé en erreur).
  if (!pg) { if (obs) { obs.disconnect(); obs = null; } return; }
  const w = pg.clientWidth - 2 * parseFloat(getComputedStyle(pg).paddingLeft || 0);
  const taille = w >= 1150 ? 'large' : w >= 820 ? 'moyen' : 'petit';
  if (pg.dataset.taille !== taille) {
    pg.dataset.taille = taille;
    ['t', 'e'].forEach(v => RANGS[v][taille].forEach((ids, k) => {
      const col = $('#ck-' + v + '-' + 'abc'[k]); if (!col) return;
      ids.forEach(id => { const el = $('#ck-' + id); if (el) col.appendChild(el); });
    }));
  }
  // PRO-1 : les graphes suivent TOUTE nouvelle largeur (ils ne se redessinaient qu'au changement de disposition : la
  //   barre latérale repliée ou dépliée les laissait trop larges ou trop étroits), une fois la largeur posée.
  clearTimeout(redimT); redimT = setTimeout(() => { if ($('#ck-page')) { redimCourbe(false); redimEChart(false); } }, 140);
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
    + '<div class="ck-gr-leg" aria-hidden="true"><span><i class="lg-fait"></i>Travail fait</span><span><i class="lg-mes"></i>Budget dépensé</span><span><i class="lg-ecart"></i>Avance sur le budget</span></div>';
  $('#ck-epos').innerHTML = htmlPostes(R);
  $('#ck-eapp').innerHTML = htmlApps(R);
  $('#ck-etac').innerHTML = htmlTaches(R);
  G.reste = R.reste; G.fin = R.fin;
  $('#ck-savoir').dataset.h = htmlSavoir(R);
}function entree() {
  const r = R;
  majResume(r); majVerdict(r); majDecision(r); majPlan(); majChantiers(r); majCourbe(r); majEco(r);
  redimCourbe(true);
  const carte = $('#ck-carte');
  if (carte.scrollWidth > carte.clientWidth + 4) carte.scrollLeft = (carte.scrollWidth - carte.clientWidth) / 2;
  const fin = () => {
    Anim.compter($('#ck-ph-trav'), r.pct, nb, 1100);
    Anim.compter($('#ck-ph-eff'), V.presents, nb, 700);
    Anim.compter($('#ck-ph-bud'), r.budgetPct, nb, 1100);
    Anim.compter($('#ck-ph-conf'), V.confN || 0, nb, 0);
  };
  if (reduit()) { fin(); $('#ck-page').classList.remove('ck-entree'); return; }
  // Un seul moment orchestré : le plan se dessine de gauche à droite, les chiffres montent,
  // la courbe se trace. Ensuite, plus rien ne bouge sans raison.
  $$('.ck-pa').forEach(el => { el.style.transitionDelay = Math.round(PIDX[el.dataset.id].cx / 1000 * 520) + 'ms'; });
  requestAnimationFrame(() => requestAnimationFrame(() => {
    $('#ck-page').classList.remove('ck-entree');
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
  document.addEventListener('click', ev => {
    if (!document.getElementById('ck-page')) return;       // le cockpit n'est pas à l'écran
    const i = ev.target.closest('.ck-i');
    if (i) { ev.stopPropagation(); ouvrirInfo(i); return; }
    if (!ev.target.closest('#ck-pop')) fermerInfo();
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
    const og = ev.target.closest('[data-onglet]');
    if (og) { choisirOnglet(og.dataset.onglet); return; }
    const mod = ev.target.closest('[data-module]');
    if (mod) { if (typeof window.goTo === 'function') window.goTo(mod.dataset.module); return; }
    const plus = ev.target.closest('#ck-fil-tout, #ck-sv-tout');
    if (plus) {
      const l = plus.id === 'ck-fil-tout' ? $('#ck-fil-l') : $('#ck-sv-l'), on = !l.classList.contains('tout');
      l.classList.toggle('tout', on); plus.setAttribute('aria-expanded', String(on));
      if (plus.id === 'ck-fil-tout') S.filTout = on; else S.svTout = on;
      plus.textContent = on ? 'Replier' : (plus.id === 'ck-fil-tout' ? 'Tout le fil' : 'Tout voir (' + savoirItems(R).length + ')');
    }
  });
  document.addEventListener('keydown', ev => {
    if (ev.key !== 'Escape') return;
    const b = document.getElementById('ck-agr'); if (b && !b.hidden) { agrandir(false); return; }
    if (document.getElementById('ck-pop')) fermerInfo();
  });
}
function brancherPlan() {
  const svg = $('#ck-svg'); if (!svg || svg._ck) return; svg._ck = 1;
  svg.addEventListener('pointerover', ev => { const pa = ev.target.closest('.ck-pa'); if (pa && !PIDX[pa.dataset.id].arr) survoler(pa.dataset.id); });
  svg.addEventListener('pointerleave', () => survoler(null));
  svg.addEventListener('click', ev => { const pa = ev.target.closest('.ck-pa'); if (pa) ouvrirFeuille(pa.dataset.id); });
  svg.addEventListener('keydown', ev => { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.classList && ev.target.classList.contains('ck-pa')) { ev.preventDefault(); ouvrirFeuille(ev.target.dataset.id); } });
  svg.addEventListener('focusin', ev => { if (ev.target.classList && ev.target.classList.contains('ck-pa')) survoler(ev.target.dataset.id); });
  svg.addEventListener('focusout', () => survoler(null));
  // Les graphes suivent la souris (la maquette les branchait au montage de sa page).
  const gr = $('#ck-gr'); if (gr && !gr._ck) { gr._ck = 1; gr.addEventListener('pointermove', suivreCourbe); gr.addEventListener('pointerleave', cacherTip); }
  const egr = $('#ck-egr'); if (egr && !egr._ck) { egr._ck = 1; egr.addEventListener('pointermove', suivreEChart); egr.addEventListener('pointerleave', cacherTip); }
}
function heures() { $$('.ck-ev time').forEach(t => { t.textContent = ilYa(+t.dataset.ts); }); }
window._ck2Monter = function (v) {
  if (!document.getElementById('ck-page')) return;
  agrandiOublier();
  charger(v); R = calc();
  G.reste = R.reste; G.fin = R.fin; GE.fin = R.fin;   // l'état des graphes : la maquette le prenait au chargement
  monter(); brancherPlan(); ranger();
  if (!branche) { brancher(); branche = true; setInterval(heures, 30000); }
  if ('ResizeObserver' in window) { if (obs) obs.disconnect(); obs = new ResizeObserver(() => rangerBientot()); obs.observe($('#ck-page')); }
  placerInd($('.ck-seg [aria-selected="true"]'), $('.ck-seg-ind'));
  placerInd($('.ck-bascule [aria-selected="true"]'), $('.ck-bascule-ind'));
  SANS_MVT = !!window._ck2EntreeFaite; entree(); SANS_MVT = false; window._ck2EntreeFaite = true;
};
window._ck2Maj = function (v) { if (!document.getElementById('ck-page')) return; charger(v); majTout({}); };
})();
