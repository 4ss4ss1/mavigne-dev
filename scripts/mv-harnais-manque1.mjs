// HARNAIS — MANQUE-1 (§357) : « Ce qu'il manque » du Pilotage — lisible jusqu'en bas, et des alertes vraies.
//   node scripts/mv-harnais-manque1.mjs           → doit être vert
//   node scripts/mv-harnais-manque1.mjs --contre  → chaque défaut réinjecté doit rougir
// Nico (18/10), capture du panneau : « en bas c'est coupé » ; « 1 alerte difficile à enlever car il n'y a pas de barème
// en h/ha (vérifie), me renvoyer à réglage pour apporter une correction n'est pas utile, trouve un autre moyen » ;
// « pour le traitement phyto tout est ok, je ne comprends donc pas la phrase ».
// A. src/pilotage.js EXÉCUTÉ dans l'appli entière (mv-app-node), avec src/app.js et src/comptes.js du lot : le moteur des
//    constats sur un domaine en hiver — temps réel, entreplantation, comptes, traitements —, la feuille, la porte « comptes ».
// B. src/comptes.js : la VRAIE _cptRafraichir, exécutée — elle redessine le Pilotage quand il est affiché.
// C. src/styles.css : le fondu d'entrée des pages ne reste plus appliqué (la cause du bas coupé, mesurée au navigateur).
// D. Ce qui se lit : l'aide, la fiche de fiabilité, le guide, la nouveauté.
import fs from 'fs'; import os from 'os'; import path from 'path'; import vm from 'vm';
import { fileURLToPath, pathToFileURL } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const BASE = { pil: lire('src/pilotage.js'), app: lire('src/app.js'), cpt: lire('src/comptes.js'), css: lire('src/styles.css'),
  uti: (lire('src/utils.js') + '\n' + lire('src/whats-new.js')), guide: lire('guide/11-pilotage.html') };
const { chargerApp } = await import(pathToFileURL(path.join(R, 'scripts/mv-app-node.mjs')).href);
const sansCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
// Le corps d'une fonction, par comptage d'accolades (déclaration `function X(` ou `window.X = function(`).
function corps(src, nom) {
  let i = src.indexOf('function ' + nom + '('); if (i < 0) i = src.indexOf('window.' + nom + ' = function('); if (i < 0) throw new Error('introuvable : ' + nom);
  let k = src.indexOf('{', i), n = 0;
  for (let j = k; j < src.length; j++) { if (src[j] === '{') n++; else if (src[j] === '}') { n--; if (!n) return src.slice(i, j + 1); } }
  throw new Error('accolades : ' + nom);
}
// Un domaine en hiver (18/10/2026) : la période porte Taille, Entreplantation, Arrachage, Désherbage ; le seul traitement est de juillet.
function domaine(o) {
  o = o || {};
  const mod = () => { const t = { _timings: {} }; for (let m = 0; m < 12; m++) { t[m] = {}; t._timings[m] = { d: '07:30', f: '16:00' }; const nd = new Date(2026, m + 1, 0).getDate();
    for (let d = 1; d <= nd; d++) { const w = new Date(2026, m, d).getDay(); t[m][d] = (w >= 1 && w <= 5) ? 7.5 : 0; } } return t; };
  const parc = [['Les Crais', 1.2], ['Champ Franc', 0.8], ['La Justice', 0.5]].map(([nom, surface]) => Object.assign({ nom, surface, statut: 'Actif', taches: {} }, (o.marques || {})[nom] != null ? { trous_marques: o.marques[nom] } : {}));
  return {
    config: { domaine_nom: 'Test', plantation_min_trou: 3 },
    membres: ['Nico', 'Victor'].map(n => ({ nom: n, statut: 'Actif', type_contrat: 'CDI', planning_id: 'standard', roles: ['ouvrier'], taux: 20, contrat_debut: '2020-01-01' })),
    planning_templates: { 2026: { standard: mod() }, 2027: { standard: mod() } }, planning_entries: {},
    saisons: [{ nom: 'Été 2026', active: false, debut: '2026-04-01', fin: '2026-09-30', taches: ['Palissage'] },
      { nom: 'Hiver 2026 - 2027', active: true, debut: '2026-10-01', fin: '2027-03-31', taches: ['Taille', 'Entreplantation', 'Arrachage', 'Desherbage'].concat(o.plusTaches || []) }],
    taches: [{ nom: 'Taille', hha: 70 }, { nom: 'Palissage', hha: 30 }, { nom: 'Entreplantation', anytime: true, trous: true },
      Object.assign({ nom: 'Arrachage', anytime: true, tempsReel: true, complementaire: true }, o.estimArr ? { hha: o.estimArr } : {}),
      { nom: 'Desherbage', anytime: true, tempsReel: true, complementaire: true }].concat(o.tachesEnPlus || []),
    parcelles: parc,
    traitements: [{ produit: 'Cuivre', date: '2026-07-10', dose: '2 kg/ha', dose_val: 2, dose_unit: 'kg/ha', parcelles: ['Les Crais'] }].concat(o.trt || []),
  };
}
async function partieA(S, T) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-manque1-'));
  const fp = path.join(tmp, 'pilotage.js'), fa = path.join(tmp, 'app.js'), fc = path.join(tmp, 'comptes.js');
  fs.writeFileSync(fp, S.pil + '\nwindow.__mq={ oublier:_pilExoOublier, diag:function(){ _PIL_DIAGC=null; return _pilDiag(); }, sheet:_pilDiagSheetHtml, phy:_ecoPhytoByParc, pec:_pecData };\n');
  fs.writeFileSync(fa, S.app); fs.writeFileSync(fc, S.cpt);
  const A = await chargerApp({ remplace: { 'pilotage.js': fp, 'app.js': fa, 'comptes.js': fc } }); fs.rmSync(tmp, { recursive: true, force: true });
  const { G, poser, setAuj, JOURNAL_ERR } = A;
  setAuj([2026, 9, 18]);
  const M = G.__mq;
  const scene = o => { poser(domaine(o)); M.oublier(); return M.diag(); };
  const e0 = JOURNAL_ERR.length;
  // 1) L'hiver, rien de compté
  const L1 = scene();
  let P = null; try { P = M.pec(); } catch (e) { P = null; }
  T('A0 le coût se calcule (sinon le constat phyto ne pourrait jamais parler : un vert vide)', !!(P && P.phy));
  T('A1 la période d’hiver n’a aucune ligne au registre : nLignes = 0 (le traitement de juillet est hors période)', !!(P && P.phy && P.phy.nLignes === 0 && P.phy.anyDose === false));
  T('A2 hiver sans traitement : aucun constat phyto (un zéro juste n’est pas un trou)', !L1.some(d => d.cible === 'phyto' || /dose/i.test(d.k)));
  T('A3 les tâches au temps passé (Arrachage, Desherbage) ne sont plus « sans barème »', !L1.some(d => /Arrachage|Desherbage/.test(d.k + ' ' + d.f)));
  const C1 = L1.filter(d => d.cible === 'comptes');
  T('A4 l’entreplantation a son constat à elle : « aucun pied compté », bouton « Saisir les comptes »', C1.length === 1 && C1[0].k === 'Entreplantation\u00a0: aucun pied compté' && C1[0].ou === 'Saisir les comptes' && C1[0].g === 'o');
  T('A5 …qui dit d’où vient son temps (pieds marqués, minutes par trou) et comment s’en défaire (zéro)', C1.length === 1 && /pieds marqués/.test(C1[0].f) && /3\u00a0min par trou/.test(C1[0].f) && /se compte à zéro/.test(C1[0].f));
  T('A6 plus aucun renvoi vers la roue crantée pour une tâche qui n’a pas de champ h/ha', !L1.some(d => d.cible === 'taches'));
  // 2) Un compte posé : l'entreplantation est chiffrée
  const L2 = scene({ marques: { 'Les Crais': 12 } });
  T('A7 un compte posé sur une parcelle : le constat de l’entreplantation s’en va', !L2.some(d => d.cible === 'comptes'));
  // 3) Toutes comptées à zéro : rien à planter
  const L3 = scene({ marques: { 'Les Crais': 0, 'Champ Franc': 0, 'La Justice': 0 } });
  T('A8 toutes les parcelles comptées à zéro : rien à planter, rien à réclamer', !L3.some(d => d.cible === 'comptes'));
  // 4) Une vraie tâche simple sans heures : la roue crantée, comme avant
  const L4 = scene({ plusTaches: ['Epamprage'], tachesEnPlus: [{ nom: 'Epamprage', hha: 0 }] });
  const B4 = L4.filter(d => d.cible === 'taches');
  T('A9 une tâche simple au champ h/ha vide reste signalée, seule, vers la roue crantée', B4.length === 1 && /Epamprage/.test(B4[0].f) && !/Arrachage|Entreplantation/.test(B4[0].f) && B4[0].k === '1 tâche sans barème h/ha');
  // 5) Une estimation facultative sur l'arrachage : comptée, toujours rien à dire
  const L5 = scene({ estimArr: 12 });
  T('A10 l’arrachage avec une estimation facultative : aucun constat non plus', !L5.some(d => /Arrachage/.test(d.k + ' ' + d.f)));
  // 6) Des traitements dans la période, sans dose chiffrée
  const trtSans = [{ produit: 'Soufre', date: '2026-10-12', dose: '6 kg/ha', parcelles: ['Les Crais'] }];
  const L6 = scene({ trt: trtSans });
  const F6 = L6.filter(d => d.cible === 'phyto');
  let P6 = null; try { P6 = M.pec(); } catch (e) { P6 = null; }
  T('A11 un traitement d’octobre sans dose chiffrée : nLignes = 1, et le constat parle', !!(P6 && P6.phy.nLignes === 1) && F6.length === 1 && F6[0].k === 'Traitements sans dose chiffrée' && F6[0].zero === true && /aucune dose chiffrée/.test(F6[0].f));
  const L7 = scene({ trt: [{ produit: 'Soufre', date: '2026-10-12', dose: '6 kg/ha', dose_val: 6, dose_unit: 'kg/ha', parcelles: ['Les Crais'] }] });
  T('A12 le même traitement avec sa dose : plus de constat de dose (le prix manquant, lui, se dit à part)', !L7.some(d => d.cible === 'phyto') && L7.some(d => d.cible === 'reserve' && /sans prix unitaire/.test(d.k)));
  // 7) La feuille et la porte
  scene();
  const h = M.sheet(null);
  T('A13 la feuille porte le bouton « Saisir les comptes › » vers la cible interne', h.includes('data-diag="comptes"') && h.includes('Saisir les comptes \u203A</button>'));
  T('A14 une feuille propre : ni undefined ni NaN, balises et boutons équilibrés',
    !/undefined|NaN/.test(h) && (h.match(/<div/g) || []).length === (h.match(/<\/div>/g) || []).length && (h.match(/<button/g) || []).length === (h.match(/<\/button>/g) || []).length);
  let ouvert = 0; const oc = G.openComptes; G.openComptes = () => { ouvert++; };
  try { G._pilGo('comptes'); } catch (e) { ouvert = -1; }
  G.openComptes = oc;
  T('A15 le bouton ouvre la feuille des comptes, sans quitter le Pilotage', ouvert === 1);
  T('A16 _parcConcern est lisible par le Pilotage (la même réponse que la charge)', typeof G._parcConcern === 'function');
  const av = JOURNAL_ERR.slice(e0).filter(x => /pilotage|comptes|avale/.test(String(x.msg || '') + String(x.cat || '')));
  T('A17 aucune erreur avalée dans le moteur des constats', av.length === 0);
}
function partieB(S, T) {
  const f = corps(S.cpt, '_cptRafraichir');
  let rendu = 0, regl = 0;
  const actif = { id: 'page-pilotage' };
  const ctx = { document: { querySelector: s => (s === '.page.active' ? actif : null), getElementById: () => null } };
  ctx.window = ctx; ctx.renderPilotage = () => { rendu++; }; ctx.renderReglages = () => { regl++; }; ctx.renderParcelles = () => {}; ctx.computePStats = () => {};
  vm.createContext(ctx); vm.runInContext(f + '\n_cptRafraichir(null);', ctx);
  T('B1 comptes enregistrés depuis le Pilotage : le Pilotage se redessine (le compteur « à compléter » suit)', rendu === 1 && regl === 0);
  actif.id = 'page-home'; rendu = 0; vm.runInContext('_cptRafraichir(null);', ctx);
  T('B2 ailleurs, le Pilotage ne se redessine pas pour rien', rendu === 0);
}
function partieC(S, T) {
  const css = sansCom(S.css);
  const r1 = (css.match(/\.page\.active\{display:block;animation:[^}]*\}/) || [''])[0];
  const r2 = (css.match(/\.page\.active\.nav-back\{animation:[^}]*\}/) || [''])[0];
  T('C1 le fondu d’entrée des pages est bien là (pageInFwd / pageInBack)', /pageInFwd 0\.24s/.test(r1) && /pageInBack 0\.24s/.test(r2));
  T('C2 …mais ne reste plus appliqué : ni forwards ni both (sinon la page enferme ses feuilles sous la barre du bas)', !!r1 && !!r2 && !/forwards|both/.test(r1 + r2));
  const kf = (css.match(/@keyframes pageIn(Fwd|Back)\{[^}]*\}[^}]*\}/g) || []).join(' ');
  T('C3 le fondu reste un fondu pur : aucun transform dans ses images clés (§24 CSS n°8)', kf.length > 0 && !/transform|translate/.test(kf));
  T('C4 le panneau garde son rang (z 8905) et sa marge basse tient compte du trait d’accueil', /\.pil-diagwrap\{position:fixed;inset:0;[^}]*z-index:8905/.test(S.pil) && S.pil.includes('padding:17px 17px calc(34px + env(safe-area-inset-bottom,0px))}'));
}
function partieD(S, T) {
  T('D1 l’aide du Pilotage dit ce que le bouton « à compléter » ne réclame plus, et pourquoi',
    S.uti.includes('Les travaux au temps passé (arrachage, désherbage manuel, effeuillage, vendange) n’y figurent pas') && S.uti.includes('son bouton ouvre la feuille des comptes') && S.uti.includes('Une période sans traitement n’a rien à compléter côté phyto'));
  T('D2 l’aide ne parle plus d’« entreplantation sans trous saisis » (les pieds marqués comptent)', !S.uti.includes('entreplantation sans trous saisis') && S.uti.includes('entreplantation sans pieds comptés ni trous percés'));
  T('D3 la fiche de fiabilité dit qu’une période sans traitement n’a rien à compléter', /dose chiffrée à la saisie du traitement[^']*Une période sans aucun traitement \(l\\u2019hiver\) n\\u2019a rien à compléter/.test(S.uti));
  T('D4 le guide décrit la liste à jour', S.guide.includes('entreplantation sans pieds comptés (le bouton ouvre la feuille des comptes)') && S.guide.includes("n'y figurent pas : ils n'ont pas de barème, par nature"));
  T('D5 la nouveauté 9.22 : trois corrections pour l’administrateur, au Journal', /\{ v: '9\.22', d: '2026-10-18', items: \[\n    \{ niv: 0, pour: \['admin'\], emoji: 'graphique'/.test(S.uti)
    && (S.uti.slice(S.uti.indexOf("{ v: '9.22'"), S.uti.indexOf("{ v: '9.21'")).match(/niv: 0, pour: \['admin'\]/g) || []).length === 3);
}
async function verifier(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  for (const p of [partieB, partieC, partieD]) { try { p(S, T); } catch (e) { T('plantage ' + p.name + ' : ' + (e && e.message), false); } }
  try { await partieA(S, T); } catch (e) { T('plantage partieA : ' + (e && e.message), false); }
  return out;
}
const remp = (s, a, b) => { if (s.split(a).length !== 2) throw new Error('ancre introuvable ou multiple : ' + a.slice(0, 70)); return s.replace(a, b); };
if (!CONTRE) {
  const res = await verifier(BASE); let ko = 0;
  res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  vert    ' : '  ROUGE   ') + n); });
  console.log(ko ? `MANQUE-1 : ${ko} ROUGE(S) sur ${res.length}` : `MANQUE-1 : ${res.length} vertes`); process.exit(ko ? 1 : 0);
} else {
  const DEF = [
    ['les tâches au temps passé redeviennent « sans barème »', S => ({ ...S, pil: remp(S.pil, 'return t && !t.tempsReel && !_parPieds(t) && !(_pilTacheHha(t)>0);', 'return t && !_parPieds(t) && !(_pilTacheHha(t)>0);') })],
    ['l’entreplantation retombe dans « sans barème » (vers la roue crantée)', S => ({ ...S, pil: remp(S.pil, 'return t && !t.tempsReel && !_parPieds(t) && !(_pilTacheHha(t)>0);', 'return t && !t.tempsReel && !(_pilTacheHha(t)>0);') })],
    ['le bouton de l’entreplantation renvoie encore aux tâches', S => ({ ...S, pil: remp(S.pil, "out.push({ g:'o', cible:'comptes',", "out.push({ g:'o', cible:'taches',") })],
    ['les parcelles concernées ignorées (toutes comptées à zéro, l’alerte reste)', S => ({ ...S, pil: remp(S.pil, "window._parcConcern(t.nom).length>0 : true;", 'true : true;') })],
    ['_parcConcern plus exposé par app.js', S => ({ ...S, app: remp(S.app, '\nwindow._parcConcern=_parcConcern;\n', '\n') })],
    ['le constat phyto reparle sans traitement (l’ancien test)', S => ({ ...S, pil: remp(S.pil, 'if(P && P.phy && P.phy.nLignes>0 && !P.phy.anyDose)', 'if(P && P.phy && !P.phy.anyDose)') })],
    ['les lignes du registre ne sont plus comptées', S => ({ ...S, pil: remp(S.pil, '    nLignes++;\n', '') })],
    ['la porte « comptes » disparaît de _pilGo', S => ({ ...S, pil: remp(S.pil, "if(cible==='comptes'){", "if(cible==='comptes-x'){") })],
    ['le Pilotage ne se redessine plus après les comptes', S => ({ ...S, cpt: remp(S.cpt, "if(pp&&pp.id==='page-pilotage'&&", "if(pp&&pp.id==='page-x'&&") })],
    ['le fondu redevient « forwards » (le bas recoupé)', S => ({ ...S, css: remp(S.css, '.page.active{display:block;animation:pageInFwd 0.24s cubic-bezier(.22,.61,.36,1);}', '.page.active{display:block;animation:pageInFwd 0.24s cubic-bezier(.22,.61,.36,1) forwards;}') })],
    ['la marge basse perd le trait d’accueil', S => ({ ...S, pil: remp(S.pil, 'padding:17px 17px calc(34px + env(safe-area-inset-bottom,0px))}', 'padding:17px 17px 34px}') })],
    ['l’aide reparle d’« entreplantation sans trous saisis »', S => ({ ...S, uti: remp(S.uti, 'entreplantation sans pieds comptés ni trous percés', 'entreplantation sans trous saisis') })],
    ['le guide perd la phrase des travaux au temps passé', S => ({ ...S, guide: remp(S.guide, "n'y figurent pas : ils n'ont pas de barème, par nature", "n'y figurent pas") })],
  ];
  let muettes = 0;
  for (const [lib, f] of DEF) {
    let rougit = false;
    try { const res = await verifier(f(BASE)); rougit = res.some(([, ok]) => !ok); } catch (e) { rougit = true; console.log('    (' + e.message + ')'); }
    console.log((rougit ? '  rougit   ' : '  MUETTE   ') + lib); if (!rougit) muettes++;
  }
  console.log(muettes ? `MANQUE-1 contre-épreuves : ${muettes} MUETTE(S) sur ${DEF.length}` : `MANQUE-1 contre-épreuves : ${DEF.length} sur ${DEF.length} rougissent`);
  process.exit(muettes ? 1 : 0);
}
