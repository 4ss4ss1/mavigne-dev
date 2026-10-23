/* ───────────────────────────────────────────────────────
   HARNAIS — PIL-FIX-1 (§440) : LES JOURS OUVRÉS DU PILOTAGE SE COMPTENT SUR LE PLANNING
   Lancer :          node scripts/mv-harnais-pilfix1.mjs
   Contre-épreuves : node scripts/mv-harnais-pilfix1.mjs --contre

   POURQUOI IL EXISTE
   Audit du 23/10 : _pilWdBetween et _pilWdDateObj comptaient lundi→vendredi du calendrier, rien d'autre. Le 11 novembre
   et le 25 décembre étaient des jours de marge, et les vendredis chômés de l'annualisation aussi. Règle de Nico (10/10) :
   « toujours se baser sur le planning ». Ce harnais EXÉCUTE les vraies fonctions (pilotage.js : _pilPrevuLe,
   _pilJourDomaine, _pilFerieLe, _pilJourCalendrier, _pilSaisiAuTravail, _pilCompteurOuvre, _pilWdBetween, _pilWdDateObj ;
   planning.js : _feriesY, _mvEasterMD) sur le VRAI modèle intégré 2026 (PLAN_DEF.standard, lu dans planning.js) :
   1. un jour compte s'il a des heures au modèle ; le compte est recalculé à part, jour par jour, et comparé ;
   2. le 11 novembre ne compte pas, un vendredi chômé de novembre non plus, un mardi ordinaire si ;
   3. un férié portant des heures au modèle (recalage d'une année sur l'autre) ne compte pas sans saisie ; avec une saisie
      au travail, si ; un samedi saisi au travail compte ;
   4. sans équipe ou sans planning chargé : lundi→vendredi, fériés retirés ;
   5. le signe de _pilWdBetween ; _pilWdDateObj tombe sur le N-ième jour travaillé ; la fenêtre de chantier compte 7 j/7 ;
   6. un planning muet ne fait pas courir _pilWdDateObj 4 000 jours ;
   7. la marge et les échéances lisent bien _pilWdBetween ; la fiche « i » ne dit plus « lundi à vendredi » ; le
      WHATS_NEW l'annonce en « À vérifier » ; la liste joue ce fichier.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { pil: lire('src/pilotage.js'), plan: lire('src/planning.js'), utils: lire('src/utils.js'), liste: lire('scripts/mv-harnais-liste.mjs') };

function corps(src, nom) {
  const i = src.indexOf('function ' + nom + '(');
  if (i < 0) throw new Error('fonction absente : ' + nom);
  const j = src.indexOf('{', i); let p = 0, k = j;
  for (; k < src.length; k++) { const c = src[k]; if (c === '{') p++; else if (c === '}' && --p === 0) break; }
  return src.slice(i, k + 1);
}
function litteral(src, re) {
  const i = src.search(re); if (i < 0) throw new Error('littéral absent : ' + re);
  const j = src.indexOf('{', i); let p = 0, k = j;
  for (; k < src.length; k++) { const c = src[k]; if (c === '{') p++; else if (c === '}' && --p === 0) break; }
  return src.slice(j, k + 1);
}
const muetJ = (S) => { const m = /var _PIL_MUET_J=(\d+);/.exec(S.pil); if (!m) throw new Error('_PIL_MUET_J absent'); return m[1]; };

// Monte les vraies fonctions. o.grille : heures du modèle par 'aaaa-mm-jj' ; o.saisies : { nom: { iso: heures } } ;
// o.membres : liste ; o.planning : false = planning non chargé ; o.muet : personne n'est jamais prévu.
function monter(S, o) {
  const PLAN_DEF = (0, eval)('(' + litteral(S.plan, /(var|const|let)\s+PLAN_DEF\s*=/) + ')');
  const std = PLAN_DEF.standard;
  const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const heuresModele = (d) => {
    const k = iso(d); if (o.grille && k in o.grille) return o.grille[k];
    if (o.muet) return 0;
    return d.getFullYear() === 2026 ? ((std[d.getMonth()] || {})[d.getDate()] || 0) : 0;
  };
  const PE = {};
  for (const [nom, jours] of Object.entries(o.saisies || {})) for (const [k, h] of Object.entries(jours)) {
    const [y, m, dd] = k.split('-').map(Number); PE[nom] = PE[nom] || {}; PE[nom][y] = PE[nom][y] || {}; PE[nom][y][m - 1] = PE[nom][y][m - 1] || {}; PE[nom][y][m - 1][dd] = { h };
  }
  const window = { MEMBRES: o.membres || [], PLANNING_ENTRIES: PE, _mvEnContratLe: () => true, _mvAvale: () => {}, logError: () => {} };
  if (o.planning !== false) {
    window._planPrevuPersRange = (m, d0) => heuresModele(d0);
    window._planWorkPersRange = (m, d0) => { const e = ((PE[m.nom] || {})[d0.getFullYear()] || {})[d0.getMonth()]; const x = e && e[d0.getDate()]; return x ? x.h : heuresModele(d0); };
  }
  const ctx = { window };
  vm.createContext(ctx);
  const src = ['var _MV_FERIES_CACHE={};', corps(S.plan, '_mvEasterMD'), corps(S.plan, '_feriesY'), 'window._feriesY=_feriesY;',
    'var _PIL_MUET_J=' + muetJ(S) + ';',
    ...['_pilPhotoIso', '_pilMembresActifs', '_pilPrevuLe', '_pilJourDomaine', '_pilFerieLe', '_pilJourCalendrier', '_pilSaisiAuTravail',
      '_pilCompteurOuvre', '_pilWdDateObj', '_pilWdBetween'].map((n) => corps(S.pil, n))].join('\n');
  vm.runInContext(src, ctx);
  return ctx;
}
const D = (s) => new Date(s + 'T00:00:00');
const EQ = [{ nom: 'Léa' }, { nom: 'Marc' }, { nom: 'Chloé', bureau: true }];

let ok = 0, ko = 0;
const t = (nom, cond, det) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (det ? '\n      → ' + det : '')); } };

function jouer(S) {
  const PLAN_DEF = (0, eval)('(' + litteral(S.plan, /(var|const|let)\s+PLAN_DEF\s*=/) + ')'), std = PLAN_DEF.standard;
  const A = monter(S, { membres: EQ });
  // 1 · le compte, recalculé à part sur le modèle
  let attendu = 0, cal = 0;
  for (let d = D('2026-10-24'); d <= D('2026-11-15'); d.setDate(d.getDate() + 1)) {
    if (((std[d.getMonth()] || {})[d.getDate()] || 0) > 0) attendu++;
    const w = d.getDay(); if (w !== 0 && w !== 6) cal++;
  }
  const n = A._pilWdBetween(D('2026-10-23'), D('2026-11-15'));
  t('① 23 oct → 15 nov : ' + n + ' jours travaillés au modèle (recompte à part : ' + attendu + ')', n === attendu, 'obtenu ' + n);
  t('① … moins que les ' + cal + ' jours lundi→vendredi d’avant (11 nov. et vendredis chômés retirés)', n < cal, n + ' contre ' + cal);
  // 2 · les jours un par un
  t('② mercredi 11 novembre 2026 (férié) : ne compte pas', A._pilJourDomaine(D('2026-11-11')) === false);
  const venChome = ['2026-11-06', '2026-11-13', '2026-11-20', '2026-11-27'].filter((k) => !(((std[10] || {})[Number(k.slice(8))] || 0) > 0));
  t('② un vendredi chômé de novembre au modèle (' + (venChome[0] || 'aucun') + ') : ne compte pas', venChome.length > 0 && A._pilJourDomaine(D(venChome[0])) === false);
  t('② mardi 10 novembre : compte', A._pilJourDomaine(D('2026-11-10')) === true);
  t('② vendredi 25 décembre (Noël) : ne compte pas', A._pilJourDomaine(D('2026-12-25')) === false);
  // 3 · le férié recalé, la saisie
  const B = monter(S, { membres: EQ, grille: { '2027-11-11': 7, '2027-11-10': 7 } });
  t('③ 11 novembre 2027 avec 7 h au modèle recalé, sans saisie : ne compte pas', B._pilJourDomaine(D('2027-11-11')) === false);
  t('③ … la veille, 10 novembre 2027 avec 7 h : compte', B._pilJourDomaine(D('2027-11-10')) === true);
  const C = monter(S, { membres: EQ, grille: { '2027-11-11': 7 }, saisies: { 'Léa': { '2027-11-11': 7, '2026-10-24': 6 } } });
  t('③ le même férié saisi au travail pour Léa : compte', C._pilJourDomaine(D('2027-11-11')) === true);
  t('③ samedi 24 octobre 2026 saisi au travail : compte ; sans saisie : non', C._pilJourDomaine(D('2026-10-24')) === true && A._pilJourDomaine(D('2026-10-24')) === false);
  const C2 = monter(S, { membres: EQ, saisies: { 'Léa': { '2026-11-11': 0 } } });
  t('③ un férié saisi sans heures (congé, absence) : ne compte pas', C2._pilJourDomaine(D('2026-11-11')) === false);
  t('③ Chloé (bureau) saisie un férié : ne fait pas un jour du domaine', monter(S, { membres: EQ, saisies: { 'Chloé': { '2026-11-11': 7 } } })._pilJourDomaine(D('2026-11-11')) === false);
  // 4 · les replis
  const E = monter(S, { membres: [] });
  t('④ sans équipe : mardi 10 nov. oui, mercredi 11 nov. (férié) non, samedi non', E._pilJourDomaine(D('2026-11-10')) === true && E._pilJourDomaine(D('2026-11-11')) === false && E._pilJourDomaine(D('2026-11-14')) === false);
  const F = monter(S, { membres: EQ, planning: false });
  t('④ planning non chargé : mardi oui, férié non, dimanche non', F._pilJourDomaine(D('2026-11-10')) === true && F._pilJourDomaine(D('2026-11-11')) === false && F._pilJourDomaine(D('2026-11-15')) === false);
  t('④ sans équipe, Noël → jour de l’An 2026 : 4 jours (28, 29, 30, 31 déc.)', E._pilWdBetween(D('2026-12-25'), D('2027-01-01')) === 4, 'obtenu ' + E._pilWdBetween(D('2026-12-25'), D('2027-01-01')));
  // 5 · signe, N-ième jour, chantier
  t('⑤ _pilWdBetween(b, a) = −_pilWdBetween(a, b)', A._pilWdBetween(D('2026-11-15'), D('2026-10-23')) === -n);
  t('⑤ même jour : 0', A._pilWdBetween(D('2026-11-10'), D('2026-11-10')) === 0);
  const ret = A._pilWdBetween(D('2026-11-17'), D('2026-11-15')), lun = ((std[10] || {})[16] || 0) > 0, mar = ((std[10] || {})[17] || 0) > 0;
  t('⑤ fin mardi 17 nov., objectif dimanche 15 nov. : ' + (-ret) + ' jour(s) de retard (lundi et mardi travaillés : 2)', lun && mar && ret === -2, 'obtenu ' + ret);
  t('⑤ fin dimanche 15 nov., objectif vendredi 13 nov. : à l’heure (0), pas un jour de retard', A._pilWdBetween(D('2026-11-15'), D('2026-11-13')) === 0, 'obtenu ' + A._pilWdBetween(D('2026-11-15'), D('2026-11-13')));
  let k = 0, dd = D('2026-10-23'); while (k < 10) { dd.setDate(dd.getDate() + 1); if (((std[dd.getMonth()] || {})[dd.getDate()] || 0) > 0) k++; }
  const r = A._pilWdDateObj(10, D('2026-10-23'), false);
  t('⑤ _pilWdDateObj(10, 23 oct.) = le 10ᵉ jour travaillé au modèle (' + r.toISOString().slice(0, 10) + ')', r.getTime() === dd.getTime(), 'attendu ' + dd.toDateString());
  const ch = A._pilWdDateObj(10, D('2026-10-23'), true);
  t('⑤ fenêtre de chantier : 7 j/7, 10 jours après le 23 oct. = 2 nov.', ch.getFullYear() === 2026 && ch.getMonth() === 10 && ch.getDate() === 2);
  // 6 · planning muet
  const G = monter(S, { membres: EQ, muet: true });
  const g = G._pilWdDateObj(10, D('2026-10-23'), false), jours = Math.round((g - D('2026-10-23')) / 864e5);
  t('⑥ planning muet : _pilWdDateObj(10) s’arrête en ' + jours + ' jours (repli calendrier après ' + muetJ(S) + ' j muets), pas 4 000', jours > 0 && jours <= Number(muetJ(S)) + 20);
  t('⑥ planning muet : _pilWdBetween sur 4 mois reste fini et positif', (() => { const x = G._pilWdBetween(D('2026-10-23'), D('2027-02-23')); return x > 0 && x < 90; })());
  // 7 · branchements et textes
  t('⑦ la marge et la fin d’Aujourd’hui lisent _pilWdBetween / _pilWdDateObj', /marge=\(proj&&obj\)\?_pilWdBetween\(proj,obj\)/.test(corps(S.pil, '_pilMargeCalc')) && /_pilWdDateObj\(seasonJ,start/.test(corps(S.pil, '_pilMargeCalc')));
  t('⑦ les Échéances par tâche lisent _pilWdBetween', /_pilWdBetween\(m\.today,s\.fin\)/.test(corps(S.pil, '_pilPanelEcheances')));
  t('⑦ plus aucun test getDay() dans _pilWdBetween ni _pilWdDateObj', !/getDay\(\)/.test(corps(S.pil, '_pilWdBetween') + corps(S.pil, '_pilWdDateObj')));
  const i = S.utils.indexOf("'pil.marge':"), fiche = S.utils.slice(i, S.utils.indexOf('] },', i));
  t('⑦ la fiche « i » de la marge dit le planning et les fériés, plus « (lundi à vendredi) »', i > 0 && /jours travaillés au planning/.test(fiche) && /férié/.test(fiche) && !/\(lundi (à|\\u00e0) vendredi\)/.test(fiche));
  const wn = /\{ v: '([\d.]+)', d: '[^']*', items: \[\s*\{ niv: (\d), pour: \['admin'\], emoji: 'calendrier', titre: 'Pilotage : les jours/.exec(S.utils);
  const appv = (/export const APP_VERSION = '([\d.]+)'/.exec(S.utils) || [])[1];
  t('⑦ le WHATS_NEW l’annonce en « À vérifier » (niv 2), à la version de l’appli', !!wn && wn[2] === '2' && wn[1] === appv, wn ? wn[1] + ' niv ' + wn[2] + ' / APP ' + appv : 'absent');
  t('⑦ la liste des harnais joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-pilfix1.mjs'") > 0 && S.liste.indexOf("mv-harnais-pilfix1.mjs --contre'") > 0);
}

if (!CONTRE) {
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  const R = (S, a, b) => Object.assign({}, S, { pil: S.pil.split(a).join(b) });
  const mutants = [
    ['les jours ouvrés reviennent au lundi→vendredi', (S) => R(S, 'd.setDate(d.getDate()+1); if(ouv(d)) n++; }', 'd.setDate(d.getDate()+1); var _w=d.getDay(); if(_w!==0&&_w!==6) n++; }')],
    ['le sens « retard » remarche à reculons ([objectif, fin))', (S) => R(R(S, 'var sign=end>d?1:-1; if(sign<0){ var x=d; d=end; end=x; }', 'var sign=end>d?1:-1;'), 'd.setDate(d.getDate()+1); if(ouv(d)) n++; }', 'd.setDate(d.getDate()+sign); if(ouv(d)) n++; }')],
    ['_pilWdDateObj revient au lundi→vendredi', (S) => R(S, 'dt.setDate(dt.getDate()+1); if(ouv(dt)) added++;', 'dt.setDate(dt.getDate()+1); var _w=dt.getDay(); if(chantier||(_w!==0&&_w!==6)) added++;')],
    ['un férié avec des heures au modèle redevient prévu', (S) => R(S, '  if(_pilFerieLe(d0)) return _pilSaisiAuTravail(m, d0);\n', '')],
    ['le repli calendrier oublie les fériés', (S) => R(S, 'return w!==0 && w!==6 && !_pilFerieLe(dt); }', 'return w!==0 && w!==6; }')],
    ['la saisie sans heures fait un jour travaillé', (S) => R(S, 'return (Number(window._planWorkPersRange(m, d0, d0))||0)>0; }', 'return true; }')],
    ['la garde du planning muet disparaît', (S) => R(S, 'var _PIL_MUET_J=45;', 'var _PIL_MUET_J=100000;')],
    ['la fenêtre de chantier n’est plus 7 j/7', (S) => R(S, '    if(chantier) return true;\n', '')],
    ['la fiche « i » redit « lundi à vendredi »', (S) => { const i = S.utils.indexOf("'La <b>marge</b> compte les"); const j = S.utils.indexOf("\n", i); return Object.assign({}, S, { utils: S.utils.slice(0, i) + "'La <b>marge</b> compte les jours ouvrés (lundi à vendredi).'," + S.utils.slice(j) }); }],
    ['la liste ne joue plus le harnais', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-pilfix1.mjs'").join("mv-harnais-pilfixX.mjs'") })],
  ];
  let bons = 0;
  for (const [nom, mut] of mutants) {
    const S = mut(S0);
    if (S.pil === S0.pil && S.utils === S0.utils && S.liste === S0.liste) { console.log('  \x1b[31m✗\x1b[0m mutant sans effet : ' + nom); continue; }
    ok = 0; ko = 0; const log = console.log; console.log = () => {};
    try { jouer(S); } catch (e) { ko++; }
    console.log = log;
    if (ko > 0) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom + ' (' + ko + ' rouge' + (ko > 1 ? 's' : '') + ')'); }
    else console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom);
  }
  console.log('\n' + (bons === mutants.length ? '\x1b[32mVERT\x1b[0m' : '\x1b[31mROUGE\x1b[0m') + ' — ' + bons + '/' + mutants.length + ' contre-épreuves mordent');
  process.exit(bons === mutants.length ? 0 : 1);
}
