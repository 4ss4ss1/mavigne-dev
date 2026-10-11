// HARNAIS — AUJ-7 (§309) : la vue Économie d'Aujourd'hui sur les vrais chiffres ; l'arrachage, travail à l'heure.
//   node scripts/mv-harnais-auj7.mjs           → doit être vert
//   node scripts/mv-harnais-auj7.mjs --contre  → chaque défaut réinjecté doit rougir
// A. EXÉCUTÉ dans l'appli entière (mv-app-node) sur un domaine d'automne : une réparation et une étape d'arrachage validées
//    le MÊME jour pour la même équipe, un prestataire, deux sessions tracteur, des taux horaires et le planning.
//    · le partage de la journée donne sa part à l'arrachage (il prenait 0 h : la réparation ramassait tout) ;
//    · les travaux à l'heure ont leur poste, leur budget est leur coût, la main-d'œuvre vigne les exclut ;
//    · l'écart de cadence ne compte ni le tracteur ni les travaux à l'heure ; la cadence ne touche que la main-d'œuvre ;
//    · la photo du cockpit : atterrissage = fin projetée, main-d'œuvre payée, somme des lignes = fin projetée, écart de la
//      campagne = écart de la main-d'œuvre, deux courbes datées qui ne font que monter, plus de « cadence » à 7 h.
// B. LU : l'affichage (jamais « −0 », la cadence de l'équipe, les tâches comparables, les appellations sans hectare, plus
//    d'aire verte), l'échelle de texte, l'espace fine fournie à chaque fonte.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');

// ── Le domaine (fictif) ─────────────────────────────────────────────────────
const iso = (m, d) => '2026-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
function modele() { const t = { _timings: {} }; for (let m = 0; m < 12; m++) { t[m] = {}; t._timings[m] = { d: '07:30', f: '15:30' };
  const nd = new Date(2026, m + 1, 0).getDate(); for (let d = 1; d <= nd; d++) { const w = new Date(2026, m, d).getDay(); t[m][d] = (w >= 1 && w <= 5) ? 7 : 0; } } return t; }
function domaine() {
  const P = [['A', .62, 'Gevrey-Chambertin'], ['B', .55, 'Gevrey-Chambertin'], ['C', .71, 'Gevrey-Chambertin'], ['D', .48, 'Morey-Saint-Denis'],
    ['E', .40, 'Morey-Saint-Denis'], ['F', .33, 'Bourgogne'], ['G', .80, 'Bourgogne'], ['Crais', .45, 'Bourgogne Aligoté']];
  let n = 0; const J = [], EQ = ['Paul', 'Marc', 'Inès'];
  const v = (m, d, parc, tache, eq, x) => J.push(Object.assign({ id: (new Date(2026, m, d, 16).getTime()).toString(16) + String(n++).padStart(3, '0'), date: iso(m, d), parcelle: parc, tache, qui: 'Lucie', statut: 'Validé', equipe: eq.length > 0, membresEquipe: eq }, x || {}));
  v(8, 22, 'A', 'Reparation', EQ); v(8, 24, 'B', 'Reparation', EQ); v(8, 25, 'C', 'Reparation', EQ); v(8, 29, 'D', 'Reparation', EQ); v(9, 5, 'E', 'Reparation', EQ);
  v(8, 23, 'A', 'Palissage', EQ); v(9, 2, 'B', 'Palissage', EQ);
  v(8, 30, 'Crais', 'Arrachage', ['Paul', 'Marc'], { etape: 'dem', etapeLbl: 'Démontage' });
  v(9, 1, 'Crais', 'Arrachage', ['Paul', 'Marc'], { etape: 'sou', etapeLbl: 'Souches' });
  v(9, 1, 'F', 'Reparation', ['Paul', 'Marc', 'Inès']);                                                      // ← le jour MÊLÉ
  v(9, 2, 'Crais', 'Arrachage', [], { etape: 'ram', etapeLbl: 'Ramassage', presta: true, prestaNom: 'Viti', prestaMontant: 1450, prestaFact: 'F-1' });
  return {
    config: { domaine_nom: 'Essai', visuSaison: 'Automne 2026', features: {}, eco: { prix_gnr_litre: 1.15, conso_gnr_lh: 6, h_jour: 7 },
      arrachage: { etapes: [{ id: 'dem', lbl: 'Démontage', presta: false }, { id: 'sou', lbl: 'Souches', presta: false }, { id: 'ram', lbl: 'Ramassage', presta: true }], apres: '*' },
      objectifs_fin: { 'Automne 2026': '2026-11-20' }, photo: [] },
    saisons: [{ nom: 'Automne 2026', active: true, debut: '2026-09-21', fin: '2026-11-27', taches: ['Reparation', 'Palissage', 'Arrachage'] }],
    taches: [{ nom: 'Reparation', label: 'Réparation', hha: 45 }, { nom: 'Palissage', label: 'Palissage', hha: 30 }, { nom: 'Arrachage', label: 'Arrachage', anytime: true, tempsReel: true, complementaire: true }],
    parcelles: P.map(([nom, surface, appellation]) => { const p = { nom, surface, appellation, commune: 'Gevrey-Chambertin', statut: 'Actif', taches: {
      Reparation: J.some(j => j.parcelle === nom && j.tache === 'Reparation') ? 'Validé' : 'Non démarré', Palissage: J.some(j => j.parcelle === nom && j.tache === 'Palissage') ? 'Validé' : 'Non démarré' } };
      if (nom === 'Crais') { p.statut = 'Arrachee'; p.dateArrachage = '2026-10-02'; p.taches = { Arrachage: 'Validé' }; } return p; }),
    tracteurs_list: [{ id: 'tr1', nom: 'Enjambeur', type: 'Enjambeur' }], activites: [{ nom: 'Labour', tracteurDefautId: 'tr1', h_ha: 3 }],
    sessions: [{ id: 's1', date: '2026-09-25', activite: 'Labour', conducteur: 'Marc', statut: 'Terminé', tracteurId: 'tr1', parcellesFaites: [{ nom: 'G', dmin: 150 }] }],
    traitements: [], journal: J.reverse(),
    paie: { taux: { Lucie: 21.4, Paul: 18.6, Marc: 18.9, Inès: 17.8 } },
    planning_templates: { 2026: { standard: modele() } }, planning_entries: {}, planning_hsup: {},
    membres: ['Lucie', 'Paul', 'Marc', 'Inès'].map((nom, i) => ({ nom, email: nom.toLowerCase().replace('è', 'e') + '@essai.test', roles: i ? ['ouvrier'] : ['admin', 'ouvrier'], statut: 'Actif', type_contrat: 'CDI', planning_id: 'standard' })),
  };
}
const ORDRE = ['config', 'saisons', 'taches', 'parcelles', 'tracteurs_list', 'activites', 'sessions', 'traitements', 'journal', 'paie', 'planning_templates', 'planning_entries', 'planning_hsup', 'membres'];

// ── A. Le moteur et la photo, exécutés ─────────────────────────────────────
async function partieA(pil, T) {
  const tmp = path.join(os.tmpdir(), 'mv-auj7-' + process.pid + '-' + Math.random().toString(36).slice(2) + '.js');
  fs.writeFileSync(tmp, pil + '\nwindow._pecData=_pecData; window._ecoTempsVigne=_ecoTempsVigne; window._pilMargeCalc=_pilMargeCalc;\n');
  // pathToFileURL : sous Windows, un chemin « C:\… » passé à import() se lit comme un schéma (C26 du preflight).
  const { chargerApp } = await import(pathToFileURL(path.join(R, 'scripts', 'mv-app-node.mjs')).href + '?' + Math.random());
  let A;
  try { A = await chargerApp({ remplace: { 'pilotage.js': tmp } }); } finally { fs.rmSync(tmp, { force: true }); }
  const { G, setAuj, JOURNAL_ERR } = A;
  setAuj([2026, 9, 8]);
  const D = domaine(), cles = {}; ORDRE.forEach(k => { cles[k] = D[k]; }); A.poser(cles);
  const TV = G._ecoTempsVigne(), E = G._pecData(), d = G._pilData(), m = G._pilMargeCalc(d), V = G._pilCk2Modele(d, m), C = G._pilCk2Eco(d, V);
  const arr = (TV.taches || []).find(t => t.nom === 'Arrachage') || { h: 0 }, sou = (TV.etapes || []).find(x => x.id === 'sou') || { h: 0 };
  // L'étape « Souches » est validée le même jour que la réparation de F, par la même équipe : c'est elle qui prenait 0 h.
  T('A1 le jour mêlé donne sa part à l’arrachage : « Souches » ' + sou.h.toFixed(1) + ' h (la réparation ne ramasse plus tout)', sou.h > 5 && arr.hb === true);
  const hb = (E.postes || []).find(p => p.k === 'hb'), mo = (E.postes || []).find(p => p.k === 'mo');
  T('A2 un poste « Travaux à l’heure » dont le budget est le coût (' + (hb ? hb.fait.toFixed(0) : '—') + ' €)', !!hb && Math.abs(hb.fait - E.hbE) < .01 && Math.abs(hb.budget - hb.fait) < .01 && E.hbE > 0);
  T('A3 la main-d’œuvre vigne exclut les travaux à l’heure', !!mo && Math.abs(mo.fait - (E.moReel - E.hbE)) < .01);
  const budSans = E.budget - E.hbE;
  T('A4 le budget compte les travaux à l’heure (le « reste à engager » n’est plus mangé par l’arrachage)', E.hbE > 0 && Math.abs(E.resteE - Math.max(0, E.budget - E.engage)) < .01 && E.budget > budSans);
  T('A5 l’écart de cadence retire le tracteur ET les travaux à l’heure (' + (E.cad.hHb || 0).toFixed(1) + ' h)', E.cad.ok && E.cad.hHb > 20 && E.cad.hReel < (TV.hChamp - TV.hTrac) - 20);
  const k = E.cad.applic ? E.cad.ecart / 100 : 0;
  T('A6 la cadence ne touche que la main-d’œuvre : fin projetée = engagé + reste + reste de main-d’œuvre × écart', Math.abs(E.projFin - (E.engage + E.resteBar + E.tot.moR * k)) < .5);
  T('A7 l’atterrissage du cockpit EST la fin projetée (il valait le budget)', !!C && Math.abs(C.att - E.projFin) < .01 && Math.abs(C.att - C.budget) > 50);
  T('A8 la main-d’œuvre du cockpit est celle qui est payée, pas le barème du fait', !!C && Math.abs(C.moDep - mo.fait) < .01 && Math.abs(C.moDep - E.tot.moF) > 50);
  const somme = C ? C.moAtt + C.postes.reduce((s, p) => s + p.att, 0) : 0;
  T('A9 la somme des lignes tombe sur l’atterrissage (' + somme.toFixed(0) + ' / ' + (C ? C.att.toFixed(0) : '—') + ')', !!C && Math.abs(somme - C.att) < 1);
  T('A10 l’écart de la campagne est celui de la main-d’œuvre (les autres lignes n’ont pas d’écart inventé)', !!C && Math.abs((C.att - C.budget) - (C.moAtt - C.moBudget)) < 1 && C.postes.every(p => Math.abs(p.att - Math.max(p.dep, p.budget)) < .01));
  T('A11 plus de « cadence » prêtée à l’équipe (la journée de référence, 7 h)', !!C && !('cadence' in C));
  const S = (C && C.serie) || [], mono = k2 => S.every((o, i) => !i || o[k2] >= S[i - 1][k2] - 1e-9);
  T('A12 deux courbes datées du début de la période, qui ne font que monter (' + S.length + ' points)', S.length > 5 && S[0].d === '2026-09-21' && mono('dep') && mono('fait'));
  const z = S[S.length - 1] || {};
  T('A13 le dernier point = les chiffres du jour (payé / budget, travail fait)', Math.abs(z.dep - Math.round(C.moDep / C.moBudget * 1000) / 10) < .05 && Math.abs(z.fait - Math.round(E.avc * 10) / 10) < .05);
  T('A14 « Écart au barème, par tâche » : seulement les tâches au barème avec du travail validé', !!C && !('Arrachage' in C.ecTache) && 'Reparation' in C.ecTache);
  T('A15 aucune erreur avalée pendant les calculs', JOURNAL_ERR.length === 0, JOURNAL_ERR.slice(0, 2).map(o => o.msg).join(' | '));
}

// ── B. L'affichage, la feuille, les polices ────────────────────────────────
function partieB(S, T) {
  const vue = sansCom(S.vue), css = S.css, fc = S.fonts;
  T('B1 jamais « −0 » : le signe se pose après l’arrondi (montants et pourcentages)', /const signe = v => \{ const n = Math\.round\(v\);/.test(vue) && /const pct1 = v => \{ const n = Math\.round\(v \* 10\) \/ 10;/.test(vue));
  T('B2 la cadence affichée est celle de l’équipe', /r\.capMoy = v\.capMoy \|\| 0;/.test(vue) && !/v\.eco\.cadence/.test(vue));
  T('B3 plus d’aire verte ni de légende « Avance sur le budget »', !/ck-e-ecart/.test(vue) && !/Avance sur le budget/.test(vue));
  T('B4 un seul arrondi : l’atterrissage, la frise et la tête à l’euro', !/eur100\(r\.(att|sous|dep|budget)\)/.test(vue) && !/eur100\(-r\.sous\)/.test(vue));
  T('B5 les tâches dessinées et mises à jour sont les mêmes (comparables seulement)', /const tachesE = \(\) =>/.test(vue) && /L = tachesE\(\)/.test(vue) && /tachesE\(\)\.forEach/.test(vue) && !/  TACHES\.forEach\(t => \{\n    const x = r\.t\[t\.id\], e = x\.ecart/.test(vue));
  T('B6 une appellation sans hectare en production ne s’affiche pas', /APPS\.filter\(a => r\.a\[a\.id\] && r\.a\[a\.id\]\.ha > 0\)/.test(vue));
  T('B7 « Par poste » : un écart pour la main-d’œuvre et le total seulement, jamais « 0 »', /n === 0 \? 'au budget'/.test(vue) && /ref === 'proj'/.test(vue) && /'reste ' \+ eur\(/.test(vue));
  T('B8 l’échelle de texte : chiffres des tuiles à 24 px, lignes à 14, total à 16', /\.ck2 \.ck-ph-n\{font-size:var\(--pt-lg,24px\);font-weight:600\}/.test(css) && /\.ck2 \.ck-po-tot \.n,\.ck2 \.ck-po-tot \.ck-po-d\{font-size:var\(--pt-sm,16px\)/.test(css));
  const faces = (fc.match(/@font-face\s*\{[^}]*\}/g) || []), fines = faces.filter(b => /unicode-range:U\+202F;/.test(b) && /espace-fine\.woff2/.test(b)).length;
  T('B9 l’espace fine (U+202F) fournie à chacune des fontes (' + fines + ' / ' + (faces.length - fines) + ')', fines > 0 && fines === faces.length - fines && fs.existsSync(path.join(R, 'public/fonts/espace-fine.woff2')));
}

let ok = 0, ko = 0; const echecs = [];
const T = (nom, c, det) => { if (c) ok++; else { ko++; echecs.push(nom); if (!CONTRE) console.log('   ROUGE  ' + nom + (det ? '  → ' + det : '')); } };
const BASE = { pil: lire('src/pilotage.js'), vue: lire('src/cockpit-vue.js'), css: lire('src/styles.css'), fonts: lire('public/fonts/fonts.css') };

if (!CONTRE) {
  console.log('\n  MA VIGNE — Harnais AUJ-7 : la vue Économie sur les vrais chiffres, l’arrachage travail à l’heure\n');
  await partieA(BASE.pil, T); partieB(BASE, T);
  console.log(ko ? '\n' + ko + ' ROUGE(S) sur ' + (ok + ko) : '\nTOUT VERT — ' + ok + ' assertions');
  process.exit(ko ? 1 : 0);
}
// --contre : chaque défaut, réinjecté dans une copie, doit faire rougir au moins une assertion.
const DEFAUTS = [
  ['l’arrachage reprend 0 h le jour mêlé', 'pil', 'var qH=(nH&&nB)?((S>0)?(SH/S):(nH/L.length)):(nH?1:0);', 'var qH=nB?0:1;'],
  ['le budget oublie les travaux à l’heure', 'pil', '  budget += hbE;\n', '\n'],
  ['la cadence recompte l’arrachage', 'pil', 'Math.max(0, cadP.h - T.tracH - hbH)', 'Math.max(0, cadP.h - T.tracH)'],
  ['l’atterrissage redevient « dépensé + reste d’argent »', 'pil', '  var att=num(E.projFin);', '  var att=dep+num(E.resteE);'],
  ['la cadence multiplie aussi le tracteur et le GNR', 'pil', '(engage + resteBar + T.moR*ecart)', '(engage + resteBar*(1+ecart))'],
  ['le cockpit reprend le barème du fait pour la main-d’œuvre', 'pil', 'var moDep=num(Pk.mo?Pk.mo.fait:T.moF)', 'var moDep=num(T.moF)'],
  ['la journée de référence revient comme cadence', 'vue', '  r.capMoy = v.capMoy || 0;', '  r.capMoy = (v.eco && v.eco.cadence) || v.capMoy || 0;'],
  ['le « −0 » revient', 'vue', "const signe = v => { const n = Math.round(v);", "const signe = v => { const n = v;"],
  ['les tâches pas comparables reviennent', 'vue', "const B = 10, L = tachesE(),", "const B = 10, L = TACHES,"],
  ['une fonte perd son espace fine', 'fonts', "@font-face{font-family:'Outfit';font-style:normal;font-weight:600;font-display:swap;src:url('/fonts/espace-fine.woff2') format('woff2');unicode-range:U+202F;}\n", ''],
];
console.log('\n  MA VIGNE — Harnais AUJ-7, contre-épreuves (' + DEFAUTS.length + ')\n');
let mordent = 0;
for (const [nom, cle, avant, apres] of DEFAUTS) {
  if (BASE[cle].split(avant).length !== 2) { console.log('   ROUGE  ancre introuvable ou multiple : ' + nom); continue; }
  const S = Object.assign({}, BASE, { [cle]: BASE[cle].replace(avant, apres) });
  ok = 0; ko = 0; echecs.length = 0;
  try { await partieA(S.pil, T); partieB(S, T); } catch (e) { ko++; echecs.push('plantage : ' + e.message); }
  if (ko) { mordent++; console.log('   mord   ' + nom + '  (' + echecs[0] + ')'); } else console.log('   ROUGE  la contre-épreuve ne mord pas : ' + nom);
}
console.log(mordent === DEFAUTS.length ? '\nTOUT VERT — ' + mordent + '/' + DEFAUTS.length + ' contre-épreuves mordent' : '\n' + (DEFAUTS.length - mordent) + ' contre-épreuve(s) muette(s)');
process.exit(mordent === DEFAUTS.length ? 0 : 1);
